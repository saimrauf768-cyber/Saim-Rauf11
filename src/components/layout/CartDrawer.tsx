import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatPKR } from '../../lib/studioAssets';

export function CartDrawer() {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
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

  const handleApplyCoupon = async () => {
    const res = await applyCouponCode(couponInput);
    setCouponFeedback(res.message);
    if (res.ok) setCouponInput('');
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartDrawerOpen(false)}
            className="fixed inset-0 bg-black/70"
          />

          {/* Slide-over Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-[#111114] border-l border-zinc-800 h-full flex flex-col"
            aria-label="Shopping Bag"
          >
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
                  Your Bag
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-100 rounded-md"
                aria-label="Close Bag"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Delivery Progress */}
            {cart.length > 0 && (
              <div className="px-6 py-3 bg-[#09090B] border-b border-zinc-800/80">
                <p className="text-xs text-zinc-300">
                  {cartSubtotal >= 5000
                    ? 'Complimentary express delivery unlocked across Pakistan.'
                    : `Add ${formatPKR(5000 - cartSubtotal)} more for complimentary delivery.`}
                </p>
                <div className="w-full h-1 bg-zinc-800 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#D4AF37] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((cartSubtotal / 5000) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <ShoppingBag className="w-10 h-10 text-zinc-600 mb-3" />
                  <p className="font-display text-2xl text-zinc-200">
                    Your bag is empty
                  </p>
                  <p className="text-sm text-zinc-400 mt-1 max-w-xs">
                    Explore tailored shirts, selvedge denim, and formal wear crafted in PKR.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('shop');
                    }}
                    className="mt-6 px-5 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md hover:bg-[#E2C258] transition-colors"
                  >
                    Explore Collection
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.key}
                    className="flex gap-4 pb-5 border-b border-zinc-800/80"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-24 object-cover rounded-md bg-zinc-900 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-[#F4F4F5] truncate">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.key)}
                          className="text-zinc-500 hover:text-red-400 p-1 shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Size {item.size} · {item.color.name}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="inline-flex items-center border border-zinc-800 rounded-md">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.key, item.quantity - 1)
                            }
                            className="p-1.5 text-zinc-300 hover:text-[#D4AF37]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.key, item.quantity + 1)
                            }
                            className="p-1.5 text-zinc-300 hover:text-[#D4AF37]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-[#F4F4F5] tabular-nums">
                          {formatPKR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-800 bg-[#09090B] space-y-4">
                {/* Coupon */}
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Coupon code (e.g. SAIM10)"
                      className="flex-1 px-3 py-2 bg-[#111114] border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 rounded-md whitespace-nowrap shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-xs text-[#D4AF37] mt-1.5">
                      <span>Active: {appliedCoupon.code}</span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="underline text-zinc-400 hover:text-zinc-200"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {couponFeedback && (
                    <p className="text-[11px] text-zinc-400 mt-1">{couponFeedback}</p>
                  )}
                </div>

                <div className="space-y-1.5 text-sm">
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
                    <span>Shipping</span>
                    <span className="tabular-nums">
                      {cartShipping === 0 ? 'Complimentary' : formatPKR(cartShipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#F4F4F5] pt-2 border-t border-zinc-800">
                    <span>Total</span>
                    <span className="tabular-nums">{formatPKR(cartTotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('cart');
                    }}
                    className="py-2.5 px-4 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-md hover:border-zinc-500 transition-colors"
                  >
                    View Bag
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('checkout');
                    }}
                    className="py-2.5 px-4 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md hover:bg-[#E2C258] transition-colors"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
