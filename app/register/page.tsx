'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { BugIcon } from 'lucide-react';
import RegisterFormWrapper from '@/components/RegisterFormWrapper';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground group-hover:shadow-lg transition-shadow">
              <BugIcon className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-foreground">Bug Tracker</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Get started</h1>
          <p className="text-muted-foreground mt-2">Create an account to manage bugs and projects</p>
        </div>

        {/* Register Form */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <Suspense fallback={<div className="h-60 animate-pulse bg-muted rounded" />}>
            <RegisterFormWrapper />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our{' '}
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
