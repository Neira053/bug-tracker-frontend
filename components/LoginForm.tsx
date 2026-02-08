'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import API from '@/lib/api';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    try {
      console.log('[v0] Starting login with email:', data.email);
      
      // Call backend login endpoint
      const response = await API.post<any>('/auth/login', {
        email: data.email,
        password: data.password,
      });

      console.log('[v0] Login response received:', response);

      // Handle the actual response format from your backend
      // Backend returns: { id, name, role, token }
      // We need to transform it to: { user: { _id, name, role }, token }
      
      let user = null;
      let token = null;

      if (response) {
        // Check if response has token
        token = response.token;
        
        // Check if user data is nested or direct
        if (response.user) {
          // Format: { user: {...}, token: "..." }
          user = {
            _id: response.user._id || response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role
          };
        } else if (response.id && response.name && response.role) {
          // Format: { id, name, role, token } - Your backend format
          user = {
            _id: response.id,
            email: response.email || data.email, // Use submitted email if not in response
            name: response.name,
            role: response.role
          };
        } else if (response.data) {
          // Format: { data: { user, token } }
          token = response.data.token || token;
          if (response.data.user) {
            user = {
              _id: response.data.user._id || response.data.user.id,
              email: response.data.user.email,
              name: response.data.user.name,
              role: response.data.user.role
            };
          } else if (response.data.id) {
            user = {
              _id: response.data.id,
              email: response.data.email || data.email,
              name: response.data.name,
              role: response.data.role
            };
          }
        }
      }

      console.log('[v0] Extracted user:', user);
      console.log('[v0] Extracted token:', token ? 'exists' : 'missing');

      // Validate we got both user and token
      if (!user || !token) {
        console.error('[v0] ❌ Login failed - missing user or token');
        console.error('[v0] Response structure:', JSON.stringify(response, null, 2));
        throw new Error('Invalid response from server: missing user or token');
      }

      console.log('[v0] ✅ Login successful - user:', user._id);
      
      // Update auth context with both user and token
      login(user, token);

      // Small delay to ensure state updates, then redirect
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('[v0] Redirecting to dashboard...');
      router.push('/dashboard');
      
    } catch (err: any) {
      console.error('[v0] Login error:', err.message || err);
      
      // Handle different error types
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message && !err.message.includes('missing user or token')) {
        errorMessage = err.message;
      }
      
      // In production, don't expose detailed errors
      if (process.env.NODE_ENV === 'production' && !err.response?.data?.message) {
        errorMessage = 'Login failed. Please check your credentials and try again.';
      }
      
      setServerError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email */}
      <div suppressHydrationWarning>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Email Address
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          suppressHydrationWarning
          {...register('email')}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div suppressHydrationWarning>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-10"
            suppressHydrationWarning
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            suppressHydrationWarning
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Server Error */}
      {serverError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{serverError}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        suppressHydrationWarning
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>

      {/* Register Link */}
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </p>
    </form>
  );
}