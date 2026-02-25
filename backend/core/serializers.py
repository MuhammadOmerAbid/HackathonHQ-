from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post

User = get_user_model()

class PostSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')  # show username in output

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'owner', 'created_at']

# Show users API serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_active"]  # <-- add this


# Register API serializer
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"]
        )
        return user

#hackathon plateform 
from rest_framework import serializers
from .models import Event, Team, Submission, JudgeFeedback
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]

class EventSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    class Meta:
        model = Event
        fields = "__all__"

class TeamSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    class Meta:
        model = Team
        fields = "__all__"

class SubmissionSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    class Meta:
        model = Submission
        fields = "__all__"

class JudgeFeedbackSerializer(serializers.ModelSerializer):
    judge = UserSerializer(read_only=True)
    class Meta:
        model = JudgeFeedback
        fields = "__all__"