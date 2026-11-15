import { FormEvent, useState } from 'react';
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { RoutePage } from '../../types/store';

const PRIMARY_NAV: { label: string; page: RoutePage }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Shop', page: 'shop' },
  { label: 'Shirts', page: 'mens-shirts' },
  { label: 'Trousers', page: 'mens-trousers' },
  { label: 'T-Shirts', page: 't-shirts' },
];

const SECONDARY_LINKS: { label: string; page: RoutePage }[] = [
  { label: 'Jeans', page: 'jeans' },
  { label: 'My Orders', page: 'orders' },
  { label: 'About Us', page: 'about' },
  { label: 'Contact Us', page: 'contact' },
];

export function Navbar() {
  const {
    currentPage,
    navigate,
    cartCount,
    setCartDrawerOpen,
    wishlist,
    user,
    isAdmin,
    globalSearchQuery,
    setGlobalSearchQuery,
  } = useStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate('shop');
    setSearchOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#09090B]/95 border-b border-zinc-800/90">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 -ml-2 text-zinc-300 hover:text-[#D4AF37] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('home');
              setMobileOpen(false);
            }}
            className="font-display text-xl sm:text-2xl font-semibold tracking-[0.14em] text-[#F4F4F5] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
          >
            SAIM CLOTHES
          </button>
        </div>

        {/* Zone 2: 5 Clean Single-Line Nav Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-7 text-sm font-medium"
        >
          {PRIMARY_NAV.map((item) => {
            const active = currentPage === item.page;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => navigate(item.page)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'text-[#D4AF37]'
                    : 'text-zinc-300 hover:text-[#F4F4F5]'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-[1px] bg-[#D4AF37]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Compact Actions + Primary Bag CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="p-2 text-zinc-300 hover:text-[#D4AF37] transition-colors shrink-0"
            aria-label="Search Products"
          >
            <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => navigate('wishlist')}
            className="relative p-2 text-zinc-300 hover:text-[#D4AF37] transition-colors shrink-0"
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#D4AF37] text-[#09090B] text-[10px] font-semibold rounded-full flex items-center justify-center tabular-nums">
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate(isAdmin ? 'admin' : user ? 'orders' : 'auth')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            aria-label="Account"
          >
            <UserIcon className="w-4 h-4" />
            <span>{isAdmin ? 'Admin' : user ? 'Account' : 'Sign In'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md hover:bg-[#E2C258] transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Expandable Search Row */}
      {searchOpen && (
        <div className="border-t border-zinc-800 bg-[#111114] px-4 sm:px-8 py-3">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-[900px] mx-auto flex items-center gap-3"
          >
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search shirts, trousers, denim jeans, kurtas, hoodies..."
              autoFocus
              className="w-full bg-transparent text-sm text-[#F4F4F5] placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md whitespace-nowrap shrink-0"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200"
              aria-label="Close Search"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-[#09090B] px-4 py-4 space-y-1">
          {[...PRIMARY_NAV, ...SECONDARY_LINKS].map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => {
                navigate(item.page);
                setMobileOpen(false);
              }}
              className={`block w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                currentPage === item.page
                  ? 'bg-zinc-900 text-[#D4AF37]'
                  : 'text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                navigate('auth');
                setMobileOpen(false);
              }}
              className="px-3 py-2 text-xs font-medium bg-zinc-900 text-zinc-200 rounded-md"
            >
              {user ? 'Account & Profile' : 'Sign In / Register'}
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('admin');
                setMobileOpen(false);
              }}
              className="px-3 py-2 text-xs font-medium bg-zinc-900 text-[#D4AF37] rounded-md"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
