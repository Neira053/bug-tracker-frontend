'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BugIcon } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import LoginForm from '@/components/LoginForm';

export default function LoginFormWrapper() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return <LoginForm />;
}
