from rest_framework import permissions

class IsOrganizerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow organizers and admins to create events.
    """
    
    def has_permission(self, request, view):
        # Allow anyone to view events (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # For creating/updating/deleting events, check if user is organizer or admin
        return request.user and (
            request.user.is_staff or 
            request.user.is_superuser or 
            (hasattr(request.user, 'profile') and request.user.profile.is_organizer)
        )