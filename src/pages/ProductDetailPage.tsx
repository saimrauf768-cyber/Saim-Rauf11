import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Box,
  Check,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { Product3DViewer } from '../components/three/Product3DViewer';
import { ProductCard } from '../components/shop/ProductCard';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../lib/studioAssets';
import { GarmentColor, GarmentSize, Review } from '../types/store';

export function ProductDetailPage() {
  const {
    products,
    selectedProductId,
    navigate,
    addToCart,
    toggleWishlist,
    isInWishlist,
    user,
    fetchProductReviews,
    submitProductReview,
  } = useStore();

  const product = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0],
    [products, selectedProductId]
  );

  const [viewMode, setViewMode] = useState<'gallery' | '3d'>('gallery');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<GarmentSize>('M');
  const [selectedColor, setSelectedColor] = useState<GarmentColor>({
    name: 'Obsidian Black',
    hex: '#141416',
  });
  const [quantity, setQuantity] = useState(1);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setActiveImageIdx(0);
    setSelectedSize(product.sizes[1] || product.sizes[0] || 'M');
    setSelectedColor(
      product.colors[0] || { name: 'Obsidian Black', hex: '#141416' }
    );
    setQuantity(1);
    setReviewFeedback(null);
    fetchProductReviews(product.id).then(setReviews);
  }, [product, fetchProductReviews]);

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-20 text-center">
        <p className="font-display text-3xl text-zinc-200">Garment not found</p>
        <button
          type="button"
          onClick={() => navigate('shop')}
          className="mt-5 px-5 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const related = products
    .filter((p) => p.id !== product.id && p.status === 'active')
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 3);

  const wishlisted = isInWishlist(product.id);
  const hasDiscount = product.originalPrice > product.discountPrice;

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity, false);
    navigate('checkout');
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewLoading(true);
    setReviewFeedback(null);
    try {
      await submitProductReview(product.id, reviewRating, reviewComment);
      setReviewComment('');
      setReviewFeedback('Your review has been published.');
      const updated = await fetchProductReviews(product.id);
      setReviews(updated);
    } catch (err) {
      setReviewFeedback(
        err instanceof Error ? err.message : 'Unable to post review right now.'
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/923001234567?text=${encodeURIComponent(
    `Assalam-o-Alaikum SAIM CLOTHES, I want to order "${product.name}" (Size: ${selectedSize}, Color: ${selectedColor.name}, Price: ${formatPKR(product.discountPrice)}).`
  )}`;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
      <button
        type="button"
        onClick={() => navigate('shop')}
        className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-[#D4AF37] mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </button>

      {/* Main Split: Sticky Media Left + Contiguous Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Gallery / 3D Switcher */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex p-1 bg-[#111114] border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'gallery'
                    ? 'bg-[#F4F4F5] text-[#09090B]'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Studio Photos
              </button>
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === '3d'
                    ? 'bg-[#D4AF37] text-[#09090B]'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                3D 360° Inspect
              </button>
            </div>
            <span className="text-xs text-zinc-400">
              {viewMode === '3d'
                ? 'Live color-matched 3D fabric model'
                : `${product.images.length} high-res studio angle(s)`}
            </span>
          </div>

          {viewMode === '3d' ? (
            <Product3DViewer
              category={product.category}
              colorHex={selectedColor.hex}
              colorName={selectedColor.name}
              productName={product.name}
            />
          ) : (
            <div className="space-y-3">
              <div className="aspect-[4/3] bg-[#111114] border border-zinc-800 rounded-lg overflow-hidden">
                <img
                  src={product.images[activeImageIdx] || product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => setActiveImageIdx(i)}
                      className={`w-24 aspect-[4/3] rounded-md overflow-hidden border transition-colors ${
                        activeImageIdx === i
                          ? 'border-[#D4AF37]'
                          : 'border-zinc-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${i + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-[#111114] border border-zinc-800 rounded-lg p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="uppercase tracking-widest text-[#D4AF37]">
                {product.category}
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                {product.ratingAvg.toFixed(1)} ({product.ratingCount} reviews)
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4F4F5] mt-2">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-2xl font-semibold text-[#F4F4F5] tabular-nums">
                {formatPKR(product.discountPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-zinc-500 line-through tabular-nums">
                  {formatPKR(product.originalPrice)}
                </span>
              )}
              <span className="text-xs text-zinc-400 ml-auto tabular-nums">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed">
            {product.description}
          </p>

          {/* Color Selection */}
          <div>
            <p className="text-xs font-medium text-zinc-300 mb-2.5">
              Color: <span className="text-[#D4AF37]">{selectedColor.name}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => {
                const active = selectedColor.name === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs transition-colors ${
                      active
                        ? 'border-[#D4AF37] bg-[#09090B] text-[#F4F4F5]'
                        : 'border-zinc-800 bg-[#09090B]/60 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-zinc-600"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex justify-between text-xs mb-2.5">
              <span className="font-medium text-zinc-300">
                Select Size: <span className="text-[#D4AF37]">{selectedSize}</span>
              </span>
              <span className="text-zinc-500">Tailored Pakistani Fit</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {product.sizes.map((sz) => {
                const active = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2.5 text-xs font-semibold rounded-md border transition-colors ${
                      active
                        ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]'
                        : 'bg-[#09090B] text-zinc-300 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-zinc-800 bg-[#09090B] rounded-md">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 text-zinc-300 hover:text-[#D4AF37]"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-medium tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))
                  }
                  className="p-3 text-zinc-300 hover:text-[#D4AF37]"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() =>
                  addToCart(product, selectedSize, selectedColor, quantity, true)
                }
                className="flex-1 py-3 px-5 bg-[#F4F4F5] hover:bg-white text-[#09090B] disabled:opacity-40 text-xs font-semibold rounded-md inline-flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label="Save to Wishlist"
                className="p-3 border border-zinc-800 hover:border-[#D4AF37] rounded-md text-zinc-300 hover:text-[#D4AF37] transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${
                    wishlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : ''
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={handleBuyNow}
              className="w-full py-3.5 px-6 bg-[#D4AF37] hover:bg-[#E2C258] text-[#09090B] disabled:opacity-40 text-sm font-semibold rounded-md transition-colors"
            >
              Buy Now · {formatPKR(product.discountPrice * quantity)}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 border border-zinc-800 hover:border-zinc-600 text-xs font-medium text-zinc-300 rounded-md inline-flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
              Order or Ask Sizing via WhatsApp
            </a>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-400">
            <p className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
              Cash on Delivery, Bank Transfer, Easypaisa &amp; JazzCash accepted
            </p>
            <p className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
              7-day unworn size exchange across Pakistan
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-20 pt-12 border-t border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
            Client Feedback
          </p>
          <h2 className="font-display text-3xl font-semibold text-[#F4F4F5] mt-1">
            Reviews &amp; Ratings
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Average rating {product.ratingAvg.toFixed(1)} out of 5 ({product.ratingCount} ratings).
          </p>

          <form
            onSubmit={handleReviewSubmit}
            className="mt-6 bg-[#111114] border border-zinc-800 rounded-lg p-6 space-y-4"
          >
            <h3 className="text-sm font-semibold text-[#F4F4F5]">
              Write a Review
            </h3>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= reviewRating
                        ? 'fill-[#D4AF37] text-[#D4AF37]'
                        : 'text-zinc-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={
                user
                  ? 'Share your thoughts on fabric, fit, and tailoring...'
                  : 'Sign in to submit a verified review...'
              }
              className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
            />
            {reviewFeedback && (
              <p className="text-xs text-[#D4AF37]">{reviewFeedback}</p>
            )}
            {user ? (
              <button
                type="submit"
                disabled={reviewLoading}
                className="px-5 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md hover:bg-[#E2C258] disabled:opacity-50"
              >
                {reviewLoading ? 'Publishing...' : 'Post Review'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('auth')}
                className="px-5 py-2.5 border border-zinc-700 text-xs font-semibold text-zinc-200 rounded-md hover:border-[#D4AF37]"
              >
                Sign In to Review
              </button>
            )}
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-[#111114] border border-zinc-800 rounded-lg p-8 text-center">
              <p className="text-sm text-zinc-400">
                No written reviews yet for this piece. Be the first verified client to share feedback.
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#111114] border border-zinc-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F4F4F5]">
                    {rev.userName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-zinc-300 mt-2.5 leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-20 pt-12 border-t border-zinc-800">
          <h2 className="font-display text-3xl font-semibold text-[#F4F4F5] mb-8">
            Pair With
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
