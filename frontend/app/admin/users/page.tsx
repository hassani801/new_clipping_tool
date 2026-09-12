'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Users, AlertCircle, Crown, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { getMe } from '@/lib/api-client';
import {
  AdminUser,
  getAdminUsers,
  setAdminUserTier,
} from '@/lib/admin-users-api';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Rendered as a child of AppShell so the ToastProvider (mounted by AppShell)
 * is above this component when its hooks run.
 */
function UsersAdminPanel() {
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    getMe()
      .then((user) => {
        if (active) setAuthorized(Boolean(user?.isAdmin));
      })
      .catch(() => {
        if (active) setAuthorized(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    getAdminUsers()
      .then((data) => {
        if (active) {
          setUsers(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Failed to load users');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorized, reloadKey]);

  const handleSetTier = async (user: AdminUser, tier: 'free' | 'paid') => {
    setUpdatingId(user.id);
    try {
      const res = await setAdminUserTier(user.id, tier);
      setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
      toast(`Set ${res.user.email} to ${tier === 'paid' ? 'paid' : 'free'}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
              User Tiers
            </h1>
            <Badge variant="pro">Admin</Badge>
          </div>
          <p className="text-xs text-[#A1A1AA]">
            Manually switch any account between free and paid to verify
            tier-gated behavior (limits, transcription provider, watermark)
            before real billing lands.
          </p>
        </div>
        {authorized && (
          <Button variant="secondary" size="md" onClick={reload}>
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        )}
      </div>

      {checking ? (
        <div className="h-40 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse" />
      ) : !authorized ? (
        <EmptyState
          icon={ShieldCheck}
          title="403 — Admin access required"
          description="This area is restricted to administrators. Sign in with an admin account to manage user tiers."
        />
      ) : loading ? (
        <div className="h-40 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse" />
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load users"
          description={error}
          actionLabel="Retry"
          onAction={reload}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Sign-ups will appear here as accounts are created."
        />
      ) : (
        <div className="rounded-2xl bg-[#141418] border border-white/[0.07] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-[#71717A]">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Tier</th>
                  <th className="px-4 py-3 font-semibold">Subscription</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#F5F5F7]">
                          {user.email}
                        </span>
                        {user.isAdmin && (
                          <Badge variant="warning" size="sm">
                            Admin
                          </Badge>
                        )}
                      </div>
                      {user.name && (
                        <span className="text-[11px] text-[#71717A]">
                          {user.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.tier === 'paid' ? 'pro' : 'default'}>
                        {user.tier === 'paid' ? 'Paid' : 'Free'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          user.subscriptionStatus === 'active'
                            ? 'text-emerald-400 text-xs'
                            : 'text-[#71717A] text-xs'
                        }
                      >
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A1A1AA]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {user.tier !== 'paid' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={updatingId === user.id}
                            onClick={() => handleSetTier(user, 'paid')}
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Set Paid</span>
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={updatingId === user.id}
                            onClick={() => handleSetTier(user, 'free')}
                          >
                            <span>Set Free</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AppShell>
      <UsersAdminPanel />
    </AppShell>
  );
}
