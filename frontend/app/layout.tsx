import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clipping Tool API — AI Video to Viral Shorts',
  description:
    'AI-Powered Video Clipping SaaS platform to turn long-form videos into viral 9:16 vertical clips with auto-captions and multi-platform export.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0A0A0C] text-[#F5F5F7] min-h-screen">
        {children}
      </body>
    </html>
  );
}
