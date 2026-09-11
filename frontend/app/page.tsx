'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Video,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Scissors,
  Share2,
  Check,
  ChevronDown,
  Play,
  TrendingUp,
  ShieldCheck,
  Layers,
  Wand2,
  Sliders,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRO_PRICE_PKR, PRO_PRICE_ANNUAL_PKR } from '@/lib/constants';
import { formatPKR } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const [heroUrl, setHeroUrl] = useState('');
  const [annualBilling, setAnnualBilling] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroUrl.trim()) {
      router.push(`/create?sourceUrl=${encodeURIComponent(heroUrl.trim())}`);
    } else {
      router.push('/create');
    }
  };

  const faqs = [
    {
      q: 'How does Cliptor.ai decide which parts of my video to clip?',
      a: 'Our proprietary AI engine analyzes speech cadence, sentiment swings, humor peaks, audience retention patterns, and acoustic emphasis to identify high-density viral hooks with over 94% precision.',
    },
    {
      q: 'What makes the animated captions viral?',
      a: 'We generate kinetic typography with syllable-accurate timing, word-by-word highlights, and custom colors proven to increase viewer watch time by up to 280%.',
    },
    {
      q: 'Does auto-reframe work if multiple people are speaking?',
      a: 'Yes! Our multi-speaker computer vision detection detects active facial movements and dynamically pans or splits the screen into vertical layout so both speakers remain prominent without manual keyframing.',
    },
    {
      q: `Can I cancel my Pro subscription at ${formatPKR(PRO_PRICE_PKR)}/month anytime?`,
      a: 'Absolutely. There are zero long-term commitments or cancellation fees. You can cancel with a single click in your settings panel and retain your credits until the billing period ends.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F5F5F7] selection:bg-pink-500 selection:text-white relative overflow-x-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-violet-600/15 via-pink-500/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[1200px] right-0 w-[600px] h-[600px] bg-pink-500/5 blur-[140px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0A0A0C]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 group-hover:scale-105 transition">
              <Video className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-[#F5F5F7] tracking-tight flex items-center gap-1.5">
              Cliptor
              <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                AI
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#A1A1AA]">
            <a href="#features" className="hover:text-[#F5F5F7] transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#F5F5F7] transition">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-[#F5F5F7] transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#F5F5F7] transition">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="text-xs">
                <span>Launch App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141418] border border-white/10 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-xs font-semibold text-[#F5F5F7]">
              Next-Gen AI Video Repurposing
            </span>
            <span className="text-[11px] text-pink-400 font-bold">• 10x Virality</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#F5F5F7] leading-[1.08]">
            Turn 1 Long Video Into{' '}
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              10 Viral Shorts
            </span>{' '}
            In Seconds
          </h1>

          <p className="text-base sm:text-lg text-[#A1A1AA] leading-relaxed max-w-2xl mx-auto">
            Paste a YouTube podcast, interview, or lecture. Our AI detects golden hooks, reframes to 9:16 vertical, adds animated kinetic captions, and publishes across TikTok, Reels, and Shorts.
          </p>

          {/* Interactive URL Form */}
          <form
            onSubmit={handleHeroSubmit}
            className="pt-4 max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-2xl bg-[#141418] border border-white/15 shadow-2xl shadow-black/80"
          >
            <div className="flex-1 w-full flex items-center gap-2.5 px-3 py-2">
              <Video className="w-4 h-4 text-pink-400 shrink-0" />
              <input
                type="text"
                placeholder="Paste YouTube URL (podcast, talk, video)..."
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#F5F5F7] placeholder-[#71717A] focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto shrink-0 shadow-lg shadow-pink-500/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Clips Free</span>
            </Button>
          </form>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-[#71717A]">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              10-minute free trial
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              4K 9:16 Vertical Export
            </span>
          </div>
        </motion.div>

        {/* HERO VISUAL MOCKUP: 3 Floating 9:16 Vertical Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="rounded-3xl bg-[#141418] border border-white/10 p-3 shadow-2xl relative group hover:border-pink-500/40 transition-all duration-300">
              <div className="aspect-[9/15] rounded-2xl bg-black overflow-hidden relative flex flex-col justify-between p-3.5">
                <img
                  src="https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=600&auto=format&fit=crop&q=80"
                  alt="Clip 1"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />

                <div className="relative z-10 flex justify-between items-center">
                  <Badge variant="pro" size="sm">
                    <Flame className="w-3 h-3 fill-current" /> 98 VIRAL SCORE
                  </Badge>
                  <span className="text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded">
                    42s
                  </span>
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-yellow-500/40 text-center">
                    <span className="text-xs font-black uppercase text-yellow-300 tracking-wider">
                      &quot;DO NOT TOUCH YOUR PHONE IN THE FIRST 15 MINS!&quot;
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/70">
                    <span>Hook Strength: 99%</span>
                    <span className="text-emerald-400 font-mono">1.2M Views</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 px-1 text-left">
                <p className="text-xs font-semibold text-[#F5F5F7] truncate">
                  The Dopamine Baseline Reset
                </p>
                <p className="text-[11px] text-[#71717A]">
                  Auto-formatted for TikTok & Shorts
                </p>
              </div>
            </div>

            {/* Card 2 (Center Hero Focus) */}
            <div className="rounded-3xl bg-[#1C1C22] border-2 border-pink-500/50 p-3 shadow-2xl shadow-pink-500/15 relative transform sm:-translate-y-4">
              <div className="aspect-[9/15] rounded-2xl bg-black overflow-hidden relative flex flex-col justify-between p-3.5">
                <img
                  src="https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=600&auto=format&fit=crop&q=80"
                  alt="Clip 2"
                  className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />

                <div className="relative z-10 flex justify-between items-center">
                  <Badge variant="pro" size="sm">
                    <Flame className="w-3 h-3 fill-current" /> 99 VIRAL SCORE
                  </Badge>
                  <span className="text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded">
                    35s
                  </span>
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="p-2.5 rounded-xl bg-purple-950/90 backdrop-blur-md border border-fuchsia-500/50 text-center shadow-lg">
                    <span className="text-xs font-black uppercase text-fuchsia-300 tracking-wider">
                      &quot;SMARTPHONES WILL BE OBSOLETE BY 2030&quot;
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/70">
                    <span>Speaker Centered 9:16</span>
                    <span className="text-pink-400 font-mono">3.4M Views</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 px-1 text-left">
                <p className="text-xs font-semibold text-pink-300 truncate">
                  Why Glass Slab Phones Will Die
                </p>
                <p className="text-[11px] text-[#71717A]">
                  AI Kinetic Captions + Cyber Neon
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-3xl bg-[#141418] border border-white/10 p-3 shadow-2xl relative group hover:border-pink-500/40 transition-all duration-300">
              <div className="aspect-[9/15] rounded-2xl bg-black overflow-hidden relative flex flex-col justify-between p-3.5">
                <img
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80"
                  alt="Clip 3"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />

                <div className="relative z-10 flex justify-between items-center">
                  <Badge variant="pro" size="sm">
                    <Flame className="w-3 h-3 fill-current" /> 94 VIRAL SCORE
                  </Badge>
                  <span className="text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded">
                    47s
                  </span>
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-emerald-500/40 text-center">
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      &quot;ENGINEERS DON&apos;T WRITE CODE ANYMORE&quot;
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/70">
                    <span>Multi-Platform Ready</span>
                    <span className="text-emerald-400 font-mono">820K Views</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 px-1 text-left">
                <p className="text-xs font-semibold text-[#F5F5F7] truncate">
                  The Autonomous 10x Engineer
                </p>
                <p className="text-[11px] text-[#71717A]">
                  Karaoke Flow Captions
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURE SHOWCASE SECTION */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.07]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="gradient" size="sm" className="mb-3">
            Core Superpowers
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F5F5F7]">
            Engineered to Hook the Algorithm
          </h2>
          <p className="text-sm text-[#A1A1AA] mt-2 leading-relaxed">
            Every clip is analyzed and styled with proven social retention dynamics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: Flame,
              title: 'AI Viral Hook Scoring',
              desc: 'Whisper transcription and semantic classifiers rank punchlines, emotional spikes, and retention hooks from 0 to 100.',
              tag: 'Algorithms',
            },
            {
              icon: Wand2,
              title: 'Animated Kinetic Captions',
              desc: 'Auto-styled animated captions with syllable highlighting, emoji markers, and custom creator color themes.',
              tag: 'Retention',
            },
            {
              icon: Scissors,
              title: '9:16 Auto-Face Tracking',
              desc: 'Computer vision identifies and tracks active speakers, framing widescreen podcast video into portrait orientation flawlessly.',
              tag: 'Vision AI',
            },
            {
              icon: Share2,
              title: '1-Click Social Publish',
              desc: 'Direct export and scheduled dispatch to TikTok, Instagram Reels, and YouTube Shorts with generated hashtags.',
              tag: 'Distribution',
            },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#141418] border border-white/[0.08] hover:border-pink-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600/20 to-pink-500/20 text-pink-400 flex items-center justify-center mb-4 border border-pink-500/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" size="sm" className="mb-2 text-[10px]">
                    {feat.tag}
                  </Badge>
                  <h3 className="text-base font-bold text-[#F5F5F7] mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS 3-STEP VISUAL WORKFLOW */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.07]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="gradient" size="sm" className="mb-3">
            Simple 3-Step Workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F5F5F7]">
            From 2-Hour Video to 10 Shorts in 60s
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Paste Link or Upload',
              desc: 'Drop any YouTube podcast, interview, or talk link, or drag-and-drop an MP4 directly from your timeline.',
              badge: 'Fast Ingest',
            },
            {
              step: '02',
              title: 'AI Cuts & Reframes',
              desc: 'Whisper transcribes, AI scores the best viral hooks, tracks speakers to 9:16 vertical, and animates dynamic captions.',
              badge: 'Automatic',
            },
            {
              step: '03',
              title: 'Review & Publish',
              desc: 'Make quick trim adjustments or style tweaks, then blast directly to TikTok, Instagram Reels, and YouTube Shorts.',
              badge: '1-Click',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#141418] border border-white/10 relative overflow-hidden"
            >
              <div className="text-5xl font-black text-white/5 absolute top-3 right-4 font-mono select-none">
                {item.step}
              </div>
              <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 font-bold text-xs flex items-center justify-center mb-4 border border-pink-500/30">
                {item.step}
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F7] mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.07]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="pro" size="sm" className="mb-3">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F5F5F7]">
            Invest in Reach, Not Video Editors
          </h2>
          <p className="text-sm text-[#A1A1AA] mt-2">
            Start completely free, or unlock full 4K and 120-minute videos for just{' '}
            <span className="text-pink-400 font-semibold">{formatPKR(PRO_PRICE_PKR)}/month</span>.
          </p>

          {/* Billing Switch */}
          <div className="mt-6 inline-flex items-center gap-2 p-1 rounded-xl bg-[#1C1C22] border border-white/10">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                !annualBilling
                  ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white'
                  : 'text-[#A1A1AA]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                annualBilling
                  ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white'
                  : 'text-[#A1A1AA]'
              }`}
            >
              <span>Annual</span>
              <Badge variant="success" size="sm">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier Card */}
          <div className="p-8 rounded-3xl bg-[#141418] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[#F5F5F7]">Free Starter</h3>
                <Badge variant="default">Test It Out</Badge>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-[#F5F5F7]">Free</span>
                <span className="text-xs text-[#71717A]">/ forever</span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-6">
                Perfect for testing our AI clipping engine on your first podcast.
              </p>

              <div className="space-y-3 pt-4 border-t border-white/5 text-xs text-[#F5F5F7]">
                {[
                  '10-minute max source video length',
                  'Generate up to 3 clips per video',
                  '2 video conversions per month',
                  'English transcription only',
                  '720p HD resolution',
                  'Cliptor watermark on exports',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/signup" className="mt-8">
              <Button variant="secondary" size="lg" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Pro Tier Card (Configured PRO_PRICE_PKR = 1000) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1C1C22] to-[#141418] border-2 border-pink-500/60 flex flex-col justify-between shadow-2xl shadow-pink-500/10 relative">
            <div className="absolute -top-3 right-8">
              <Badge variant="pro" size="md">
                CREATOR CHOICE
              </Badge>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-pink-300">Pro Creator</h3>
                <Badge variant="gradient">Most Popular</Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-black text-[#F5F5F7]">
                  {annualBilling
                    ? formatPKR(Math.round(PRO_PRICE_ANNUAL_PKR / 12))
                    : formatPKR(PRO_PRICE_PKR)}
                </span>
                <span className="text-xs text-[#A1A1AA]">
                  / month {annualBilling ? '(billed annually)' : ''}
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mb-6">
                Everything required for serious podcasters and creators scaling content across 3 platforms.
              </p>

              <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-[#F5F5F7]">
                {[
                  'Up to 120-minute video duration (vs 10 mins)',
                  'Generate up to 10 clips per long video',
                  '50 video conversions per month',
                  'No watermarks anywhere',
                  '1080p & 4K ultra-sharp exports',
                  'Priority processing queue (3x speed)',
                  'Multi-language transcription (Urdu, Spanish, Hindi, etc.)',
                  '1-click direct publishing to TikTok, Reels, Shorts',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/signup" className="mt-8">
              <Button variant="primary" size="lg" className="w-full">
                <span>Unlock Pro ({formatPKR(PRO_PRICE_PKR)}/mo)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/[0.07]">
        <div className="text-center mb-12">
          <Badge variant="default" size="sm" className="mb-2">
            Questions & Answers
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#141418] border border-white/5 overflow-hidden transition"
              >
                <button
                  onClick={() => setFaqOpen(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="text-xs sm:text-sm font-semibold text-[#F5F5F7]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#A1A1AA] transition-transform ${
                      isOpen ? 'rotate-180 text-pink-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-[#A1A1AA] leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] py-12 px-4 sm:px-6 bg-[#08080A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white">
              <Video className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#F5F5F7]">
              Cliptor.ai
            </span>
            <span className="text-xs text-[#71717A]">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#A1A1AA]">
            <Link href="/dashboard" className="hover:text-white transition">
              Dashboard
            </Link>
            <Link href="/pricing" className="hover:text-white transition">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-white transition">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
