import { FormEvent, useState } from 'react';
import { MessageCircle, Package, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../lib/studioAssets';
import { Order, OrderStatus } from '../types/store';

const TRACK_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
];

export function OrdersPage() {
  const { orders, user, lookupOrderById, navigate } = useStore();
  const [trackId, setTrackId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackMessage, setTrackMessage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    setTrackMessage(null);
    setTrackedOrder(null);
    if (!trackId.trim()) return;
    setSearching(true);
    try {
      const found = await lookupOrderById(trackId);
      if (found) {
        setTrackedOrder(found);
      } else {
        setTrackMessage('No order found with that Order ID. Check e.g. SC-123456.');
      }
    } catch {
      setTrackMessage(
        'Unable to access that Order ID. Signed-in orders require the matching customer account.'
      );
    } finally {
      setSearching(false);
    }
  };

  const renderOrderCard = (order: Order) => {
    const activeStep = TRACK_STEPS.indexOf(order.status);
    const whatsappHref = `https://wa.me/923001234567?text=${encodeURIComponent(
      `Hello SAIM CLOTHES, I am inquiring about Order #${order.orderId} (${order.status}).`
    )}`;

    return (
      <div
        key={order.orderId}
        className="bg-[#111114] border border-zinc-800 rounded-lg p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <p className="font-mono text-sm font-semibold text-[#D4AF37]">
              #{order.orderId}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {order.customerName} · {order.city} · {order.paymentMethod} (
              {order.paymentStatus})
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-[#F4F4F5] tabular-nums">
              {formatPKR(order.total)}
            </p>
            <p className="text-xs text-[#D4AF37] font-medium mt-0.5">
              Status: {order.status}
            </p>
          </div>
        </div>

        {/* Order Tracking Stepper */}
        {order.status !== 'Cancelled' ? (
          <div className="grid grid-cols-5 gap-2">
            {TRACK_STEPS.map((step, idx) => {
              const reached = activeStep >= idx;
              return (
                <div key={step} className="space-y-1.5">
                  <div
                    className={`h-1 rounded-full ${
                      reached ? 'bg-[#D4AF37]' : 'bg-zinc-800'
                    }`}
                  />
                  <p
                    className={`text-[11px] truncate ${
                      reached ? 'text-zinc-200 font-medium' : 'text-zinc-500'
                    }`}
                  >
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-red-400 font-medium">
            This order was cancelled. Contact concierge for assistance.
          </p>
        )}

        <div className="space-y-2 text-sm">
          {order.items.map((item, i) => (
            <div
              key={`${item.productId}-${i}`}
              className="flex justify-between text-zinc-300"
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

        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs text-zinc-500 truncate max-w-md">
            Ship to: {order.shippingAddress}, {order.city}
          </span>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp Support
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="pb-8 border-b border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
            Order Concierge
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F4F5] mt-2">
            My Orders &amp; Tracking
          </h1>
        </div>
        {!user && (
          <button
            type="button"
            onClick={() => navigate('auth')}
            className="px-4 py-2 border border-zinc-700 hover:border-[#D4AF37] text-xs font-medium text-zinc-200 rounded-md self-start md:self-auto"
          >
            Sign In for Full Order History
          </button>
        )}
      </div>

      {/* Direct Guest/Order ID Lookup */}
      <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-[#F4F4F5] mb-3">
          Track Any Order by Unique Order ID
        </h2>
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              placeholder="Enter Order ID (e.g. SC-482910)"
              className="w-full pl-10 pr-4 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm font-mono text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md hover:bg-[#E2C258] disabled:opacity-50"
          >
            {searching ? 'Checking...' : 'Track Order'}
          </button>
        </form>
        {trackMessage && (
          <p className="text-xs text-zinc-400 mt-3">{trackMessage}</p>
        )}
        {trackedOrder && <div className="mt-5">{renderOrderCard(trackedOrder)}</div>}
      </div>

      {/* Order History List */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
          {user ? 'Your Account Orders' : 'Recent Guest Orders on This Device'}
        </h2>
        {orders.length === 0 ? (
          <div className="py-16 text-center bg-[#111114] border border-zinc-800 rounded-lg">
            <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No orders recorded yet.</p>
            <button
              type="button"
              onClick={() => navigate('shop')}
              className="mt-5 px-5 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
            >
              Shop Collection
            </button>
          </div>
        ) : (
          <div className="space-y-5">{orders.map(renderOrderCard)}</div>
        )}
      </div>
    </div>
  );
}
