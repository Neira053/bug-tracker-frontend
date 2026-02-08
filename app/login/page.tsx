'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { BugIcon } from 'lucide-react';
import LoginFormWrapper from '@/components/LoginFormWrapper';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground group-hover:shadow-lg transition-shadow">
              <BugIcon className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-foreground">Bug Tracker</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded" />}>
            <LoginFormWrapper />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{' '}
          <Link href="#" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="#" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
