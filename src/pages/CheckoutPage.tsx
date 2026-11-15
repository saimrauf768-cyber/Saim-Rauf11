import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../lib/studioAssets';
import { Order, PaymentMethod } from '../types/store';

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  subtitle: string;
  gatewayNote: string;
  requiresRef: boolean;
}[] = [
  {
    id: 'Cash on Delivery',
    subtitle: 'Pay in cash upon courier arrival anywhere in Pakistan',
    gatewayNote:
      'Orders are verified via phone/WhatsApp prior to dispatch. Keep exact PKR ready for the rider.',
    requiresRef: false,
  },
  {
    id: 'Bank Transfer',
    subtitle: 'IBFT / Raast Transfer to SAIM CLOTHES Meezan Bank Account',
    gatewayNote:
      'Automated bank gateway API is not connected; orders enter Awaiting Verification until our finance desk confirms your Transaction Reference (TID).',
    requiresRef: true,
  },
  {
    id: 'Easypaisa',
    subtitle: 'Easypaisa Mobile Wallet Transfer (PKR)',
    gatewayNote:
      'Merchant API gateway requires live Easypaisa credentials. Submit your 11-digit Easypaisa TID below for manual verification — no instant charge occurs here.',
    requiresRef: true,
  },
  {
    id: 'JazzCash',
    subtitle: 'JazzCash Mobile Wallet Transfer (PKR)',
    gatewayNote:
      'Merchant API gateway requires live JazzCash credentials. Submit your JazzCash TID below for manual verification — no instant charge occurs here.',
    requiresRef: true,
  },
];

