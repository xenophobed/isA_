/**
 * ============================================================================
 * UserPortal Component - Clean, Unified User Profile Modal
 * ============================================================================
 * 
 * A comprehensive user profile modal that matches the current design system.
 * Includes all original functionality: billing, organizations, usage tracking.
 */

import React, { useState } from 'react';
import { useUserModule, PRICING_PLANS, formatCredits } from '../../../modules/UserModule';
import { useContextModule } from '../../../modules/ContextModule';
import { useOrganizationModule } from '../../../modules/OrganizationModule';
import { PlanType } from '../../../types/userTypes';
import { Modal } from '../../shared/ui/Modal';
import { Avatar } from '../../shared/ui/Avatar';
import { Button, PrimaryButton, SecondaryButton, DangerButton } from '../../shared/ui/Button';
import CreateOrganizationModal, { CreateOrganizationData } from '../organization/CreateOrganizationModal';

interface UserPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({ isOpen, onClose }) => {
  const userModule = useUserModule();
  const contextModule = useContextModule();
  const organizationModule = useOrganizationModule();
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'usage' | 'organizations'>('account');
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Handle unauthenticated state
  if (!userModule.isAuthenticated || !userModule.auth0User) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Sign In Required"
        size="md"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Please sign in to access your account settings and manage your profile.
            </p>
            <div className="flex gap-3 justify-center">
              <PrimaryButton
                onClick={() => {
                  userModule.login();
                  onClose();
                }}
              >
                Sign In
              </PrimaryButton>
              <SecondaryButton onClick={onClose}>
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  const user = userModule.auth0User;
  const credits = userModule.credits;
  const totalCredits = userModule.totalCredits;
  const hasCredits = userModule.hasCredits;
  const currentPlan = userModule.currentPlan;
  const usagePercentage = totalCredits > 0 ? Math.round(((totalCredits - credits) / totalCredits) * 100) : 0;
  
