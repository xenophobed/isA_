/**
 * ============================================================================
 * OrganizationMembersPanel - Member Management Interface
 * ============================================================================
 * 
 * Comprehensive UI for managing organization members and invitations.
 * Displays current members, pending invitations, and provides actions
 * for role management and member removal.
 */

import React, { useState, useCallback } from 'react';
import InviteMemberModal, { InviteMemberData } from './InviteMemberModal';

export interface Member {
  userId: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  joinedAt: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  invitedByName: string;
  message?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}

export interface OrganizationMembersPanelProps {
  // Data
  organizationName: string;
  members: Member[];
  invitations: Invitation[];
  currentUserId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  
  // Loading States
  isLoading: boolean;
  inviteLoading: boolean;
  
  // Errors
  error?: string | null;
  inviteError?: string | null;
  
  // Actions
  onInviteMember: (data: InviteMemberData) => Promise<void>;
  onUpdateMemberRole: (userId: string, role: string, permissions?: string[]) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onResendInvitation: (invitationId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const OrganizationMembersPanel: React.FC<OrganizationMembersPanelProps> = ({
  organizationName,
  members,
  invitations,
  currentUserId,
  currentUserRole,
  isLoading,
  inviteLoading,
  error,
  inviteError,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  onCancelInvitation,
  onResendInvitation,
  onRefresh
}) => {
  // State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Permission Helpers
  const canInviteMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canRemoveMembers = currentUserRole === 'owner';

  // Event Handlers
  const handleInviteMember = useCallback(async (data: InviteMemberData) => {
    await onInviteMember(data);
    setShowInviteModal(false);
  }, [onInviteMember]);

  const handleRemoveMember = useCallback(async (userId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      await onRemoveMember(userId);
    }
  }, [onRemoveMember]);

  const handleCancelInvitation = useCallback(async (invitationId: string, email: string) => {
    if (window.confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      await onCancelInvitation(invitationId);
    }
  }, [onCancelInvitation]);

  // Utility Functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeStyle = (role: string) => {
    const styles = {
      owner: { background: '#dc2626', color: 'white' },
      admin: { background: '#f59e0b', color: 'white' },
      member: { background: '#10b981', color: 'white' }
    };
    return styles[role as keyof typeof styles] || styles.member;
  };

  const getStatusBadgeStyle = (status: string) => {
    const styles = {
      active: { background: '#10b981', color: 'white' },
      pending: { background: '#f59e0b', color: 'white' },
      expired: { background: '#ef4444', color: 'white' },
      cancelled: { background: '#6b7280', color: 'white' }
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Members & Invitations
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage {organizationName} team members
          </p>
        </div>
        
        {canInviteMembers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
            style={{ background: 'var(--color-accent)' }}
          >
            + Invite Member
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div 
          className="p-4 rounded-md border-l-4 border-red-500"
          style={{ background: '#fef2f2', color: '#dc2626' }}
        >
          <p className="text-sm">{error}</p>
          <button
            onClick={onRefresh}
            className="text-xs underline mt-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          <span className="ml-3" style={{ color: 'var(--text-muted)' }}>Loading members...</span>
        </div>
      )}

      {/* Members Section */}
      {!isLoading && (
        <div className="space-y-4">
          {/* Current Members */}
          <div>
            <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              Current Members ({members.length})
            </h3>
            
            {members.length === 0 ? (
              <div 
                className="text-center py-8 rounded-md border-2 border-dashed"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                No members yet. Invite some team members to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ 
                      background: 'var(--background-secondary)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)' }}
                        >
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {member.name || member.email}
                              {member.userId === currentUserId && (
                                <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                                  (You)
                                </span>
                              )}
                            </span>
                            <span 
                              className="px-2 py-1 text-xs rounded-full"
                              style={getRoleBadgeStyle(member.role)}
                            >
                              {member.role.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {member.email} • Joined {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Member Actions */}
                    {canManageMembers && member.userId !== currentUserId && (
                      <div className="flex items-center space-x-2">
                        {canRemoveMembers && member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.userId, member.name || member.email)}
                            className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Pending Invitations ({invitations.filter(inv => inv.status === 'pending').length})
              </h3>
              
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ 
                      background: 'var(--background-secondary)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ background: '#6b7280' }}
                        >
                          {invitation.email.charAt(0).toUpperCase()}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {invitation.email}
                            </span>
                            <span 
                              className="px-2 py-1 text-xs rounded-full"
                              style={getRoleBadgeStyle(invitation.role)}
                            >
                              {invitation.role.toUpperCase()}
                            </span>
                            <span 
                              className="px-2 py-1 text-xs rounded-full"
                              style={getStatusBadgeStyle(invitation.status)}
                            >
                              {invitation.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Invited by {invitation.invitedByName} • Expires {formatDate(invitation.expiresAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Invitation Actions */}
                    {canManageMembers && invitation.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onResendInvitation(invitation.id)}
                          className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded transition-colors"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                          className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        isLoading={inviteLoading}
        error={inviteError}
        organizationName={organizationName}
        currentUserRole={currentUserRole}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
      />
    </div>
  );
};

export default OrganizationMembersPanel;