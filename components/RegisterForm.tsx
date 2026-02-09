'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import API from '@/lib/api';

export default function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    try {
      console.log('[v0] Starting registration with email:', data.email);
      console.log('[v0] Role being sent:', data.role);
      
      // Call backend register endpoint
      const response = await API.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role, // Backend expects: ADMIN, DEV, TESTER
      });

      console.log('[v0] Register response received:', response);

      // Handle different response structures
      let user, token;
      
      // Check if response has the data directly (id, name, role, token at root level)
      if (response.id && response.token) {
        // Response structure: { id, name, email, role, token }
        user = {
          _id: response.id,
          id: response.id,
          name: response.name,
          email: response.email || data.email,
          role: response.role,
        };
        token = response.token;
      }
      // Check if wrapped in data
      else if (response.data) {
        if (response.data.id && response.data.token) {
          // Response structure: { data: { id, name, email, role, token } }
          user = {
            _id: response.data.id,
            id: response.data.id,
            name: response.data.name,
            email: response.data.email || data.email,
            role: response.data.role,
          };
          token = response.data.token;
        } else {
          // Response structure: { data: { user: {...}, token: '...' } }
          user = response.data.user;
          token = response.data.token;
        }
      }
      // Check if user and token are at root level
      else if (response.user && response.token) {
        user = response.user;
        token = response.token;
      }

      if (!user || !token) {
        console.error('[v0] Invalid response structure:', response);
        throw new Error('Invalid response from server: missing user or token');
      }

      console.log('[v0] Registering user:', user._id || user.id);
      
      // Update auth context with both user and token
      login(user, token);

      // Redirect to dashboard
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push('/dashboard');
    } catch (err: any) {
      console.error('[v0] Registration error:', err.message || err);
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div suppressHydrationWarning>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Full Name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          suppressHydrationWarning
          {...register('name')}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.name.message}
          </p>
        )}
      </div>

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

      {/* Role */}
      <div suppressHydrationWarning>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Role
        </label>
        <select
          className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          suppressHydrationWarning
          {...register('role')}
        >
          <option value="">Select your role</option>
          <option value="ADMIN">Admin</option>
          <option value="DEV">Developer</option>
          <option value="TESTER">Tester</option>
        </select>
        {errors.role && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.role.message}
          </p>
        )}
        {/* <p className="text-xs text-muted-foreground mt-1.5">
          💡 Backend uses "DEV" (not "DEVELOPER")
        </p> */}
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
        {password && (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p className={password.length >= 6 ? 'text-green-600' : ''}>
              {password.length >= 6 ? <Check className="w-3 h-3 inline mr-1" /> : '◯'} At least 6 characters
            </p>
            <p className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
              {/[A-Z]/.test(password) ? <Check className="w-3 h-3 inline mr-1" /> : '◯'} One uppercase letter
            </p>
            <p className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
              {/[a-z]/.test(password) ? <Check className="w-3 h-3 inline mr-1" /> : '◯'} One lowercase letter
            </p>
            <p className={/\d/.test(password) ? 'text-green-600' : ''}>
              {/\d/.test(password) ? <Check className="w-3 h-3 inline mr-1" /> : '◯'} One number
            </p>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div suppressHydrationWarning>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-10"
            suppressHydrationWarning
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            suppressHydrationWarning
          >
            {showConfirm ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.confirmPassword.message}
          </p>
        )}
        {password && confirmPassword && password === confirmPassword && (
          <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Passwords match
          </p>
        )}
      </div>

      {/* Server Error */}
      {serverError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-600 text-sm font-medium">Registration Error</p>
            <p className="text-red-600 text-sm mt-1">{serverError}</p>
          </div>
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
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}