import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STUDIO_IMAGES } from '../lib/studioAssets';

export function AboutPage() {
  const { navigate } = useStore();

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-16">
      {/* Editorial Intro */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.26em] text-[#D4AF37]">
            The Atelier
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F4F5] mt-3 leading-tight text-balance">
            Crafted in Silence. Tailored for Presence.
          </h1>
          <p className="text-base text-zinc-300 mt-5 leading-relaxed">
            Founded with a singular obsession for menswear architecture, SAIM CLOTHES bridges classic Savile-inspired pattern engineering with contemporary Pakistani tailoring. Every shirt collar, trouser drape, and embroidered kurta placket is cut to sit cleanly on the body without excess bulk.
          </p>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
            By pairing tactile 120s two-ply Egyptian cotton, raw indigo denim, and Italian-blend suiting wools with interactive 3D garment inspection, we allow clients across Lahore, Karachi, Islamabad, and beyond to examine silhouettes before ordering.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('shop')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md hover:bg-[#E2C258]"
            >
              Explore Collection
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('contact')}
              className="px-6 py-3 border border-zinc-700 hover:border-[#D4AF37] text-xs font-medium text-zinc-200 rounded-md"
            >
              Visit Flagship Atelier
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-lg overflow-hidden border border-zinc-800 min-h-[360px]">
          <img
            src={STUDIO_IMAGES.heroMenswear}
            alt="SAIM CLOTHES Tailored Menswear Editorial"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover lg:h-full"
          />
        </div>
      </section>

      {/* Three Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-800 pt-12">
        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-7">
          <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
            01. Textile Provenance
          </p>
          <h2 className="font-display text-2xl font-semibold text-[#F4F4F5] mt-2">
            Long-Staple Natural Fibers
          </h2>
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
            High-twist Egyptian cotton shirting, 480gsm combed loopback fleece, and breathable raw silk-cotton weaves selected for Pakistan&apos;s climate.
          </p>
        </div>

        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-7">
          <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
            02. Precision Patterning
          </p>
          <h2 className="font-display text-2xl font-semibold text-[#F4F4F5] mt-2">
            Architectural Silhouettes
          </h2>
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
            Single-needle French seams, reinforced spread collars, and articulated trouser waists graded across S through XXL for consistent comfort.
          </p>
        </div>

        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-7">
          <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
            03. Transparent Service
          </p>
          <h2 className="font-display text-2xl font-semibold text-[#F4F4F5] mt-2">
            Nationwide PKR Dispatch
          </h2>
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
            Clear PKR pricing with Cash on Delivery, Bank Transfer, Easypaisa, and JazzCash support, backed by direct WhatsApp client care.
          </p>
        </div>
      </section>
    </div>
  );
}
