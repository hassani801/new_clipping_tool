'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getCurrentUser,
  getAdminListings,
  createAdminListing,
  updateAdminListing,
  deleteAdminListing,
  CampaignListing,
  CampaignListingInput,
} from '@/lib/campaign-api';

const EMPTY_FORM: CampaignListingInput = {
  platformName: '',
  platformLogoUrl: '',
  campaignTitle: '',
  description: '',
  sourceVideoUrl: '',
  ratePerThousandViews: '',
  requirements: '',
  externalJoinUrl: '',
  externalSubmissionUrl: '',
  isActive: true,
};

function ListingFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: CampaignListing | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={initial ? 'Edit Campaign Listing' : 'New Campaign Listing'}
      description="All campaign data is entered and maintained manually — nothing is scraped from external platforms."
      maxWidth="lg"
    >
      <ListingFormFields
        key={initial?.id ?? 'new'}
        initial={initial}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}

function ListingFormFields({
  initial,
  onClose,
  onSaved,
}: {
  initial: CampaignListing | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CampaignListingInput>(() =>
    initial
      ? {
          platformName: initial.platformName,
          platformLogoUrl: initial.platformLogoUrl ?? '',
          campaignTitle: initial.campaignTitle,
          description: initial.description,
          sourceVideoUrl: initial.sourceVideoUrl ?? '',
          ratePerThousandViews: initial.ratePerThousandViews,
          requirements: initial.requirements ?? '',
          externalJoinUrl: initial.externalJoinUrl,
          externalSubmissionUrl: initial.externalSubmissionUrl ?? '',
          isActive: initial.isActive,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof CampaignListingInput, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: CampaignListingInput = {
        ...form,
        platformLogoUrl: form.platformLogoUrl?.trim() || undefined,
        sourceVideoUrl: form.sourceVideoUrl?.trim() || undefined,
        externalSubmissionUrl: form.externalSubmissionUrl?.trim() || undefined,
        requirements: form.requirements?.trim() || undefined,
      };
      if (initial) {
        await updateAdminListing(initial.id, payload);
      } else {
        await createAdminListing(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full bg-[#0A0A0C] border border-white/10 rounded-xl text-xs text-[#F5F5F7] placeholder-[#71717A] px-3 py-2.5 focus:outline-none focus:border-pink-500 transition';

  return (
    <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#A1A1AA] mb-1">
              Platform name *
            </label>
            <input
              required
              value={form.platformName}
              onChange={(e) => set('platformName', e.target.value)}
              placeholder="Vyro"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#A1A1AA] mb-1">
              Campaign title *
            </label>
            <input
              required
              value={form.campaignTitle}
              onChange={(e) => set('campaignTitle', e.target.value)}
              placeholder="Monthly clip-for-pay program"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#A1A1AA] mb-1">
            Platform logo URL
          </label>
          <input
            value={form.platformLogoUrl || ''}
            onChange={(e) => set('platformLogoUrl', e.target.value)}
            placeholder="https://…/logo.png"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#A1A1AA] mb-1">
            Description *
          </label>
          <textarea
            required
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Describe what this campaign pays for and how it works…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#A1A1AA] mb-1">
              Rate per 1,000 views *
            </label>
            <input
              required
              value={form.ratePerThousandViews}
              onChange={(e) => set('ratePerThousandViews', e.target.value)}
              placeholder="$1-4 per 1,000 views"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#A1A1AA] mb-1">
              Source video URL
            </label>
            <input
              value={form.sourceVideoUrl || ''}
              onChange={(e) => set('sourceVideoUrl', e.target.value)}
              placeholder="https://… (optional)"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#A1A1AA] mb-1">
            Requirements
          </label>
          <textarea
            value={form.requirements || ''}
            onChange={(e) => set('requirements', e.target.value)}
            rows={2}
            placeholder="Eligibility, content rules, minimum follower count…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#A1A1AA] mb-1">
              Join URL *
            </label>
            <input
              required
              value={form.externalJoinUrl}
              onChange={(e) => set('externalJoinUrl', e.target.value)}
              placeholder="https://…/campaign"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#A1A1AA] mb-1">
              Submission URL
            </label>
            <input
              value={form.externalSubmissionUrl || ''}
              onChange={(e) => set('externalSubmissionUrl', e.target.value)}
              placeholder="https://…/submit (falls back to join URL)"
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 pt-1 text-xs text-[#F5F5F7] cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => set('isActive', e.target.checked)}
            className="w-4 h-4 accent-pink-500 cursor-pointer"
          />
          <span>Active (visible in the public directory)</span>
        </label>

        {error && (
          <p className="text-xs text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={saving}>
            {initial ? 'Save Changes' : 'Create Listing'}
          </Button>
        </div>
      </form>
  );
}

export default function AdminCampaignListingsPage() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [listings, setListings] = useState<CampaignListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignListing | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (active) setAuthorized(Boolean(user.isAdmin));
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
    getAdminListings()
      .then((data) => {
        if (active) {
          setListings(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorized, reloadKey]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this campaign listing? This cannot be undone.'))
      return;
    try {
      await deleteAdminListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const toggleActive = async (listing: CampaignListing) => {
    try {
      const updated = await updateAdminListing(listing.id, {
        isActive: !listing.isActive,
      });
      setListings((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l)),
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
                Campaign Listings
              </h1>
              <Badge variant="pro">Admin</Badge>
            </div>
            <p className="text-xs text-[#A1A1AA]">
              Manually curate the clip-for-pay campaign directory. No external
              platforms are scraped.
            </p>
          </div>
          {authorized && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>New Listing</span>
            </Button>
          )}
        </div>

        {checking ? (
          <div className="h-40 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse" />
        ) : !authorized ? (
          <EmptyState
            icon={ShieldCheck}
            title="403 — Admin access required"
            description="This area is restricted to administrators. Sign in with an admin account to manage campaign listings."
          />
        ) : loading ? (
          <div className="h-40 rounded-2xl bg-[#141418] border border-white/[0.07] animate-pulse" />
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load listings"
            description={error}
            actionLabel="Retry"
            onAction={reload}
          />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No listings yet"
            description="Create your first campaign listing to populate the public directory."
            actionLabel="Create Listing"
            onAction={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        ) : (
          <div className="rounded-2xl bg-[#141418] border border-white/[0.08] overflow-hidden">
            <div className="divide-y divide-white/[0.06]">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#F5F5F7] truncate">
                        {l.campaignTitle}
                      </span>
                      <Badge variant="outline" size="sm">
                        {l.platformName}
                      </Badge>
                      <Badge
                        variant={l.isActive ? 'success' : 'default'}
                        size="sm"
                      >
                        {l.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#71717A] mt-0.5">
                      {l.ratePerThousandViews} · {l.description.slice(0, 90)}
                      {l.description.length > 90 ? '…' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(l)}
                      title={l.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {l.isActive ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>{l.isActive ? 'Deactivate' : 'Activate'}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditing(l);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="icon"
                      onClick={() => handleDelete(l.id)}
                      aria-label="Delete listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ListingFormModal
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />
    </AppShell>
  );
}
