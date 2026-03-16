from ..models import Activity

def create_team_activity(user, team, action_type='team_join'):
    """Create activity when user interacts with teams"""
    action_map = {
        'team_join': ('Joined Team', f'You joined team "{team.name}"'),
        'team_create': ('Created Team', f'You created team "{team.name}"'),
        'team_leave': ('Left Team', f'You left team "{team.name}"'),
    }
    title, desc = action_map.get(action_type, ('Team Activity', ''))
    
    Activity.objects.create(
        user=user,
        type=action_type,
        title=title,
        description=desc,
        team=team,
        metadata={'team_id': team.id, 'team_name': team.name},
        is_important=action_type == 'team_create'  # Highlight team creation
    )

def create_judge_activity(user, made_by=None):
    """Create activity when user becomes a judge"""
    description = f"You are now a judge"
    if made_by and made_by != user:
        description = f"{made_by.username} made you a judge"
    
    Activity.objects.create(
        user=user,
        type='became_judge',
        title='Became a Judge',
        description=description,
        metadata={
            'made_by': made_by.username if made_by else None,
            'made_by_id': made_by.id if made_by else None,
            'role': 'judge'
        },
        is_important=True
    )

def create_password_change_activity(user):
    """Create activity when user changes password"""
    try:
        Activity.objects.create(
            user=user,
            type='password_change',
            title='🔐 Password Changed',
            description='You changed your account password',
            is_important=False
        )
    except Exception as e:
        print(f"Error creating password change activity: {e}")

def create_organizer_activity(user, made_by=None):
    """Create activity when user becomes an organizer"""
    description = f"You are now an organizer"
    if made_by and made_by != user:
        description = f"{made_by.username} made you an organizer"
    
    Activity.objects.create(
        user=user,
        type='became_organizer',
        title='Became an Organizer',
        description=description,
        metadata={
            'made_by': made_by.username if made_by else None,
            'made_by_id': made_by.id if made_by else None,
            'role': 'organizer'
        },
        is_important=True
    )

def create_role_removed_activity(user, role, removed_by=None):
    """Create activity when a role is removed"""
    description = f"Your {role} role has been removed"
    if removed_by and removed_by != user:
        description = f"{removed_by.username} removed your {role} role"
    
    Activity.objects.create(
        user=user,
        type='role_removed',
        title='Role Removed',
        description=description,
        metadata={
            'removed_by': removed_by.username if removed_by else None,
            'removed_by_id': removed_by.id if removed_by else None,
            'role': role
        }
    )

def create_submission_activity(user, submission):
    """Create activity when user submits a project"""
    Activity.objects.create(
        user=user,
        type='submission',
        title='Project Submitted',
        description=f'Your project "{submission.title}" has been submitted',
        submission=submission,
        metadata={'submission_id': submission.id, 'title': submission.title},
        is_important=True
    )

def create_feedback_activity(user, feedback):
    """Create activity when user receives feedback"""
    Activity.objects.create(
        user=user,
        type='feedback',
        title='Feedback Received',
        description=f'You received feedback on "{feedback.submission.title}"',
        submission=feedback.submission,
        metadata={
            'feedback_id': feedback.id,
            'score': feedback.score,
            'submission_title': feedback.submission.title
        },
        is_important=True
    )

def create_review_activity(user, submission):
    """Create activity when submission is reviewed"""
    Activity.objects.create(
        user=user,
        type='review',
        title='Submission Reviewed',
        description=f'Your submission "{submission.title}" has been reviewed',
        submission=submission,
        metadata={'submission_id': submission.id, 'title': submission.title}
    )

def create_event_activity(user, event):
    """Create activity when user registers for event"""
    Activity.objects.create(
        user=user,
        type='event_register',
        title='Registered for Event',
        description=f'You registered for "{event.name}"',
        event=event,
        metadata={'event_id': event.id, 'event_name': event.name}
    )

def create_winner_activity(user, submission):
    """Create activity when user wins a hackathon"""
    Activity.objects.create(
        user=user,
        type='winner',
        title='🏆 Winner!',
        description=f'Your project "{submission.title}" won!',
        submission=submission,
        metadata={'submission_id': submission.id, 'title': submission.title},
        is_important=True
    )

# ========== NEW FOLLOW ACTIVITY (FIXED INDENTATION) ==========
def create_follow_activity(follower, followed):
    """Create activity when someone follows another user"""
    # Activity for the follower
    Activity.objects.create(
        user=follower,
        type='follow',
        title=f'Started following {followed.username}',
        description=f'You are now following {followed.username}',
        metadata={
            'follower_id': follower.id,
            'follower_username': follower.username,
            'followed_id': followed.id,
            'followed_username': followed.username,
        },
        is_important=False
    )
    
    # Activity for the followed user (notification)
    Activity.objects.create(
        user=followed,
        type='new_follower',
        title=f'{follower.username} started following you',
        description=f'{follower.username} is now following you',
        metadata={
            'follower_id': follower.id,
            'follower_username': follower.username,
        },
        is_important=False
    )