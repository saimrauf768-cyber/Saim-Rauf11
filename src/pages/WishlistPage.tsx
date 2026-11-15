import { Heart } from 'lucide-react';
import { ProductCard } from '../components/shop/ProductCard';
import { useStore } from '../context/StoreContext';

export function WishlistPage() {
  const { products, wishlist, navigate } = useStore();
  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
      <div className="pb-8 border-b border-zinc-800">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
          Curated Favorites
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F4F5] mt-2">
          Saved Wishlist
        </h1>
        <p className="text-sm text-zinc-400 mt-2 tabular-nums">
          {savedProducts.length} saved garment(s)
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <div className="py-20 text-center bg-[#111114] border border-zinc-800 rounded-lg mt-10">
          <Heart className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="font-display text-3xl text-zinc-200">
            Your wishlist is empty
          </p>
          <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
            Save shirts, trousers, denim, or kurtas while browsing to keep your wardrobe shortlist ready.
          </p>
          <button
            type="button"
            onClick={() => navigate('shop')}
            className="mt-6 px-6 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
          >
            Browse Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-10">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