  // Helper functions
  const getPlanDisplayName = (plan: string) => {
    const planNames = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };
    return planNames[plan as keyof typeof planNames] || plan;
  };
  
  const getCreditColor = (credits: number) => {
    if (credits > 1000) return 'text-green-400';
    if (credits > 100) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Handle plan upgrade
  const handleUpgrade = async (planType: PlanType) => {
    try {
      setUpgradingPlan(planType);
      const checkoutUrl = await userModule.createCheckout(planType);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setUpgradingPlan(null);
    }
  };

  // Handle user refresh
  const handleRefreshUser = async () => {
    try {
      await userModule.refreshUser();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    userModule.logout();
    onClose();
  };

  // Handle organization creation
  const handleCreateOrganization = async (data: CreateOrganizationData) => {
    setCreateLoading(true);
    setCreateError(null);
    
    try {
      const newOrganization = await organizationModule.createOrganization(data);
      console.log('Organization created successfully:', newOrganization);
      
      setShowCreateOrgModal(false);
      await contextModule.refreshContext();
      
    } catch (error) {
      console.error('Failed to create organization:', error);
      setCreateError(error instanceof Error ? error.message : 'Failed to create organization');
    } finally {
      setCreateLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="glass-secondary p-6 rounded-2xl" style={{ border: '1px solid var(--glass-border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>User ID</span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{user.sub || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{user.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Name</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{user.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Plan</span>
                  <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{getPlanDisplayName(currentPlan)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRefreshUser}
                disabled={userModule.isLoading}
                fullWidth
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                {userModule.isLoading ? 'Refreshing...' : 'Refresh Account Data'}
              </Button>
              
              <DangerButton
                onClick={handleLogout}
                fullWidth
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Sign Out
              </DangerButton>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="glass-secondary p-6 rounded-2xl" style={{ border: '1px solid var(--glass-border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Current Plan</h3>
              <div className="flex items-center justify-between">
                <span className="capitalize font-medium text-xl" style={{ color: 'var(--text-primary)' }}>{getPlanDisplayName(currentPlan)}</span>
                <span className="text-xs glass-secondary px-3 py-1 rounded-full" style={{ color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>Active</span>
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                {currentPlan === 'free' 
                  ? 'Limited credits per month with basic features' 
                  : 'Premium features with enhanced credits'
                }
              </p>
            </div>

            {/* Pricing Plans */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Available Plans</h4>
              {PRICING_PLANS.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                const canUpgrade = plan.id !== 'free' && !isCurrentPlan;
                const isUpgrading = upgradingPlan === plan.id;
                
                return (
                  <div
                    key={plan.id}
                    className="glass-secondary p-4 rounded-2xl transition-all"
                    style={{
                      border: `1px solid var(--glass-border${isCurrentPlan ? '-active' : ''})`,
                      boxShadow: isCurrentPlan ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentPlan) {
                        e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentPlan) {
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="text-primary font-semibold">{plan.name}</h5>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold text-primary">${plan.price}</span>
                          {plan.price > 0 && <span className="text-secondary ml-1 text-xs">/month</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-accent font-semibold">
                          {plan.credits.toLocaleString()}
                        </div>
                        <div className="text-xs text-secondary">credits</div>
                      </div>
                    </div>

                    <Button
                      onClick={() => canUpgrade ? handleUpgrade(plan.id) : undefined}
                      disabled={!canUpgrade || isUpgrading}
                      loading={isUpgrading}
                      fullWidth
                      variant={isCurrentPlan ? 'success' : canUpgrade ? 'primary' : 'ghost'}
                    >
                      {isCurrentPlan ? 'Current Plan' : canUpgrade ? `Upgrade - $${plan.price}/mo` : 'Downgrade'}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Additional Actions */}
            <div className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <Button
                fullWidth
                onClick={() => window.open('/pricing', '_blank')}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                }
              >
                View Full Pricing
              </Button>
              
              <Button
                fullWidth
                variant="ghost"
                onClick={() => window.open('/account/billing', '_blank')}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Manage Subscription
              </Button>
            </div>
          </div>
        );

      case 'usage':
        return (
          <div className="space-y-6">
            <div className="glass-secondary p-6 rounded-2xl" style={{ border: '1px solid var(--glass-border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Usage Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Credits Used</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCredits(totalCredits - credits)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Credits Remaining</span>
                  <span className={`font-medium ${getCreditColor(credits)}`}>
                    {formatCredits(credits)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Usage Rate</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{usagePercentage}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-2">
                  <span style={{ color: 'var(--text-secondary)' }}>Usage Progress</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{usagePercentage}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>

              {/* Low Credits Warning */}
              {!hasCredits && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="text-red-300 text-sm font-medium">No credits remaining</span>
                  </div>
                  <p className="text-red-200 text-xs mt-1">Upgrade your plan to continue using AI features</p>
                </div>
              )}
            </div>

            <div className="glass-secondary p-6 rounded-2xl" style={{ border: '1px solid var(--glass-border)' }}>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>💡 Usage Tips</h4>
              <ul className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>• Each AI chat interaction consumes 1-5 credits</li>
                <li>• Image generation uses 10-20 credits per image</li>
                <li>• Document analysis varies by size</li>
                <li>• Upgrade for unlimited usage</li>
              </ul>
            </div>
          </div>
        );

      case 'organizations':
        return (
          <div className="space-y-6">
            {/* Current Context */}
            <div className="glass-secondary p-6 rounded-2xl" style={{ border: '1px solid var(--glass-border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Current Context</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      background: contextModule.contextType === 'organization' ? '#f59e0b' : '#10b981' 
                    }}
                  />
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {contextModule.contextType === 'organization' ? 'Organization Mode' : 'Personal Mode'}
                    </div>
                    {contextModule.currentContext?.type === 'organization' && (
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {contextModule.currentContext.organization.name} • {contextModule.currentContext.organization.role}
                      </div>
                    )}
                  </div>
                </div>
                {contextModule.contextType === 'organization' && (
                  <Button
                    onClick={() => contextModule.switchToPersonal()}
                    variant="ghost"
                    size="sm"
                  >
                    Switch to Personal
                  </Button>
                )}
              </div>
            </div>

            {/* Organizations List */}
            <div className="glass-secondary p-6 rounded-2xl" style={{ border: '1px solid var(--glass-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Your Organizations</h3>
                <Button
                  onClick={() => setShowCreateOrgModal(true)}
                  variant="ghost"
                  size="sm"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                >
                  Create Organization
                </Button>
              </div>

              {contextModule.availableOrganizations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    You haven't created or joined any organizations yet.
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Create an organization to collaborate with your team!
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {contextModule.availableOrganizations.map((org: any) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-4 glass-tertiary rounded-xl"
                      style={{ border: '1px solid var(--glass-border-subtle)' }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{org.name}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {org.role} • {org.plan} Plan • {org.creditsPool} credits
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {contextModule.contextType === 'personal' && (
                          <Button
                            onClick={() => contextModule.switchToOrganization(org.id)}
                            variant="ghost"
                            size="sm"
                          >
                            Switch
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass-secondary p-6 rounded-2xl" style={{ border: '1px solid var(--glass-border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => contextModule.refreshContext()}
                  fullWidth
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                >
                  Refresh Organizations
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        className="max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 glass-primary" style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <div className="flex items-center space-x-4">
            <Avatar
              src={user.picture}
              alt={user.name || 'User'}
              size="lg"
              variant="user"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name || 'Unknown User'}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{user.email || 'No email'}</p>
              <p className="text-sm capitalize font-medium" style={{ color: 'var(--text-muted)' }}>{getPlanDisplayName(currentPlan)} Plan</p>
            </div>
          </div>
        </div>

        {/* Credits Overview */}
        <div className="p-6 glass-secondary" style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-tertiary p-4 rounded-xl" style={{ border: '1px solid var(--glass-border)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-success)' }}>{formatCredits(credits)}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Credits Left</div>
            </div>
            <div className="glass-tertiary p-4 rounded-xl" style={{ border: '1px solid var(--glass-border)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCredits(totalCredits)}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Credits</div>
            </div>
          </div>

          {/* Error Display */}
          {userModule.error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">❌</span>
                <span className="text-red-300 text-sm font-medium">Error</span>
              </div>
              <p className="text-red-200 text-xs mt-1">{userModule.error}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex glass-secondary" style={{ borderBottom: '1px solid var(--glass-border)' }}>
          {[
            { 
              id: 'account', 
              label: 'Account', 
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )
            },
            { 
              id: 'billing', 
              label: 'Billing', 
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )
            },
            { 
              id: 'usage', 
              label: 'Usage', 
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )
            },
            { 
              id: 'organizations', 
              label: 'Organizations', 
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'glass-primary'
                  : 'hover:glass-secondary'
              }`}
              style={{
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : 'none'
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto glass-primary">
          {renderTabContent()}
        </div>
      </Modal>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateOrgModal}
        isLoading={createLoading}
        error={createError}
        onClose={() => {
          setShowCreateOrgModal(false);
          setCreateError(null);
        }}
        onCreate={handleCreateOrganization}
      />
    </>
  );
};