import { MessageCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export function Footer() {
  const { navigate } = useStore();

  return (
    <footer className="border-t border-zinc-800 bg-[#09090B] mt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="font-display text-2xl font-semibold tracking-[0.14em] text-[#F4F4F5]"
          >
            SAIM CLOTHES
          </button>
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
            Contemporary Pakistani menswear atelier combining architectural tailoring, fine natural fabrics, and nationwide concierge delivery.
          </p>
          <a
            href="https://wa.me/923001234567?text=Assalam-o-Alaikum%20SAIM%20CLOTHES%2C%20I%20would%20like%20assistance%20with%20an%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 border border-zinc-700 hover:border-[#D4AF37] text-xs font-medium text-zinc-200 rounded-md transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
            WhatsApp Concierge
          </a>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Collections
          </h3>
          <ul className="space-y-2.5 text-sm text-zinc-300">
            <li>
              <button type="button" onClick={() => navigate('shop')} className="hover:text-[#D4AF37] transition-colors">
                All Menswear
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('mens-shirts')} className="hover:text-[#D4AF37] transition-colors">
                Men&apos;s Shirts
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('mens-trousers')} className="hover:text-[#D4AF37] transition-colors">
                Men&apos;s Trousers
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('jeans')} className="hover:text-[#D4AF37] transition-colors">
                Selvedge Jeans
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('t-shirts')} className="hover:text-[#D4AF37] transition-colors">
                Polo &amp; T-Shirts
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Client Services
          </h3>
          <ul className="space-y-2.5 text-sm text-zinc-300">
            <li>
              <button type="button" onClick={() => navigate('orders')} className="hover:text-[#D4AF37] transition-colors">
                Track &amp; Manage Orders
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('wishlist')} className="hover:text-[#D4AF37] transition-colors">
                Saved Wishlist
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('cart')} className="hover:text-[#D4AF37] transition-colors">
                Shopping Bag
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('auth')} className="hover:text-[#D4AF37] transition-colors">
                Client Sign In / Register
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Maison &amp; Portal
          </h3>
          <ul className="space-y-2.5 text-sm text-zinc-300">
            <li>
              <button type="button" onClick={() => navigate('about')} className="hover:text-[#D4AF37] transition-colors">
                About SAIM CLOTHES
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('contact')} className="hover:text-[#D4AF37] transition-colors">
                Contact &amp; Flagships
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('admin')} className="text-[#D4AF37] hover:underline">
                Owner Admin Dashboard
              </button>
            </li>
          </ul>
          <p className="text-xs text-zinc-500 mt-5">
            Payments: COD · Bank Transfer · Easypaisa · JazzCash (PKR)
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-900 py-5 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} SAIM CLOTHES. All rights reserved.</p>
          <p>Lahore · Karachi · Islamabad — Nationwide Express Dispatch</p>
        </div>
      </div>
    </footer>
  );
}
