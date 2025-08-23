/**
 * ============================================================================
 * InviteMemberModal - Organization Member Invitation Interface
 * ============================================================================
 * 
 * Pure UI component for inviting new members to an organization via email.
 * Integrates with the email service API documented in how_to_email.md.
 * 
 * Features:
 * - Email validation
 * - Role selection (admin/member)
 * - Custom invitation message
 * - Permission configuration
 * - Real-time validation feedback
 */

import React, { useState, useCallback } from 'react';

export interface InviteMemberData {
  email: string;
  role: 'admin' | 'member';
  permissions: string[];
  message?: string;
}

export interface InviteMemberModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error?: string | null;
  organizationName: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  onClose: () => void;
  onInvite: (data: InviteMemberData) => Promise<void>;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  isLoading,
  error,
  organizationName,
  currentUserRole,
  onClose,
  onInvite
}) => {
  // Form State
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  // Permission Configuration
  const getDefaultPermissions = (selectedRole: 'admin' | 'member'): string[] => {
    if (selectedRole === 'admin') {
      return ['read', 'write', 'admin'];
    }
    return ['read', 'write'];
  };

  // Email Validation
  const validateEmail = useCallback((emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  // Form Handlers
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmail(value);
    } else {
      setEmailError('');
    }
  }, [validateEmail]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    const inviteData: InviteMemberData = {
      email: email.trim(),
      role,
      permissions: getDefaultPermissions(role),
      message: message.trim() || undefined
    };

    try {
      await onInvite(inviteData);
      // Reset form on success
      setEmail('');
      setRole('member');
      setMessage('');
      setEmailError('');
    } catch (error) {
      // Error handling is managed by parent component
    }
  }, [email, role, message, validateEmail, onInvite]);

  const handleClose = useCallback(() => {
    // Reset form when closing
    setEmail('');
    setRole('member');
    setMessage('');
    setEmailError('');
    onClose();
  }, [onClose]);

  // Permission Check
  const canInviteAdmins = currentUserRole === 'owner';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        style={{ 
          background: 'var(--background-secondary)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Invite Member to {organizationName}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Send an email invitation to add a new team member
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Email Input */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-3 py-2 rounded-md border transition-colors"
              style={{
                background: 'var(--background-primary)',
                borderColor: emailError ? '#ef4444' : 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              placeholder="colleague@company.com"
              disabled={isLoading}
              required
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label 
              htmlFor="role" 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="w-full px-3 py-2 rounded-md border transition-colors"
              style={{
                background: 'var(--background-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              disabled={isLoading}
            >
              <option value="member">Member - Can use organization features</option>
              {canInviteAdmins && (
                <option value="admin">Admin - Can manage members and settings</option>
              )}
            </select>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {role === 'admin' 
                ? 'Admins can invite members and manage organization settings'
                : 'Members can use all organization features but cannot manage settings'
              }
            </p>
          </div>

          {/* Custom Message */}
          <div>
            <label 
              htmlFor="message" 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Custom Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md border transition-colors resize-none"
              style={{
                background: 'var(--background-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              placeholder="Welcome to our team! We're excited to have you join us."
              disabled={isLoading}
              maxLength={500}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              This message will be included in the invitation email
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div 
              className="p-3 rounded-md border-l-4 border-red-500"
              style={{ background: '#fef2f2', color: '#dc2626' }}
            >
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                color: 'var(--text-muted)',
                background: 'transparent',
                border: `1px solid var(--border-color)`
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !email || !!emailError}
              className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50"
              style={{
                background: 'var(--color-accent)',
                border: 'none'
              }}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>

        {/* Info Footer */}
        <div 
          className="px-6 py-3 border-t text-xs"
          style={{ 
            borderColor: 'var(--border-color)',
            background: 'var(--background-tertiary)',
            color: 'var(--text-muted)'
          }}
        >
          📧 An invitation email will be sent with a secure link that expires in 7 days
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;