'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useDataStore } from '@/store/dataStore';
import { useGuestStore } from '@/store/guestStore';
import { offerApi } from '@/lib/api';
import { Offer } from '@/types';
import SearchDropdown from './SearchDropdown';

export default function Header() {
  const { user, admin, userType, logout, loadFromStorage } = useAuthStore();
  const { count: cartCount, summary: cartSummary, fetchCount: fetchCartCount } = useCartStore();
  const { count: wishlistCount, fetchCount: fetchWishlistCount } = useWishlistStore();
  const { guestId, initGuestSession, loadFromStorage: loadGuestFromStorage } = useGuestStore();

  // Use shared data store
  const {
    genders,
    categoriesByGender,
    fetchGenders,
    fetchCategoriesByGender,
  } = useDataStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showOffersDropdown, setShowOffersDropdown] = useState(false);
  const [navbarOffers, setNavbarOffers] = useState<Offer[]>([]);

  // Navigation state for mobile menu
  const [expandedGender, setExpandedGender] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    loadFromStorage();
    loadGuestFromStorage();

    // Fetch genders from shared store (cached)
    fetchGenders();

    // Fetch navbar offers
    offerApi.getNavbar().then((response) => {
      setNavbarOffers(response.data || []);
    }).catch(console.error);
  }, [loadFromStorage, loadGuestFromStorage, fetchGenders]);

  useEffect(() => {
    if (mounted && userType === 'user' && user) {
      // Logged in user - fetch from database
      fetchCartCount();
      fetchWishlistCount();
    } else if (mounted && !user && !admin) {
      // Guest user - initialize session and fetch from Redis
      const initGuest = async () => {
        try {
          const id = await initGuestSession();
          fetchCartCount(id);
          fetchWishlistCount(id);
        } catch (error) {
          console.error('Failed to init guest session:', error);
        }
      };
      initGuest();
    }
  }, [mounted, userType, user, admin, fetchCartCount, fetchWishlistCount, initGuestSession, guestId]);

  // Fetch categories when gender is expanded (from shared cache)
  const handleGenderExpand = async (genderId: string) => {
    if (expandedGender === genderId) {
      setExpandedGender(null);
      return;
    }

    setExpandedGender(genderId);

    // Fetch from shared store (cached)
    await fetchCategoriesByGender(genderId);
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  const isLoggedIn = mounted && (user || admin);
  const isAdmin = mounted && userType === 'admin' && admin;
  const isUser = mounted && userType === 'user' && user;

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
      {/* Main Header — minimal, icon-only nav; all links live behind the menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-20">
          {/* Left: Menu + Search */}
          <div className="flex items-center gap-1 md:gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:text-gray-900"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                className="p-2 text-gray-700 hover:text-gray-900"
                aria-label="Open search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <SearchDropdown isOpen={showSearchDropdown} onClose={() => setShowSearchDropdown(false)} align="left" />
            </div>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="flex flex-col items-center justify-center">
            <span className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">ne</span>
            <span className="text-[9px] md:text-[10px] tracking-[0.2em] text-gray-500 uppercase -mt-1">
              Narayan Enterprises
            </span>
          </Link>

          {/* Right: User, Wishlist, Cart */}
          <div className="flex items-center justify-end gap-1 md:gap-3">
            <div className="relative hidden md:block">
              {isLoggedIn ? (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="p-2 text-gray-700 hover:text-gray-900"
                  aria-label="Account"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              ) : (
                <Link href="/login" className="p-2 text-gray-700 hover:text-gray-900 block" aria-label="Login">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}
              {isProfileOpen && isUser && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  </div>
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Track Order
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <Link href="/wishlist" className="relative p-2 text-gray-700 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {mounted ? wishlistCount : 0}
              </span>
            </Link>

            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {mounted ? cartCount : 0}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Menu — left-side slide-in drawer, closes via backdrop tap or the menu icon */}
      <div
        onClick={() => {
          setIsMenuOpen(false);
          setExpandedGender(null);
        }}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
          {/* Scrollable Menu Content */}
          <div className="h-full overflow-y-auto">
            <nav className="py-2">
              {/* Shop All */}
              <Link
                href="/products"
                className="flex items-center justify-between px-4 py-3 text-gray-900 font-medium hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>SHOP ALL</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/footwear"
                className="flex items-center justify-between px-4 py-3 text-gray-900 font-medium hover:bg-gray-50 border-t border-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>FOOTWEAR</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Dynamic Gender → Category Navigation */}
              {genders.map((gender) => (
                <div key={gender._id} className="border-t border-gray-100">
                  <button
                    onClick={() => handleGenderExpand(gender._id)}
                    className="flex items-center justify-between w-full px-4 py-3 text-gray-900 font-medium hover:bg-gray-50"
                  >
                    <span className="uppercase">{gender.name}</span>
                    <svg
                      className={`w-4 h-4 transform transition-transform ${expandedGender === gender._id ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Categories for this gender */}
                  {expandedGender === gender._id && (
                    <div className="bg-gray-50">
                      <Link
                        href={`/products?genderId=${gender._id}`}
                        className="block px-6 py-2 text-sm text-gray-600 hover:text-gray-900"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        View All {gender.name}
                      </Link>

                      {categoriesByGender[gender._id]?.map((category) => (
                        <Link
                          key={category._id}
                          href={`/products?categoryId=${category._id}`}
                          className="block px-6 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Offers */}
              <button
                onClick={() => setShowOffersDropdown(!showOffersDropdown)}
                className="flex items-center justify-between w-full px-4 py-3 text-red-600 font-medium hover:bg-gray-50 border-t border-gray-100"
              >
                <span>OFFERS</span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${showOffersDropdown ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {showOffersDropdown && (
                <div className="bg-gray-50">
                  <Link
                    href="/products?offers=true"
                    className="block px-6 py-2 text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    View All Offers
                  </Link>
                  {navbarOffers
                    .filter((offer) => offer.productIds && offer.productIds.length > 0)
                    .map((offer) => {
                      const params = new URLSearchParams();
                      params.set('productIds', offer.productIds.join(','));
                      params.set('offerId', offer._id);
                      return (
                        <Link
                          key={offer._id}
                          href={`/products?${params.toString()}`}
                          className="block px-6 py-2 text-sm text-gray-600 hover:text-gray-900"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {offer.name}
                        </Link>
                      );
                    })}
                </div>
              )}

              {/* User Section */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                {isUser && (
                  <Link
                    href="/orders"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Track Orders</span>
                  </Link>
                )}

                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Login / Register</span>
                  </Link>
                )}

                {isLoggedIn && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
    </header>
  );
}
