import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  FolderPlus,
  LayoutDashboard,
  Package,
  Plus,
  Shield,
  ShoppingCart,
  Tag,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STUDIO_PRESET_OPTIONS, formatPKR } from '../lib/studioAssets';
import {
  GarmentColor,
  GarmentSize,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductStatus,
} from '../types/store';

type AdminTab = 'overview' | 'products' | 'categories' | 'orders' | 'coupons';

const ALL_SIZES: GarmentSize[] = ['S', 'M', 'L', 'XL', 'XXL'];
const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];
const PAYMENT_STATUSES: PaymentStatus[] = [
  'Cash on Delivery',
  'Awaiting Verification',
  'Verified',
  'Failed',
];

export function AdminDashboardPage() {
  const {
    user,
    isAdmin,
    signInWithGoogle,
    products,
    categories,
    orders,
    coupons,
    customers,
    inquiries,
    usingSeedFallback,
    seedCatalogToFirestore,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    updateOrderStatus,
    saveCoupon,
    deleteCoupon,
    resolveInquiry,
    deleteInquiry,
    uploadProductImage,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Product Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState("Men's Shirts");
  const [pOrigPrice, setPOrigPrice] = useState('2999');
  const [pDiscPrice, setPDiscPrice] = useState('2499');
  const [pStock, setPStock] = useState('25');
  const [pStatus, setPStatus] = useState<ProductStatus>('active');
  const [pFeatured, setPFeatured] = useState(true);
  const [pSizes, setPSizes] = useState<GarmentSize[]>(['S', 'M', 'L', 'XL']);
  const [pColors, setPColors] = useState<GarmentColor[]>([
    { name: 'Obsidian Black', hex: '#141416' },
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#D4AF37');
  const [pImages, setPImages] = useState<string[]>([STUDIO_PRESET_OPTIONS[0].url]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Coupon Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponValue, setCouponValue] = useState('15');
  const [couponMinOrder, setCouponMinOrder] = useState('2000');
  const [couponDesc, setCouponDesc] = useState('');

  const totalSales = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= 5).length,
    [products]
  );

  // Secure Admin Access Gate
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-8 py-20">
        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-8 text-center space-y-5">
          <Shield className="w-10 h-10 text-[#D4AF37] mx-auto" />
          <h1 className="font-display text-3xl font-semibold text-[#F4F4F5]">
            Owner Admin Portal
          </h1>
          <p className="text-sm text-zinc-400">
            {user
              ? `Signed in as ${user.email}. Administrator verification is required to modify store inventory, pricing, or orders.`
              : 'Sign in with the authorized store administrator Google account to manage inventory, categories, discounts, and orders.'}
          </p>
          {!user && (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="px-6 py-3 bg-[#D4AF37] hover:bg-[#E2C258] text-[#09090B] text-xs font-semibold rounded-md"
            >
              Sign In with Admin Google Account
            </button>
          )}
        </div>
      </div>
    );
  }

  const resetProductForm = () => {
    setEditingId(null);
    setPName('');
    setPDesc('');
    setPCategory(categories[0]?.name || "Men's Shirts");
    setPOrigPrice('2999');
    setPDiscPrice('2499');
    setPStock('25');
    setPStatus('active');
    setPFeatured(true);
    setPSizes(['S', 'M', 'L', 'XL']);
    setPColors([{ name: 'Obsidian Black', hex: '#141416' }]);
    setPImages([STUDIO_PRESET_OPTIONS[0].url]);
  };

  const loadProductForEdit = (p: Product) => {
    setEditingId(p.id);
    setPName(p.name);
    setPDesc(p.description);
    setPCategory(p.category);
    setPOrigPrice(String(p.originalPrice));
    setPDiscPrice(String(p.discountPrice));
    setPStock(String(p.stock));
    setPStatus(p.status);
    setPFeatured(p.featured);
    setPSizes(p.sizes);
    setPColors(p.colors);
    setPImages(p.images);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadProductImage(file);
      setPImages((prev) => [...prev.slice(0, 5), url]);
      setStatusMessage('Product image uploaded.');
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Image upload failed.'
      );
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (pSizes.length === 0 || pColors.length === 0 || pImages.length === 0) {
      setStatusMessage('Please include at least 1 size, 1 color, and 1 image.');
      return;
    }
    const orig = Math.max(1, Number(pOrigPrice));
    const disc = Math.min(orig, Math.max(1, Number(pDiscPrice)));

    setSavingProduct(true);
    try {
      const id =
        editingId ||
        `saim-${pName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 40)}-${Date.now().toString().slice(-4)}`;

      await saveProduct(
        {
          id,
          name: pName,
          description: pDesc,
          category: pCategory,
          originalPrice: orig,
          discountPrice: disc,
          sizes: pSizes,
          colors: pColors,
          images: pImages,
          stock: Math.max(0, Math.round(Number(pStock))),
          status: pStatus,
          featured: pFeatured,
        },
        Boolean(editingId)
      );
      setStatusMessage(
        editingId ? `Updated "${pName}" in Firestore.` : `Added "${pName}" to store catalog.`
      );
      resetProductForm();
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to save product.'
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleQuickStockOrPrice = async (
    p: Product,
    nextStock: number,
    nextDiscountPrice: number
  ) => {
    try {
      await saveProduct(
        {
          ...p,
          stock: Math.max(0, nextStock),
          discountPrice: Math.min(p.originalPrice, Math.max(1, nextDiscountPrice)),
        },
        true
      );
      setStatusMessage(`Updated ${p.name} stock/price.`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    const slug = catName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    await saveCategory(
      {
        id: `cat-${slug}`,
        name: catName.trim(),
        slug,
        description: catDesc.trim(),
        sortOrder: categories.length + 1,
        active: true,
      },
      false
    );
    setCatName('');
    setCatDesc('');
    setStatusMessage('Category saved.');
  };

  const handleAddCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await saveCoupon(
      {
        code: couponCode.trim().toUpperCase(),
        type: couponType,
        value: Number(couponValue),
        minOrder: Number(couponMinOrder),
        active: true,
        description: couponDesc.trim(),
      },
      false
    );
    setCouponCode('');
    setCouponDesc('');
    setStatusMessage('Discount coupon saved.');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="pb-6 border-b border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
            Owner Control Center
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4F4F5] mt-1">
            SAIM CLOTHES Admin Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {usingSeedFallback && (
            <button
              type="button"
              onClick={seedCatalogToFirestore}
              className="px-4 py-2 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
            >
              Sync Sample Catalog to Database
            </button>
          )}
          <span className="text-xs text-zinc-400">
            Admin: <strong className="text-zinc-200">{user?.email}</strong>
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-3 bg-[#111114] border border-[#D4AF37]/50 rounded-md flex items-center justify-between text-xs text-zinc-200">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#D4AF37]" />
            {statusMessage}
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {(
          [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'categories', label: `Categories (${categories.length})`, icon: FolderPlus },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingCart },
            { id: 'coupons', label: 'Discounts & Customers', icon: Tag },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#D4AF37] text-[#09090B]'
                  : 'bg-[#111114] text-zinc-300 border border-zinc-800 hover:border-zinc-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6">
              <p className="text-xs uppercase tracking-wider text-zinc-400">
                Total Sales (PKR)
              </p>
              <p className="font-display text-3xl font-semibold text-[#D4AF37] mt-2 tabular-nums">
                {formatPKR(totalSales)}
              </p>
              <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                Across {orders.length} order(s)
              </p>
            </div>

            <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6">
              <p className="text-xs uppercase tracking-wider text-zinc-400">
                Active Garments
              </p>
              <p className="font-display text-3xl font-semibold text-[#F4F4F5] mt-2 tabular-nums">
                {products.filter((p) => p.status === 'active').length}
              </p>
              <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                {lowStockCount} item(s) low on stock (≤ 5)
              </p>
            </div>

            <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6">
              <p className="text-xs uppercase tracking-wider text-zinc-400">
                Registered Customers
              </p>
              <p className="font-display text-3xl font-semibold text-[#F4F4F5] mt-2 tabular-nums">
                {customers.length}
              </p>
              <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                {inquiries.length} contact inquiry(s)
              </p>
            </div>

            <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6">
              <p className="text-xs uppercase tracking-wider text-zinc-400">
                Pending Dispatch
              </p>
              <p className="font-display text-3xl font-semibold text-[#F4F4F5] mt-2 tabular-nums">
                {
                  orders.filter((o) =>
                    ['Pending', 'Confirmed', 'Processing'].includes(o.status)
                  ).length
                }
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Orders awaiting fulfillment
              </p>
            </div>
          </div>

          <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
                Recent Orders
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="text-xs text-[#D4AF37] hover:underline"
              >
                Manage All Orders →
              </button>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6">
                No customer orders placed yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 pr-4">Order ID</th>
                      <th className="py-2.5 pr-4">Customer</th>
                      <th className="py-2.5 pr-4">Payment</th>
                      <th className="py-2.5 pr-4">Total (PKR)</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {orders.slice(0, 6).map((o) => (
                      <tr key={o.orderId} className="text-zinc-200">
                        <td className="py-3 pr-4 font-mono text-[#D4AF37]">
                          {o.orderId}
                        </td>
                        <td className="py-3 pr-4">
                          {o.customerName} ({o.city})
                        </td>
                        <td className="py-3 pr-4">
                          {o.paymentMethod} · {o.paymentStatus}
                        </td>
                        <td className="py-3 pr-4 tabular-nums font-medium">
                          {formatPKR(o.total)}
                        </td>
                        <td className="py-3">{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS CRUD */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add / Edit Form */}
          <form
            onSubmit={handleSaveProduct}
            className="lg:col-span-5 bg-[#111114] border border-zinc-800 rounded-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
                {editingId ? 'Edit Product' : 'Add New Garment'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="e.g. Executive Charcoal Linen Shirt"
                className="w-full px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Category *
              </label>
              <select
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                required
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                placeholder="Fabric weight, fit details, stitching..."
                className="w-full px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Original PKR *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pOrigPrice}
                  onChange={(e) => setPOrigPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-sm tabular-nums text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Sale Price PKR *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pDiscPrice}
                  onChange={(e) => setPDiscPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-sm tabular-nums text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Stock Qty *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  className="w-full px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-sm tabular-nums text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                Available Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((sz) => {
                  const selected = pSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        setPSizes((prev) =>
                          prev.includes(sz)
                            ? prev.filter((x) => x !== sz)
                            : [...prev, sz]
                        )
                      }
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
                        selected
                          ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]'
                          : 'bg-[#09090B] text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                Available Colors
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {pColors.map((c, idx) => (
                  <span
                    key={`${c.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#09090B] border border-zinc-800 rounded text-xs text-zinc-200"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                    <button
                      type="button"
                      onClick={() =>
                        setPColors((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-zinc-500 hover:text-red-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Color name (e.g. Pearl White)"
                  className="flex-1 px-3 py-1.5 bg-[#09090B] border border-zinc-800 rounded text-xs text-zinc-100"
                />
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-9 h-8 bg-transparent border border-zinc-800 rounded cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newColorName.trim()) return;
                    setPColors((prev) => [
                      ...prev,
                      { name: newColorName.trim(), hex: newColorHex },
                    ]);
                    setNewColorName('');
                  }}
                  className="px-3 py-1.5 bg-zinc-800 text-xs rounded text-zinc-100"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Image Upload + URL + Studio Presets */}
            <div className="space-y-2">
              <label className="block text-xs text-zinc-400">
                Product Images ({pImages.length}/6)
              </label>
              <div className="flex flex-wrap gap-2">
                {pImages.map((img, i) => (
                  <div key={`${img}-${i}`} className="relative w-16 h-16">
                    <img
                      src={img}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded border border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPImages((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 rounded-md cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {uploadingImg ? 'Uploading...' : 'Upload Image File'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setPImages((prev) => [...prev.slice(0, 5), e.target.value]);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="px-2.5 py-1.5 bg-[#09090B] border border-zinc-800 rounded text-xs text-zinc-300"
                >
                  <option value="">+ Studio Asset</option>
                  {STUDIO_PRESET_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.url}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Or paste HTTPS image URL..."
                  className="flex-1 px-3 py-1.5 bg-[#09090B] border border-zinc-800 rounded text-xs text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!imageUrlInput.trim()) return;
                    setPImages((prev) => [...prev.slice(0, 5), imageUrlInput.trim()]);
                    setImageUrlInput('');
                  }}
                  className="px-3 py-1.5 bg-zinc-800 text-xs rounded text-zinc-100"
                >
                  Add URL
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <select
                value={pStatus}
                onChange={(e) => setPStatus(e.target.value as ProductStatus)}
                className="px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-xs text-zinc-200"
              >
                <option value="active">Status: Active</option>
                <option value="draft">Status: Draft</option>
                <option value="archived">Status: Archived</option>
              </select>

              <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pFeatured}
                  onChange={(e) => setPFeatured(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                Featured Product
              </label>
            </div>

            <button
              type="submit"
              disabled={savingProduct}
              className="w-full py-3 bg-[#D4AF37] hover:bg-[#E2C258] text-[#09090B] text-xs font-semibold rounded-md inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {savingProduct
                ? 'Saving...'
                : editingId
                ? 'Update Garment'
                : 'Publish Garment to Store'}
            </button>
          </form>

          {/* Products List */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
              Catalog Inventory ({products.length})
            </h2>
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-[#111114] border border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-20 object-cover rounded bg-zinc-900 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#D4AF37] uppercase tracking-wider">
                      {p.category} · {p.status}
                    </p>
                    <h3 className="text-sm font-semibold text-zinc-100 truncate mt-0.5">
                      {p.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-400">
                      <span className="tabular-nums text-zinc-200 font-medium">
                        {formatPKR(p.discountPrice)}
                      </span>
                      <span className="tabular-nums">
                        Stock: <strong className="text-zinc-200">{p.stock}</strong>
                      </span>
                      {p.featured && (
                        <span className="text-[#D4AF37]">Featured</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickStockOrPrice(p, p.stock + 5, p.discountPrice)
                      }
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-200 rounded"
                    >
                      +5 Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => loadProductForEdit(p)}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded"
                      aria-label={`Edit ${p.name}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(p.id)}
                      className="p-2 bg-zinc-900 hover:bg-red-950 border border-zinc-700 text-red-400 rounded"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleAddCategory}
            className="lg:col-span-4 bg-[#111114] border border-zinc-800 rounded-lg p-6 space-y-4"
          >
            <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
              Add Category
            </h2>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Waistcoats"
                className="w-full px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="w-full px-3 py-2 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
            >
              Save Category
            </button>
          </form>

          <div className="lg:col-span-8 space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 bg-[#111114] border border-zinc-800 rounded-lg flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    /{cat.slug} · {cat.description || 'Active storefront category'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      saveCategory({ ...cat, active: !cat.active }, true)
                    }
                    className={`px-3 py-1 text-xs rounded border ${
                      cat.active
                        ? 'border-[#D4AF37] text-[#D4AF37]'
                        : 'border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {cat.active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat.id)}
                    className="p-2 text-red-400 hover:bg-red-950/50 rounded"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-12 bg-[#111114] border border-zinc-800 rounded-lg text-center text-sm text-zinc-400">
              No orders placed yet.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.orderId}
                className="bg-[#111114] border border-zinc-800 rounded-lg p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm font-semibold text-[#D4AF37]">
                      #{order.orderId}
                    </p>
                    <p className="text-sm font-medium text-zinc-100 mt-1">
                      {order.customerName} · {order.customerPhone}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {order.shippingAddress}, {order.city}{' '}
                      {order.postalCode || ''}
                    </p>
                    {order.paymentReference && (
                      <p className="text-xs font-mono text-[#D4AF37] mt-1">
                        Payment Ref / TID: {order.paymentReference}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right mr-2">
                      <p className="text-base font-semibold text-zinc-100 tabular-nums">
                        {formatPKR(order.total)}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {order.paymentMethod}
                      </p>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(
                          order.orderId,
                          e.target.value as OrderStatus,
                          order.paymentStatus
                        )
                      }
                      className="px-3 py-2 bg-[#09090B] border border-zinc-700 rounded text-xs text-zinc-100"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          Order: {s}
                        </option>
                      ))}
                    </select>

                    <select
                      value={order.paymentStatus}
                      onChange={(e) =>
                        updateOrderStatus(
                          order.orderId,
                          order.status,
                          e.target.value as PaymentStatus
                        )
                      }
                      className="px-3 py-2 bg-[#09090B] border border-zinc-700 rounded text-xs text-zinc-100"
                    >
                      {PAYMENT_STATUSES.map((ps) => (
                        <option key={ps} value={ps}>
                          Pay: {ps}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-zinc-800/80 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  {order.items.map((it, idx) => (
                    <div key={`${it.productId}-${idx}`}>
                      • {it.name} ({it.size}, {it.color}) × {it.quantity} —{' '}
                      <span className="tabular-nums">
                        {formatPKR(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: COUPONS & CUSTOMERS */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coupons */}
          <div className="lg:col-span-6 space-y-5">
            <form
              onSubmit={handleAddCoupon}
              className="bg-[#111114] border border-zinc-800 rounded-lg p-6 space-y-4"
            >
              <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
                Create Discount Coupon
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Code (e.g. EID20)"
                  className="px-3 py-2 bg-[#09090B] border border-zinc-800 rounded text-sm font-mono text-zinc-100"
                />
                <select
                  value={couponType}
                  onChange={(e) =>
                    setCouponType(e.target.value as 'percent' | 'fixed')
                  }
                  className="px-3 py-2 bg-[#09090B] border border-zinc-800 rounded text-sm text-zinc-100"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed PKR</option>
                </select>
                <input
                  type="number"
                  required
                  min={1}
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                  placeholder="Value"
                  className="px-3 py-2 bg-[#09090B] border border-zinc-800 rounded text-sm tabular-nums text-zinc-100"
                />
                <input
                  type="number"
                  required
                  min={0}
                  value={couponMinOrder}
                  onChange={(e) => setCouponMinOrder(e.target.value)}
                  placeholder="Min Order PKR"
                  className="px-3 py-2 bg-[#09090B] border border-zinc-800 rounded text-sm tabular-nums text-zinc-100"
                />
              </div>
              <input
                type="text"
                value={couponDesc}
                onChange={(e) => setCouponDesc(e.target.value)}
                placeholder="Description"
                className="w-full px-3 py-2 bg-[#09090B] border border-zinc-800 rounded text-sm text-zinc-100"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
              >
                Save Coupon
              </button>
            </form>

            <div className="space-y-3">
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className="p-4 bg-[#111114] border border-zinc-800 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-[#D4AF37]">
                      {c.code}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {c.type === 'percent' ? `${c.value}% off` : `${formatPKR(c.value)} off`} · Min {formatPKR(c.minOrder)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveCoupon({ ...c, active: !c.active }, true)}
                      className="px-2.5 py-1 text-xs border border-zinc-700 rounded text-zinc-200"
                    >
                      {c.active ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCoupon(c.code)}
                      className="p-1.5 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customers & Inquiries */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6">
              <h2 className="font-display text-2xl font-semibold text-[#F4F4F5] flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#D4AF37]" />
                Customers ({customers.length})
              </h2>
              {customers.length === 0 ? (
                <p className="text-xs text-zinc-400">
                  Registered clients appear here automatically upon sign-in or order placement.
                </p>
              ) : (
                <div className="space-y-3">
                  {customers.map((cust) => (
                    <div
                      key={cust.uid}
                      className="p-3 bg-[#09090B] border border-zinc-800 rounded text-xs flex justify-between"
                    >
                      <div>
                        <p className="font-medium text-zinc-100">{cust.name}</p>
                        <p className="text-zinc-400">{cust.email}</p>
                      </div>
                      <div className="text-right text-zinc-400">
                        <p>{cust.phone || '—'}</p>
                        <p>{cust.city || 'Pakistan'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6">
              <h2 className="font-display text-2xl font-semibold text-[#F4F4F5] mb-4">
                Contact Inquiries ({inquiries.length})
              </h2>
              {inquiries.length === 0 ? (
                <p className="text-xs text-zinc-400">No contact inquiries yet.</p>
              ) : (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-3.5 bg-[#09090B] border border-zinc-800 rounded text-xs space-y-2"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-zinc-100">
                          {inq.name} ({inq.email})
                        </span>
                        <span className="text-[#D4AF37]">{inq.subject}</span>
                      </div>
                      <p className="text-zinc-300">{inq.message}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-zinc-500">
                          Status: {inq.status}
                        </span>
                        <div className="flex items-center gap-2">
                          {inq.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => resolveInquiry(inq.id)}
                              className="px-2 py-1 border border-zinc-700 hover:border-[#D4AF37] text-[11px] text-zinc-200 rounded"
                            >
                              Mark Resolved
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteInquiry(inq.id)}
                            className="p-1 text-red-400 hover:text-red-300"
                            aria-label="Delete inquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