export function CheckoutPage() {
  const {
    cart,
    user,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    appliedCoupon,
    placeOrder,
    navigate,
  } = useStore();

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('Cash on Delivery');
  const [paymentReference, setPaymentReference] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const selectedPayMeta = PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)!;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedPayMeta.requiresRef && !paymentReference.trim()) {
      setErrorMsg(
        `Please enter your ${paymentMethod} Transaction Reference / TID so our team can verify your payment.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        city,
        postalCode,
        paymentMethod,
        paymentReference,
      });
      setConfirmedOrder(order);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to place order. Please check your details.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    const whatsappHref = `https://wa.me/923001234567?text=${encodeURIComponent(
      `Assalam-o-Alaikum SAIM CLOTHES! My Order ID is ${confirmedOrder.orderId} (${formatPKR(
        confirmedOrder.total
      )}, ${confirmedOrder.paymentMethod}). Name: ${confirmedOrder.customerName}, City: ${
        confirmedOrder.city
      }.`
    )}`;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-8 sm:p-10 space-y-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-9 h-9 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
                Order Recorded
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4F4F5] mt-1">
                Order #{confirmedOrder.orderId}
              </h1>
              <p className="text-sm text-zinc-300 mt-2">
                {confirmedOrder.paymentMethod === 'Cash on Delivery'
                  ? 'Your Cash on Delivery order has been saved to our database and stock has been reserved.'
                  : `Your ${confirmedOrder.paymentMethod} order has been recorded with status "Awaiting Verification" (TID: ${confirmedOrder.paymentReference}).`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-[#09090B] border border-zinc-800 rounded-md text-sm">
            <div>
              <p className="text-xs text-zinc-400">Recipient</p>
              <p className="text-zinc-100 font-medium mt-0.5">
                {confirmedOrder.customerName}
              </p>
              <p className="text-zinc-400 text-xs mt-0.5">
                {confirmedOrder.customerPhone}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Delivery Address</p>
              <p className="text-zinc-100 mt-0.5">
                {confirmedOrder.shippingAddress}, {confirmedOrder.city}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Payment Method</p>
              <p className="text-zinc-100 mt-0.5">
                {confirmedOrder.paymentMethod} · {confirmedOrder.paymentStatus}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Total Amount</p>
              <p className="text-[#D4AF37] font-semibold mt-0.5 tabular-nums">
                {formatPKR(confirmedOrder.total)}
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-zinc-800 pt-5">
            <h2 className="text-xs uppercase tracking-wider text-zinc-400">
              Items Reserved
            </h2>
            {confirmedOrder.items.map((item, idx) => (
              <div
                key={`${item.productId}-${idx}`}
                className="flex justify-between text-sm text-zinc-200"
              >
                <span>
                  {item.name} ({item.size}, {item.color}) × {item.quantity}
                </span>
                <span className="tabular-nums">
                  {formatPKR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md hover:bg-[#E2C258]"
            >
              <MessageCircle className="w-4 h-4" />
              Confirm on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => navigate('orders')}
              className="px-5 py-2.5 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-md hover:border-[#D4AF37]"
            >
              Track Order Status
            </button>
            <button
              type="button"
              onClick={() => navigate('shop')}
              className="px-5 py-2.5 text-zinc-400 hover:text-zinc-100 text-xs font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-20 text-center">
        <h1 className="font-display text-4xl text-[#F4F4F5]">
          Your bag is empty
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Add garments to your bag before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('shop')}
          className="mt-6 px-6 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
        >
          Browse Store
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
      <div className="pb-8 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
            Secure Checkout
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F4F5] mt-2">
            {user ? 'Client Checkout' : 'Guest & Client Checkout'}
          </h1>
        </div>
        {!user && (
          <button
            type="button"
            onClick={() => navigate('auth')}
            className="text-xs text-[#D4AF37] hover:underline"
          >
            Have an account? Sign in for faster order history →
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10 items-start"
      >
        {/* Left: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-8">
          {/* Customer Details */}
          <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
                Shipping Details (Pakistan)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Hamza Tariq"
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Phone Number (WhatsApp / Mobile) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Email Address (for order updates)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  City *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                >
                  {[
                    'Lahore',
                    'Karachi',
                    'Islamabad',
                    'Rawalpindi',
                    'Faisalabad',
                    'Multan',
                    'Peshawar',
                    'Quetta',
                    'Sialkot',
                    'Gujranwala',
                    'Other City in Pakistan',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Complete Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="House / Flat #, Street, Sector / Phase"
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="54000"
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* Payment System */}
          <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
                Payment Method (PKR)
              </h2>
            </div>

            <div className="space-y-3">
              {PAYMENT_OPTIONS.map((opt) => {
                const active = paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`w-full text-left p-4 rounded-md border transition-colors ${
                      active
                        ? 'border-[#D4AF37] bg-[#09090B]'
                        : 'border-zinc-800 bg-[#09090B]/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#F4F4F5]">
                        {opt.id}
                      </span>
                      <span
                        className={`text-xs ${
                          active ? 'text-[#D4AF37]' : 'text-zinc-500'
                        }`}
                      >
                        {active ? 'Selected' : 'Select'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{opt.subtitle}</p>
                    {active && (
                      <p className="text-xs text-zinc-300 mt-2.5 pt-2.5 border-t border-zinc-800">
                        {opt.gatewayNote}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedPayMeta.requiresRef && (
              <div className="p-4 bg-[#09090B] border border-[#D4AF37]/40 rounded-md space-y-3">
                <div className="text-xs text-zinc-300 space-y-1">
                  {paymentMethod === 'Bank Transfer' && (
                    <p>
                      Bank Account: <strong>Meezan Bank</strong> · Title: <strong>SAIM CLOTHES</strong> · IBAN: <strong className="font-mono">PK36MEZN0002810104829102</strong>
                    </p>
                  )}
                  {paymentMethod === 'Easypaisa' && (
                    <p>
                      Easypaisa Merchant Account: <strong className="font-mono">0300-1234567</strong> · Title: <strong>SAIM CLOTHES</strong>
                    </p>
                  )}
                  {paymentMethod === 'JazzCash' && (
                    <p>
                      JazzCash Merchant Account: <strong className="font-mono">0301-7654321</strong> · Title: <strong>SAIM CLOTHES</strong>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Transaction Reference / TID *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={`Enter ${paymentMethod} TID / Reference Number`}
                    className="w-full px-3.5 py-2.5 bg-[#111114] border border-zinc-800 rounded-md text-sm font-mono text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Review */}
        <div className="lg:col-span-5 bg-[#111114] border border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
            Order Review
          </h2>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 pb-3 border-b border-zinc-800/80"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-16 object-cover rounded bg-zinc-900 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {item.size} · {item.color.name} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-zinc-200 tabular-nums shrink-0">
                  {formatPKR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm pt-2">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPKR(cartSubtotal)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-[#D4AF37]">
                <span>Coupon ({appliedCoupon?.code})</span>
                <span className="tabular-nums">-{formatPKR(cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Shipping</span>
              <span className="tabular-nums">
                {cartShipping === 0 ? 'Complimentary' : formatPKR(cartShipping)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-[#F4F4F5] pt-3 border-t border-zinc-800">
              <span>Total Payable</span>
              <span className="tabular-nums text-[#D4AF37]">
                {formatPKR(cartTotal)}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-950/50 border border-red-800 rounded-md flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E2C258] text-[#09090B] disabled:opacity-50 text-sm font-semibold rounded-md transition-colors"
          >
            {submitting
              ? 'Reserving Stock & Placing Order...'
              : paymentMethod === 'Cash on Delivery'
              ? `Place COD Order · ${formatPKR(cartTotal)}`
              : `Submit Order for Verification · ${formatPKR(cartTotal)}`}
          </button>

          <p className="text-[11px] text-zinc-400 flex items-center gap-2 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            Real-time stock reservation &amp; encrypted Firestore order record
          </p>
        </div>
      </form>
    </div>
  );
}
