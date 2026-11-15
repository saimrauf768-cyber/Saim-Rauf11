import { useState } from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatPKR } from '../../lib/studioAssets';
import { Product } from '../../types/store';

export function ProductCard({ product }: { product: Product }) {
  const { navigate, addToCart, toggleWishlist, isInWishlist } = useStore();
  const [imgError, setImgError] = useState(false);

  const wishlisted = isInWishlist(product.id);
  const hasDiscount = product.originalPrice > product.discountPrice;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.originalPrice - product.discountPrice) / product.originalPrice) *
          100
      )
    : 0;
  const defaultSize = product.sizes[1] || product.sizes[0] || 'M';
  const defaultColor = product.colors[0] || { name: 'Obsidian', hex: '#141416' };

  return (
    <article className="group card-3d-hover bg-[#111114] border border-zinc-800/80 hover:border-[#D4AF37]/50 rounded-lg overflow-hidden flex flex-col">
      {/* Studio Product Image (4:3) */}
      <div className="relative aspect-[4/3] bg-[#16161A] overflow-hidden">
        <button
          type="button"
          onClick={() => navigate('product', product.id)}
          className="block w-full h-full text-left"
        >
          {product.images[0] && !imgError ? (
            <img
              src={product.images[0]}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-[#151518] to-[#1E1A10] p-6 text-center">
              <span className="font-display text-2xl text-[#D4AF37]">SC</span>
              <span className="text-xs text-zinc-400 mt-1">{product.name}</span>
            </div>
          )}
        </button>

        {/* Wishlist Action */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className="absolute top-3 right-3 p-2 bg-[#09090B]/85 border border-zinc-800 rounded-md text-zinc-300 hover:text-[#D4AF37] transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${
              wishlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : ''
            }`}
          />
        </button>

        {/* Subtle single text stock/discount label */}
        {product.stock <= 0 ? (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-[#09090B]/90 text-xs font-medium text-red-400 rounded">
            Sold Out
          </span>
        ) : hasDiscount ? (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-[#09090B]/90 text-xs font-medium text-[#D4AF37] rounded tabular-nums">
            Save {discountPct}%
          </span>
        ) : null}
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="uppercase tracking-wider truncate">
              {product.category}
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums shrink-0">
              <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
              {product.ratingAvg.toFixed(1)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('product', product.id)}
            className="mt-1.5 text-left block w-full"
          >
            <h3 className="text-base font-semibold text-[#F4F4F5] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
              {product.name}
            </h3>
          </button>

          {/* Color Swatches */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="w-3.5 h-3.5 rounded-full border border-zinc-600"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <span className="text-[11px] text-zinc-500 ml-1">
              {product.sizes.join(' · ')}
            </span>
          </div>
        </div>

        {/* Price + Quick Add */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold text-[#F4F4F5] tabular-nums">
              {formatPKR(product.discountPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-zinc-500 line-through tabular-nums">
                {formatPKR(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => addToCart(product, defaultSize, defaultColor, 1, true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-[#D4AF37] text-zinc-200 hover:text-[#09090B] border border-zinc-700 hover:border-[#D4AF37] disabled:opacity-40 disabled:pointer-events-none text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
