'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BugIcon, ArrowRight, CheckCircle } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

export default function HomePage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  // This effect handles the redirect without blocking initial render
  useEffect(() => {
    if (!loading && isAuthenticated) {
      console.log('[v0] User is authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  // Don't show loading state - render landing page immediately
  // The redirect will happen via the useEffect above
  // This ensures the landing page is visible while auth context initializes
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground group-hover:shadow-lg transition-shadow">
              <BugIcon className="w-5 h-5" />
            </div>
            <span className="font-bold text-foreground text-lg">Bug Tracker</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Show loading state in nav only */}
            {loading ? (
              <div className="px-4 py-2 text-muted-foreground text-sm">
                Loading...
              </div>
            ) : !isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-foreground hover:bg-card rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Get started
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
            Track bugs with confidence
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Streamline your bug tracking workflow with our intuitive platform. Collaborate with your team, prioritize issues, and ship better products.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2 group"
            >
              Get started free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-border text-foreground rounded-lg hover:bg-card transition-colors font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Real-time Tracking</h3>
            <p className="text-muted-foreground">Track bug status in real-time with instant updates across your team.</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Role-based Access</h3>
            <p className="text-muted-foreground">Manage permissions with Admin, Tester, and Developer roles.</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Detailed Analytics</h3>
            <p className="text-muted-foreground">Get insights with comprehensive dashboards and status reports.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-muted-foreground text-sm">
            Built with modern technologies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}