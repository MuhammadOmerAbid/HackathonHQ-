from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Event, Team, Submission, JudgeFeedback, UserProfile

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'is_organizer', 'is_judge', 'organization_name', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name",
                  "is_active", "is_staff", "is_superuser", "profile"]

class PostSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    owner_details = UserSerializer(source='owner', read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'owner', 'owner_details', 'created_at']

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
        UserProfile.objects.create(user=user)
        return user

class EventSerializer(serializers.ModelSerializer):
    organizer_details = UserSerializer(source='organizer', read_only=True)
    organizer_username = serializers.ReadOnlyField(source='organizer.username')
    teams_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = ['id', 'name', 'description', 'start_date', 'end_date',
                  'is_premium', 'organizer', 'organizer_username', 'organizer_details',
                  'teams_count']
        read_only_fields = ['organizer']
    
    def get_teams_count(self, obj):
        return obj.teams.count()

class TeamSerializer(serializers.ModelSerializer):
    members_details = UserSerializer(source='members', many=True, read_only=True)
    event_name = serializers.ReadOnlyField(source='event.name')
    leader_details = UserSerializer(source='leader', read_only=True)
    submissions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'description', 'max_members', 'event', 'event_name',
            'leader', 'leader_details', 'members', 'members_details',
            'created_at', 'submissions_count'
        ]
        read_only_fields = ['members', 'leader']
    
    def get_submissions_count(self, obj):
        return obj.submissions.count()

class SubmissionSerializer(serializers.ModelSerializer):
    # Team details
    team_details = TeamSerializer(source='team', read_only=True)
    team_name = serializers.ReadOnlyField(source='team.name')
    
    # Event via team
    event_name = serializers.ReadOnlyField(source='team.event.name')
    event = serializers.SerializerMethodField()
    
    # Submitted by
    submitted_by_username = serializers.ReadOnlyField(source='submitted_by.username')
    submitted_by_details = UserSerializer(source='submitted_by', read_only=True)
    
    # Feedback stats
    feedback_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    
    class Meta:
        model = Submission
        fields = [
            'id',
            'team', 'team_details', 'team_name',
            'event', 'event_name',
            'submitted_by', 'submitted_by_username', 'submitted_by_details',
            'title', 'description',
            'file', 'created_at', 'score',
            'is_reviewed', 'is_winner',
            'winner_place', 'winner_prize',
            'feedback_count', 'average_score',
        ]
        read_only_fields = ['score', 'submitted_by', 'is_reviewed']

    def get_event(self, obj):
        event = obj.team.event if obj.team else None
        if not event:
            return None
        return {
            'id': event.id,
            'name': event.name,
            'start_date': event.start_date,
            'end_date': event.end_date,
        }
    
    def get_feedback_count(self, obj):
        return obj.feedback.count()
    
    def get_average_score(self, obj):
        if obj.feedback.exists():
            return sum(f.score for f in obj.feedback.all()) / obj.feedback.count()
        return None

class JudgeFeedbackSerializer(serializers.ModelSerializer):
    judge_details = UserSerializer(source='judge', read_only=True)
    judge_username = serializers.ReadOnlyField(source='judge.username')
    submission_title = serializers.ReadOnlyField(source='submission.title')
    
    class Meta:
        model = JudgeFeedback
        fields = ['id', 'submission', 'submission_title', 'judge', 'judge_details',
                  'judge_username', 'score', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['judge']