import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../lib/studioAssets';

export function CartPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    navigate,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  const handleCoupon = async () => {
    const res = await applyCouponCode(couponInput);
    setCouponFeedback(res.message);
    if (res.ok) setCouponInput('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
      <div className="pb-8 border-b border-zinc-800">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
          Shopping Bag
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F4F5] mt-2">
          Your Selections
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="py-20 text-center bg-[#111114] border border-zinc-800 rounded-lg mt-10">
          <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="font-display text-3xl text-zinc-200">
            Your shopping bag is currently empty
          </p>
          <p className="text-sm text-zinc-400 mt-2">
            Explore our latest tailored shirts, denim, and outerwear.
          </p>
          <button
            type="button"
            onClick={() => navigate('shop')}
            className="mt-6 px-6 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={item.key}
                className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 bg-[#111114] border border-zinc-800 rounded-lg"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-24 h-28 object-cover rounded-md bg-zinc-900 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-zinc-400">
                    {item.category}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('product', item.productId)}
                    className="font-display text-2xl text-[#F4F4F5] hover:text-[#D4AF37] text-left mt-0.5"
                  >
                    {item.name}
                  </button>
                  <p className="text-xs text-zinc-400 mt-1">
                    Size: {item.size} · Color: {item.color.name}
                  </p>
                  <p className="text-sm font-medium text-zinc-200 mt-2 tabular-nums">
                    {formatPKR(item.price)} each
                  </p>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4">
                  <div className="inline-flex items-center border border-zinc-800 bg-[#09090B] rounded-md">
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQuantity(item.key, item.quantity - 1)
                      }
                      className="p-2 text-zinc-300 hover:text-[#D4AF37]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQuantity(item.key, item.quantity + 1)
                      }
                      className="p-2 text-zinc-300 hover:text-[#D4AF37]"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-semibold text-[#F4F4F5] tabular-nums">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="lg:col-span-4 bg-[#111114] border border-zinc-800 rounded-lg p-6 space-y-5">
            <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
              Order Summary
            </h2>

            <div className="space-y-2">
              <label className="block text-xs text-zinc-400">
                Promo / Discount Coupon
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="SAIM10 or GOLD500"
                  className="flex-1 px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-xs text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={handleCoupon}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 rounded-md"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-[#D4AF37]">
                  <span>Coupon active: {appliedCoupon.code}</span>
                  <button type="button" onClick={removeCoupon} className="underline">
                    Remove
                  </button>
                </div>
              )}
              {couponFeedback && (
                <p className="text-xs text-zinc-400">{couponFeedback}</p>
              )}
            </div>

            <div className="space-y-2.5 text-sm pt-4 border-t border-zinc-800">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPKR(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#D4AF37]">
                  <span>Discount</span>
                  <span className="tabular-nums">-{formatPKR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Delivery (Pakistan)</span>
                <span className="tabular-nums">
                  {cartShipping === 0 ? 'Complimentary' : formatPKR(cartShipping)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-[#F4F4F5] pt-3 border-t border-zinc-800">
                <span>Total (PKR)</span>
                <span className="tabular-nums">{formatPKR(cartTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('checkout')}
              className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E2C258] text-[#09090B] text-sm font-semibold rounded-md transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
