from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.utils import get_md5_hash_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


def _reactivate_if_expired(user):
    if not user:
        return user
    profile = getattr(user, "profile", None)
    if not profile:
        return user
    now = timezone.now()
    changed = False
    if profile.suspended_until and profile.suspended_until <= now:
        profile.suspended_until = None
        changed = True
    if profile.banned_until and profile.banned_until <= now:
        profile.banned_until = None
        profile.ban_reason = None
        changed = True
    if changed:
        profile.save(update_fields=["suspended_until", "banned_until", "ban_reason"])
        user.is_active = True
        user.save(update_fields=["is_active"])
    return user


def _latest_moderation_reason(user, action_type):
    if not user:
        return ""
    try:
        from .models import ModerationAction
        item = (
            ModerationAction.objects
            .filter(target_user=user, action_type=action_type)
            .order_by("-created_at")
            .first()
        )
        if item and item.reason:
            return str(item.reason).strip()
    except Exception:
        return ""
    return ""


def _banned_record_by_user_id(user_id):
    if not user_id:
        return None
    try:
        from .models import BannedAccount
        return (
            BannedAccount.objects.filter(user_id=user_id)
            .order_by("-created_at")
            .first()
        )
    except Exception:
        return None


def _banned_record_by_username(username):
    if not username:
        return None
    try:
        from .models import BannedAccount
        return (
            BannedAccount.objects.filter(username__iexact=username)
            .order_by("-created_at")
            .first()
        )
    except Exception:
        return None


def _moderation_block_for_user(user):
    if not user:
        return None
    profile = getattr(user, "profile", None)
    if not profile:
        return None
    now = timezone.now()
    if profile.banned_until and profile.banned_until > now:
        return {
            "type": "ban",
            "until": profile.banned_until,
            "reason": profile.ban_reason or _latest_moderation_reason(user, "ban") or "",
        }
    if profile.suspended_until and profile.suspended_until > now:
        return {
            "type": "suspend",
            "until": profile.suspended_until,
            "reason": _latest_moderation_reason(user, "suspend") or "",
        }
    return None


def _moderation_error_payload(block):
    action = block.get("type")
    until = block.get("until")
    until_text = until.isoformat() if hasattr(until, "isoformat") else None
    reason = block.get("reason") or ""
    message = block.get("message") or ""

    if action == "ban":
        code = "user_banned"
        base = "Your account has been banned."
    else:
        code = "user_suspended"
        base = "Your account has been suspended."

    detail = f"{base} Until {until_text}." if until_text else base
    return {
        "detail": detail,
        "code": code,
        "type": action,
        "until": until_text,
        "reason": reason,
        "message": message,
    }


class AutoReactivateJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user_model = get_user_model()
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError as e:
            raise InvalidToken("Token contained no recognizable user identification") from e

        try:
            user = user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except user_model.DoesNotExist as e:
            banned = _banned_record_by_user_id(user_id)
            if banned:
                raise AuthenticationFailed(
                    _moderation_error_payload({
                        "type": "ban",
                        "until": None,
                        "reason": banned.reason or "",
                        "message": banned.message or "",
                    })
                ) from e
            raise AuthenticationFailed("User not found", code="user_not_found") from e

        if api_settings.CHECK_USER_IS_ACTIVE and not user.is_active:
            _reactivate_if_expired(user)

        block = _moderation_block_for_user(user)
        if block:
            raise AuthenticationFailed(_moderation_error_payload(block))

        if api_settings.CHECK_USER_IS_ACTIVE and not user.is_active:
            raise AuthenticationFailed("User is inactive", code="user_inactive")

        if api_settings.CHECK_REVOKE_TOKEN:
            if validated_token.get(api_settings.REVOKE_TOKEN_CLAIM) != get_md5_hash_password(user.password):
                raise AuthenticationFailed("The user's password has been changed.", code="password_changed")

        return user


class AutoReactivateTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        user_model = get_user_model()
        username = attrs.get(self.username_field)
        if username:
            try:
                user = user_model.objects.get(**{self.username_field: username})
            except user_model.DoesNotExist:
                user = None
        if not user:
            banned = _banned_record_by_username(username)
            if banned:
                raise AuthenticationFailed(
                    _moderation_error_payload({
                        "type": "ban",
                        "until": None,
                        "reason": banned.reason or "",
                        "message": banned.message or "",
                    })
                )
        if user and not user.is_active:
            _reactivate_if_expired(user)
        block = _moderation_block_for_user(user)
        if block:
            raise AuthenticationFailed(_moderation_error_payload(block))
        return super().validate(attrs)
