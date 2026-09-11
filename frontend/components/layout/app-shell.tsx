'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';
import { UpgradeModal } from '@/components/pricing/upgrade-modal';
import { ToastProvider } from '@/components/ui/toast';
import { getMe, toUserProfile } from '@/lib/api-client';
import { isDemoMode } from '@/lib/mock-service';
import { UserProfile } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getMe()
      .then((u) => {
        if (active && u) setUser(toUserProfile(u));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleUserUpdated = (updated: UserProfile) => {
    setUser(updated);
  };

  const handleUpgradeClick = () => {
    if (isDemoMode()) {
      setUpgradeOpen(true);
    } else {
      window.location.href = '/pricing';
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0A0A0C] text-[#F5F5F7] flex flex-col selection:bg-pink-500 selection:text-white">
        <div className="flex flex-1 relative overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
            <Sidebar
              userTier={user?.tier || 'free'}
              creditsUsed={user?.creditsMax ? user.creditsUsed : undefined}
              creditsMax={user?.creditsMax || undefined}
              isAdmin={Boolean(user?.isAdmin)}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {mobileOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="relative z-10 w-72 h-full"
                >
                  <Sidebar
                    userTier={user?.tier || 'free'}
                    creditsUsed={user?.creditsMax ? user.creditsUsed : undefined}
                    creditsMax={user?.creditsMax || undefined}
                    isAdmin={Boolean(user?.isAdmin)}
                    onUpgradeClick={() => {
                      setMobileOpen(false);
                      handleUpgradeClick();
                    }}
                    onCloseMobile={() => setMobileOpen(false)}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar
              user={user}
              onOpenMobileMenu={() => setMobileOpen(true)}
              onUpgradeClick={handleUpgradeClick}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Global Upgrade Modal (demo mode only — no real payment flow yet) */}
        {isDemoMode() && (
          <UpgradeModal
            isOpen={upgradeOpen}
            onClose={() => setUpgradeOpen(false)}
            currentUser={user}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </div>
    </ToastProvider>
  );
}
