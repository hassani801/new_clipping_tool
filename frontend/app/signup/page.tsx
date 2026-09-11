'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, ArrowRight, AlertCircle, Check, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRO_PRICE_PKR } from '@/lib/constants';
import { formatPKR } from '@/lib/utils';
import { signup } from '@/lib/api-client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Accounts are always created on the Free tier; Pro is a paid upgrade
      // applied later (see /pricing).
      await signup(email.trim(), password, name.trim() || undefined);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F5F5F7] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-violet-600/15 to-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 group-hover:scale-105 transition">
            <Video className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-[#F5F5F7]">
            Cliptor<span className="text-pink-500">.ai</span>
          </span>
        </Link>
        <p className="text-xs text-[#A1A1AA]">
          Start turning long videos into viral 9:16 vertical shorts
        </p>
      </div>

      {/* Signup Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#141418] border border-white/10 shadow-2xl shadow-black relative z-10"
      >
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Creator Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Vance"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-pink-500 transition font-medium"
              />
              <User className="w-4 h-4 text-[#71717A] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@creator.io"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-pink-500 transition font-medium"
              />
              <Mail className="w-4 h-4 text-[#71717A] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Create Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-pink-500 transition font-medium"
              />
              <Lock className="w-4 h-4 text-[#71717A] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Plan Choice Selector */}
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-2">
              Select Starting Plan
              <span className="block text-[10px] text-[#71717A] font-normal mt-0.5">
                Accounts start on Free — upgrade to Pro anytime from Pricing.
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedPlan('free')}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedPlan === 'free'
                    ? 'bg-[#1C1C22] border-white/30 text-[#F5F5F7]'
                    : 'bg-[#0A0A0C] border-white/5 text-[#A1A1AA] hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold">Free Plan</span>
                  {selectedPlan === 'free' && (
                    <div className="w-3.5 h-3.5 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#71717A]">
                  10m video limit • 3 clips
                </p>
              </div>

              <div
                onClick={() => setSelectedPlan('pro')}
                className={`p-3 rounded-xl border cursor-pointer transition relative overflow-hidden ${
                  selectedPlan === 'pro'
                    ? 'bg-gradient-to-br from-violet-900/30 to-pink-900/30 border-pink-500 text-[#F5F5F7] shadow-lg shadow-pink-500/10'
                    : 'bg-[#0A0A0C] border-white/5 text-[#A1A1AA] hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-pink-300">
                    Pro Creator
                  </span>
                  <Badge variant="pro" size="sm" className="text-[9px] py-0">
                    POPULAR
                  </Badge>
                </div>
                <p className="text-[10px] text-[#A1A1AA]">
                  {formatPKR(PRO_PRICE_PKR)}/mo • 10 clips • 4K
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-3"
          >
            <span>Create Account & Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/5 text-center">
          <p className="text-xs text-[#A1A1AA]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-pink-400 hover:text-pink-300 font-medium transition ml-1"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
