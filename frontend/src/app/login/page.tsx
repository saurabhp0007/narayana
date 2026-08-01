'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useGuestStore } from '@/store/guestStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsUser, loginAsAdmin, isLoading, error, clearError, loadFromStorage, userType } = useAuthStore();
  const { guestId, clearGuestSession, loadFromStorage: loadGuestFromStorage } = useGuestStore();
  const { fetchCount: fetchCartCount, resetCart } = useCartStore();
  const { fetchCount: fetchWishlistCount, resetWishlist } = useWishlistStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    loadGuestFromStorage();
  }, [loadGuestFromStorage]);


  useEffect(() => {
    if (userType === 'admin') {
      router.push('/admin');
    } else if (userType === 'user') {
      router.push('/products');
    }
  }, [userType, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoginError(null);

    // Try user login first (pass guestId for cart/wishlist merge)
    try {
      await loginAsUser(email, password, guestId);
      // Clear guest session and reset stores after successful login
      clearGuestSession();
      resetCart();
      resetWishlist();
      // Fetch new counts from user's database cart/wishlist
      fetchCartCount();
      fetchWishlistCount();
      router.push('/products');
      return;
    } catch {
      // User login failed, try admin login
    }

    // Try admin login
    try {
      await loginAsAdmin(email, password);
      router.push('/admin');
      return;
    } catch {
      // Both failed
      setLoginError('Invalid email or password');
    }
  };

  const displayError = loginError || error;

  return (
    <div className="min-h-[calc(100vh-5rem)] grid lg:grid-cols-2 bg-white">
      {/* Image panel */}
      <div className="relative hidden lg:block overflow-hidden bg-gray-900">
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.06 }}
          transition={{ duration: 10, ease: 'linear' }}
          className="absolute inset-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1400&q=80"
            alt="Fashion apparel rack"
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/80 text-xs uppercase tracking-widest mb-2"
          >
            Narayan Enterprises
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-white text-3xl font-bold leading-tight max-w-sm"
          >
            Authentic fashion, delivered with care.
          </motion.h2>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 sm:px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm w-full"
        >
          <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-2">Sign in to your account</h1>
          <p className="text-sm text-gray-500 mb-8">
            New here?{' '}
            <Link href="/login/register" className="font-medium text-gray-900 hover:underline">
              Create an account
            </Link>
          </p>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {displayError && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-100 p-3">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-800">{displayError}</p>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
