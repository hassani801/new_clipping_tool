'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getJobs } from '@/lib/api-client';

export default function ResultsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    getJobs()
      .then((jobs) => {
        if (jobs.length > 0) {
          router.replace(`/results/${jobs[0].id}`);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => router.replace('/dashboard'));
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center text-xs text-[#A1A1AA]">
      Loading clip results...
    </div>
  );
}
