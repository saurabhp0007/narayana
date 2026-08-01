'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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
  const { count: cartCount, fetchCount: fetchCartCount } = useCartStore();
  const { count: wishlistCount, fetchCount: fetchWishlistCount } = useWishlistStore();
  const { guestId, initGuestSession, loadFromStorage: loadGuestFromStorage } = useGuestStore();
  const pathname = usePathname();

  const { genders, categoriesByGender, fetchGenders, fetchCategoriesByGender } = useDataStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showOffersDropdown, setShowOffersDropdown] = useState(false);
  const [navbarOffers, setNavbarOffers] = useState<Offer[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile drawer nav state
  const [expandedGender, setExpandedGender] = useState<string | null>(null);

  // Desktop mega menu state — which section (a gender id, or 'offers') the menu
  // panel is showing. Opened/closed by the same hamburger button as the mobile
  // drawer; a section is auto-selected the moment the panel opens.
  const [desktopSection, setDesktopSection] = useState<string | null>(null);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    loadFromStorage();
    loadGuestFromStorage();
    fetchGenders();

    offerApi.getNavbar().then((response) => {
      setNavbarOffers(response.data || []);
    }).catch(console.error);
  }, [loadFromStorage, loadGuestFromStorage, fetchGenders]);

  useEffect(() => {
    if (mounted && userType === 'user' && user) {
      fetchCartCount();
      fetchWishlistCount();
    } else if (mounted && !user && !admin) {
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

  // Subtle elevation once the page has scrolled past the very top
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIsScrolled(window.scrollY > 8));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Close mobile drawer / mega menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setDesktopSection(null);
  }, [pathname]);

  // Focus trap + Escape-to-close for the mobile drawer
  useEffect(() => {
    if (!isMenuOpen) return;

    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const handleGenderExpand = async (genderId: string) => {
    if (expandedGender === genderId) {
      setExpandedGender(null);
      return;
    }
    setExpandedGender(genderId);
    await fetchCategoriesByGender(genderId);
  };

  // The desktop panel opens with a section already selected — default to the
  // first gender the moment the menu is opened, so it's never a blank panel.
  useEffect(() => {
    if (isMenuOpen && !desktopSection && genders.length > 0) {
      setDesktopSection(genders[0]._id);
      fetchCategoriesByGender(genders[0]._id);
    }
    if (!isMenuOpen) {
      setDesktopSection(null);
    }
  }, [isMenuOpen, genders, desktopSection, fetchCategoriesByGender]);

  const handleSelectDesktopSection = (sectionId: string) => {
    setDesktopSection(sectionId);
    if (sectionId !== 'offers') fetchCategoriesByGender(sectionId);
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  const isLoggedIn = mounted && (user || admin);
  const isAdmin = mounted && userType === 'admin' && admin;
  const isUser = mounted && userType === 'user' && user;
  const activeDesktopGender = genders.find((g) => g._id === desktopSection);

  return (
    <header
      className={`bg-white sticky top-0 z-50 border-b transition-shadow duration-300 ${
        isScrolled ? 'border-gray-200 shadow-sm' : 'border-gray-100 shadow-none'
      }`}
    >
      {/* Main Header — icon-only at every breakpoint */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-20">
          {/* Left: Menu (mobile/tablet) + Search */}
          <div className="flex items-center gap-1 md:gap-3">
            <motion.button
              ref={menuButtonRef}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-drawer"
              className="p-2 text-gray-700 hover:text-gray-900"
              aria-label="Open menu"
            >
              <motion.svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: isMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </motion.svg>
            </motion.button>
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                className="p-2 text-gray-700 hover:text-gray-900"
                aria-label="Open search"
                aria-expanded={showSearchDropdown}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.button>
              <SearchDropdown isOpen={showSearchDropdown} onClose={() => setShowSearchDropdown(false)} align="left" />
            </div>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/brand/logo.png"
              alt="Narayan Enterprises"
              width={156}
              height={70}
              priority
              className="h-[54px] md:h-[66px] w-auto"
            />
          </Link>

          {/* Right: User, Wishlist, Cart */}
          <div className="flex items-center justify-end gap-1 md:gap-3">
            <div className="relative hidden md:block">
              {isLoggedIn ? (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="p-2 text-gray-700 hover:text-gray-900"
                  aria-label="Account"
                  aria-expanded={isProfileOpen}
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
              <AnimatePresence>
                {isProfileOpen && isUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/wishlist" className="relative p-2 text-gray-700 hover:text-gray-900">
              <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="block">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={mounted ? wishlistCount : 0}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center"
                >
                  {mounted ? wishlistCount : 0}
                </motion.span>
              </AnimatePresence>
            </Link>

            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-gray-900">
              <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="block">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </motion.span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={mounted ? cartCount : 0}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center"
                >
                  {mounted ? cartCount : 0}
                </motion.span>
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </div>

      {/* Icon-only header at every breakpoint — the hamburger opens a mobile drawer
          on small screens and a full-width mega menu panel on desktop, both driven
          by the same isMenuOpen/desktopSection state. */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setIsMenuOpen(false);
                setExpandedGender(null);
              }}
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-black/50"
            />

            {/* Desktop mega menu panel — a left rail of sections, categories in the
                middle, and an animated graphic promo tile on the right. Pinned to the
                header's own edges (not the trigger button) so it can never overflow
                the viewport regardless of screen width. */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block fixed inset-x-0 top-20 z-50 bg-white border-t border-gray-200 shadow-2xl"
            >
              <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-[180px_1fr_320px] gap-10">
                {/* Section rail */}
                <div className="space-y-1">
                  <Link
                    href="/products"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-50"
                  >
                    Shop All
                  </Link>
                  {genders.map((gender) => (
                    <button
                      key={gender._id}
                      onClick={() => handleSelectDesktopSection(gender._id)}
                      aria-current={desktopSection === gender._id}
                      className={`block w-full text-left px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                        desktopSection === gender._id ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {gender.name}
                    </button>
                  ))}
                  <Link
                    href="/footwear"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-50"
                  >
                    Footwear
                  </Link>
                  <button
                    onClick={() => handleSelectDesktopSection('offers')}
                    aria-current={desktopSection === 'offers'}
                    className={`block w-full text-left px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                      desktopSection === 'offers' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    Offers
                  </button>
                </div>

                {/* Section content */}
                <div>
                  {desktopSection === 'offers' ? (
                    <div>
                      <Link
                        href="/products?offers=true"
                        onClick={() => setIsMenuOpen(false)}
                        className="inline-block text-sm font-medium text-gray-900 hover:underline mb-4"
                      >
                        View All Offers
                      </Link>
                      <div className="grid grid-cols-3 gap-x-8 gap-y-3">
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
                                onClick={() => setIsMenuOpen(false)}
                                className="text-sm text-gray-700 hover:text-gray-900 hover:underline transition-colors"
                              >
                                {offer.name}
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  ) : activeDesktopGender ? (
                    <div>
                      <Link
                        href={`/products?genderId=${activeDesktopGender._id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="inline-block text-sm font-medium text-gray-900 hover:underline mb-4"
                      >
                        View All {activeDesktopGender.name}
                      </Link>
                      <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                        {(categoriesByGender[activeDesktopGender._id] || []).map((category) => (
                          <Link
                            key={category._id}
                            href={`/products?categoryId=${category._id}`}
                            onClick={() => setIsMenuOpen(false)}
                            className="text-sm text-gray-700 hover:text-gray-900 hover:underline transition-colors"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Animated graphic promo tile */}
                <Link
                  href={activeDesktopGender ? `/products?genderId=${activeDesktopGender._id}` : '/products'}
                  onClick={() => setIsMenuOpen(false)}
                  className="group relative rounded-lg overflow-hidden flex flex-col justify-end p-6 min-h-[220px]"
                >
                  <motion.div
                    className="absolute inset-0"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Image
                      src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  </motion.div>
                  {/* Continuous diagonal light sweep — a slow, repeating shimmer rather than a one-shot hover effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent"
                    style={{ mixBlendMode: 'overlay' }}
                    initial={{ x: '-120%' }}
                    animate={{ x: '120%' }}
                    transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <p className="relative text-xs uppercase tracking-widest text-white/80 mb-2">
                    {activeDesktopGender ? activeDesktopGender.name : 'Narayan Enterprises'}
                  </p>
                  <p className="relative text-lg font-display text-white mb-4">
                    {activeDesktopGender ? `Shop the full ${activeDesktopGender.name} range` : 'New arrivals, every week'}
                  </p>
                  <span className="relative inline-flex items-center gap-1 text-sm font-medium text-white group-hover:gap-2 transition-all">
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
            </motion.div>

            <motion.div
              id="mobile-nav-drawer"
              ref={drawerRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white shadow-xl"
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
                        aria-expanded={expandedGender === gender._id}
                        aria-controls={`mobile-gender-${gender._id}`}
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

                      <AnimatePresence initial={false}>
                        {expandedGender === gender._id && (
                          <motion.div
                            id={`mobile-gender-${gender._id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-gray-50 overflow-hidden"
                          >
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* Offers */}
                  <button
                    onClick={() => setShowOffersDropdown(!showOffersDropdown)}
                    aria-expanded={showOffersDropdown}
                    aria-controls="mobile-offers-panel"
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
                  <AnimatePresence initial={false}>
                    {showOffersDropdown && (
                      <motion.div
                        id="mobile-offers-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-50 overflow-hidden"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
