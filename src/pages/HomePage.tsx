import { ArrowRight } from 'lucide-react';
import { Hero3DCanvas } from '../components/three/Hero3DCanvas';
import { ProductCard } from '../components/shop/ProductCard';
import { useStore } from '../context/StoreContext';
import { STUDIO_IMAGES } from '../lib/studioAssets';

export function HomePage() {
  const { products, categories, navigate, navigateToCategory } = useStore();

  const featuredProducts = products
    .filter((p) => p.status === 'active' && p.featured)
    .slice(0, 6);

  const displayFeatured =
    featuredProducts.length > 0
      ? featuredProducts
      : products.filter((p) => p.status === 'active').slice(0, 6);

  const handleCategoryJump = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    if (lower === "men's shirts") {
      navigate('mens-shirts');
    } else if (lower === "men's pants") {
      navigate('mens-trousers');
    } else if (lower === 'jeans') {
      navigate('jeans');
    } else if (lower === "men's t-shirts") {
      navigate('t-shirts');
    } else {
      navigateToCategory(categoryName);
    }
  };

  return (
    <div>
      {/* 1. 3D Fashion Hero Showcase */}
      <section className="relative border-b border-zinc-800/80 bg-[#09090B] overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.26em] text-[#D4AF37] font-medium">
              Autumn · Winter Atelier Collection
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#F4F4F5] leading-[1.06] mt-4 text-balance">
              Architectural Menswear Tailored in Black &amp; Gold
            </h1>
            <p className="text-base text-zinc-400 mt-5 max-w-xl leading-relaxed">
              Precision-cut Egyptian cotton shirts, Italian-blend trousers, selvedge denim, and formal Pakistani kurtas. Inspect every silhouette in interactive 3D before ordering nationwide in PKR.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('shop')}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#D4AF37] text-[#09090B] text-sm font-semibold rounded-md hover:bg-[#E2C258] transition-colors whitespace-nowrap shrink-0"
              >
                Explore Collection
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('mens-shirts')}
                className="px-6 py-3 border border-zinc-700 hover:border-[#D4AF37] text-sm font-medium text-zinc-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Shop Men&apos;s Shirts
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 min-h-[400px] sm:min-h-[480px] lg:min-h-[540px] rounded-lg border border-zinc-800/80 bg-[#09090B] overflow-hidden relative">
            <Hero3DCanvas />
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Interactive 3D Atelier Bust · Move pointer to inspect</span>
              <span className="text-[#D4AF37] tabular-nums">PKR Pricing</span>
            </div>
          </div>
        </div>

        {/* Full-width 4-column Atelier Standards Strip */}
        <div className="border-t border-zinc-800/80 bg-[#0C0C0F]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
                Fabric Standard
              </p>
              <p className="text-sm font-medium text-zinc-200 mt-1">
                120s Two-Ply Egyptian Cotton
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
                3D Inspection
              </p>
              <p className="text-sm font-medium text-zinc-200 mt-1">
                360° Garment &amp; Color Preview
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
                Payment Options
              </p>
              <p className="text-sm font-medium text-zinc-200 mt-1">
                COD · Easypaisa · JazzCash · Bank
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
                Nationwide Delivery
              </p>
              <p className="text-sm font-medium text-zinc-200 mt-1">
                Free Above Rs. 5,000 Across Pakistan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Collection Grid */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-zinc-800/80">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
              Curated Selection
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4F4F5] mt-1.5">
              Signature Wardrobe Essentials
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('shop')}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
          >
            View All Garments
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-10">
          {displayFeatured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. Editorial Story & All 11 Categories Directory */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-[#111114] border border-zinc-800 rounded-lg overflow-hidden">
          <div className="lg:col-span-5 relative min-h-[320px]">
            <img
              src={STUDIO_IMAGES.heroMenswear}
              alt="SAIM CLOTHES Tailored Menswear Campaign"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover lg:h-full"
            />
          </div>

          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
                House Departments
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4F4F5] mt-2 text-balance">
                Eleven Tailored Categories for Every Occasion
              </h2>
              <p className="text-sm text-zinc-400 mt-3 max-w-2xl leading-relaxed">
                From crisp boardroom formal shirts and slim wool trousers to heavyweight hoodies and royal embroidered kurtas, browse any SAIM CLOTHES department directly.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-7">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryJump(cat.name)}
                    className="px-3.5 py-2.5 text-left text-xs font-medium bg-[#09090B] hover:bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/70 text-zinc-200 rounded-md transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-8 mt-8 border-t border-zinc-800/80 text-xs text-zinc-400">
              <span>Use code <strong className="text-[#D4AF37]">SAIM10</strong> at checkout for 10% off orders above Rs. 1,500</span>
              <button
                type="button"
                onClick={() => navigate('about')}
                className="text-zinc-200 hover:text-[#D4AF37] underline"
              >
                Read Our Atelier Story
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
