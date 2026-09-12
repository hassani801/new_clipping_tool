'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, ArrowRight, AlertCircle, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { login } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      router.push(redirect && redirect.startsWith('/') ? redirect : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F5F5F7] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-violet-600/15 to-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 group-hover:scale-105 transition">
            <Video className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-[#F5F5F7]">
            Cliptor<span className="text-pink-500">.ai</span>
          </span>
        </Link>
        <p className="text-xs text-[#A1A1AA]">
          Sign in to your AI video clipping dashboard
        </p>
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#141418] border border-white/10 shadow-2xl shadow-black relative z-10"
      >
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="creator@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-pink-500 transition font-medium"
              />
              <Mail className="w-4 h-4 text-[#71717A] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Your password"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-pink-500 transition font-medium"
              />
              <Lock className="w-4 h-4 text-[#71717A] absolute left-3 top-3 pointer-events-none" />
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
            className="w-full mt-2"
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/5 text-center">
          <p className="text-xs text-[#A1A1AA]">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/signup"
              className="text-pink-400 hover:text-pink-300 font-medium transition ml-1"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
