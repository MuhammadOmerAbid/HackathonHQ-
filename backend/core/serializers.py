from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from .models import Post, Event, Team, Submission, JudgeFeedback, UserProfile

User = get_user_model()

# ========== USER PROFILE SERIALIZER ==========
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'is_organizer', 'organization_name', 'created_at']

# ========== USER SERIALIZER (Single version) ==========
class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active", "is_staff", "is_superuser", "profile"]

# ========== POST SERIALIZER ==========
class PostSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    owner_details = UserSerializer(source='owner', read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'owner', 'owner_details', 'created_at']

# ========== REGISTER SERIALIZER ==========
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"]
        )
        # Create a profile for the new user
        UserProfile.objects.create(user=user)
        return user

# ========== EVENT SERIALIZER ==========
class EventSerializer(serializers.ModelSerializer):
    organizer_details = UserSerializer(source='organizer', read_only=True)
    organizer_username = serializers.ReadOnlyField(source='organizer.username')
    
    class Meta:
        model = Event
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 
                  'is_premium', 'organizer', 'organizer_username', 'organizer_details']
        read_only_fields = ['organizer']  # organizer is set automatically in view

# ========== TEAM SERIALIZER ==========
class TeamSerializer(serializers.ModelSerializer):
    members_details = UserSerializer(source='members', many=True, read_only=True)
    event_name = serializers.ReadOnlyField(source='event.name')
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'event', 'event_name', 'members', 'members_details', 'created_at']
        read_only_fields = ['members']  # members are added via custom action

# ========== SUBMISSION SERIALIZER ==========
class SubmissionSerializer(serializers.ModelSerializer):
    team_details = TeamSerializer(source='team', read_only=True)
    team_name = serializers.ReadOnlyField(source='team.name')
    
    class Meta:
        model = Submission
        fields = ['id', 'team', 'team_details', 'team_name', 'title', 'description', 
                  'file', 'created_at', 'score']
        read_only_fields = ['score']  # score is set by judges

# ========== JUDGE FEEDBACK SERIALIZER ==========
class JudgeFeedbackSerializer(serializers.ModelSerializer):
    judge_details = UserSerializer(source='judge', read_only=True)
    judge_username = serializers.ReadOnlyField(source='judge.username')
    submission_title = serializers.ReadOnlyField(source='submission.title')
    
    class Meta:
        model = JudgeFeedback
        fields = ['id', 'submission', 'submission_title', 'judge', 'judge_details', 
                  'judge_username', 'score', 'comment', 'created_at']
        read_only_fields = ['judge']  # judge is set automatically in view