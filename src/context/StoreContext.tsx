import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  storage,
} from '../lib/firebase';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_COUPONS,
  DEFAULT_PRODUCTS,
} from '../data/seedCatalog';
import {
  CartItem,
  Category,
  Coupon,
  CustomerRecord,
  GarmentColor,
  GarmentSize,
  Inquiry,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  Review,
  RoutePage,
} from '../types/store';

interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
}

interface StoreContextValue {
  // Navigation
  currentPage: RoutePage;
  selectedProductId: string | null;
  navigate: (page: RoutePage, productId?: string | null) => void;
  navigateToCategory: (categoryName: string) => void;
  shopCategoryFilter: string;
  setShopCategoryFilter: (cat: string) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;

  // Auth
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;

  // Catalog
  products: Product[];
  categories: Category[];
  catalogLoading: boolean;
  usingSeedFallback: boolean;

  // Cart & Coupons
  cart: CartItem[];
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    size: GarmentSize,
    color: GarmentColor,
    qty?: number,
    openDrawer?: boolean
  ) => void;
  updateCartQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  removeCoupon: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartTotal: number;
  cartCount: number;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;

  // Orders & Checkout
  orders: Order[];
  lastPlacedOrder: Order | null;
  placeOrder: (payload: CheckoutPayload) => Promise<Order>;
  lookupOrderById: (orderId: string) => Promise<Order | null>;

  // Reviews
  fetchProductReviews: (productId: string) => Promise<Review[]>;
  submitProductReview: (
    productId: string,
    rating: number,
    comment: string
  ) => Promise<void>;

  // Contact
  submitInquiry: (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => Promise<void>;

  // Admin
  coupons: Coupon[];
  customers: CustomerRecord[];
  inquiries: Inquiry[];
  seedCatalogToFirestore: () => Promise<void>;
  saveProduct: (
    product: Omit<Product, 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount'> & {
      ratingAvg?: number;
      ratingCount?: number;
    },
    isEdit: boolean
  ) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCategory: (cat: Omit<Category, 'createdAt'>, isEdit: boolean) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => Promise<void>;
  saveCoupon: (coupon: Omit<Coupon, 'createdAt'>, isEdit: boolean) => Promise<void>;
  deleteCoupon: (code: string) => Promise<void>;
  resolveInquiry: (id: string) => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;
  uploadProductImage: (file: File) => Promise<string>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'saim_clothes_cart_v1';
const WISHLIST_STORAGE_KEY = 'saim_clothes_wishlist_v1';
const GUEST_ORDERS_STORAGE_KEY = 'saim_clothes_guest_orders_v1';

function buildLocalSeedProducts(): Product[] {
  return DEFAULT_PRODUCTS.map((p) => ({ ...p }));
}

function buildLocalSeedCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((c) => ({ ...c }));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<RoutePage>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [shopCategoryFilter, setShopCategoryFilter] = useState<string>('All');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdminDoc, setIsAdminDoc] = useState(false);

  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [firestoreCategories, setFirestoreCategories] = useState<Category[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const verified = user.emailVerified;
    const isBootstrap =
      verified && user.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
    return Boolean(isBootstrap || (verified && isAdminDoc));
  }, [user, isAdminDoc]);

  const navigate = useCallback((page: RoutePage, productId?: string | null) => {
    setCurrentPage(page);
    if (page === 'shop') {
      // keep existing shopCategoryFilter unless reset explicitly
    } else {
      setShopCategoryFilter('All');
    }
    if (productId !== undefined) {
      setSelectedProductId(productId);
    } else if (page !== 'product') {
      setSelectedProductId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToCategory = useCallback((categoryName: string) => {
    setGlobalSearchQuery('');
    setShopCategoryFilter(categoryName);
    setSelectedProductId(null);
    setCurrentPage('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  // Persist guest wishlist
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (firebaseUser) {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
          setIsAdminDoc(adminSnap.exists());
        } catch {
          setIsAdminDoc(false);
        }

        // Ensure private user profile & customer CRM record exist for verified users
        if (firebaseUser.emailVerified && firebaseUser.email) {
          try {
            let localWishlist: string[] = [];
            try {
              const rawWl = localStorage.getItem(WISHLIST_STORAGE_KEY);
              localWishlist = rawWl ? (JSON.parse(rawWl) as string[]) : [];
            } catch {
              localWishlist = [];
            }

            const privateRef = doc(db, 'users', firebaseUser.uid, 'private', 'info');
            const privateSnap = await getDoc(privateRef);
            if (!privateSnap.exists()) {
              await setDoc(privateRef, {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Atelier Client',
                email: firebaseUser.email,
                wishlist: localWishlist,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } else {
              const data = privateSnap.data();
              if (Array.isArray(data.wishlist)) {
                setWishlist((prev) =>
                  Array.from(new Set([...prev, ...localWishlist, ...(data.wishlist as string[])]))
                );
              }
            }

            const customerRef = doc(db, 'customers', firebaseUser.uid);
            const customerSnap = await getDoc(customerRef);
            if (!customerSnap.exists()) {
              await setDoc(customerRef, {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } catch (err) {
            console.warn('Profile sync notice:', err);
          }
        }
      } else {
        setIsAdminDoc(false);
      }
    });
    return () => unsub();
  }, []);

  // Seed initial catalog automatically when admin logs in and Firestore is empty
  const seedCatalogToFirestore = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const batch = writeBatch(db);
      for (const cat of DEFAULT_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), {
          ...cat,
          createdAt: serverTimestamp(),
        });
      }
      for (const prod of DEFAULT_PRODUCTS) {
        batch.set(doc(db, 'products', prod.id), {
          ...prod,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const c of DEFAULT_COUPONS) {
        batch.set(doc(db, 'coupons', c.code), {
          ...c,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  }, [isAdmin]);

  // Subscribe to categories (single-field filter + client sort avoids composite index requirement)
  useEffect(() => {
    const q = isAdmin
      ? query(collection(db, 'categories'))
      : query(collection(db, 'categories'), where('active', '==', true));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Category[] = snap.docs
          .map((d) => d.data() as Category)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        setFirestoreCategories(list);
      },
      (err) => {
        console.warn('Categories subscription warning:', err.message);
      }
    );
    return () => unsub();
  }, [isAdmin]);

  // Subscribe to products
  useEffect(() => {
    const q = isAdmin
      ? query(collection(db, 'products'))
      : query(collection(db, 'products'), where('status', '==', 'active'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Product[] = snap.docs.map((d) => d.data() as Product);
        setFirestoreProducts(list);
        setCatalogLoading(false);
      },
      (err) => {
        console.warn('Products subscription warning:', err.message);
        setCatalogLoading(false);
      }
    );
    return () => unsub();
  }, [isAdmin]);

  // Auto-seed once when admin visits and Firestore products are empty
  useEffect(() => {
    if (isAdmin && !catalogLoading && firestoreProducts.length === 0) {
      seedCatalogToFirestore();
    }
  }, [isAdmin, catalogLoading, firestoreProducts.length, seedCatalogToFirestore]);

  // Use live Firestore data if available; fallback to curated catalog until admin seeds Firestore
  const usingSeedFallback = firestoreProducts.length === 0;
  const products = useMemo(() => {
    if (firestoreProducts.length > 0) return firestoreProducts;
    return buildLocalSeedProducts();
  }, [firestoreProducts]);

  const categories = useMemo(() => {
    if (firestoreCategories.length > 0) return firestoreCategories;
    return buildLocalSeedCategories();
  }, [firestoreCategories]);

  // Subscribe to Orders (Admin sees all; signed-in customer sees their own)
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      // Load guest order IDs stored locally
      try {
        const raw = localStorage.getItem(GUEST_ORDERS_STORAGE_KEY);
        const guestIds: string[] = raw ? JSON.parse(raw) : [];
        if (guestIds.length > 0) {
          Promise.all(
            guestIds.slice(0, 10).map(async (id) => {
              try {
                const snap = await getDoc(doc(db, 'orders', id));
                return snap.exists() ? (snap.data() as Order) : null;
              } catch {
                return null;
              }
            })
          ).then((res) => {
            setOrders(res.filter((x): x is Order => x !== null));
          });
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      }
      return;
    }

    const q = isAdmin
      ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'orders'), where('userId', '==', user.uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Order);
        list.sort((a, b) => {
          const ta = (a.createdAt as { seconds?: number })?.seconds ?? 0;
          const tb = (b.createdAt as { seconds?: number })?.seconds ?? 0;
          return tb - ta;
        });
        setOrders(list);
      },
      (err) => {
        console.warn('Orders subscription warning:', err.message);
      }
    );
    return () => unsub();
  }, [authReady, user, isAdmin]);

  // Admin subscriptions (coupons, customers, inquiries)
  useEffect(() => {
    if (!isAdmin) {
      setCoupons([]);
      setCustomers([]);
      setInquiries([]);
      return;
    }

    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snap) => setCoupons(snap.docs.map((d) => d.data() as Coupon)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'coupons')
    );
    const unsubCustomers = onSnapshot(
      collection(db, 'customers'),
      (snap) => setCustomers(snap.docs.map((d) => d.data() as CustomerRecord)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'customers')
    );
    const unsubInquiries = onSnapshot(
      query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')),
      (snap) => setInquiries(snap.docs.map((d) => d.data() as Inquiry)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'inquiries')
    );

    return () => {
      unsubCoupons();
      unsubCustomers();
      unsubInquiries();
    };
  }, [isAdmin]);

  // Auth actions
  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // ignore if verification rate-limited
        }
      }
    },
    []
  );

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  // Cart actions
  const addToCart = useCallback(
    (
      product: Product,
      size: GarmentSize,
      color: GarmentColor,
      qty = 1,
      openDrawer = true
    ) => {
      if (product.stock <= 0) return;
      const key = `${product.id}__${size}__${color.name}`;
      setCart((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          const nextQty = Math.min(existing.quantity + qty, product.stock);
          return prev.map((i) =>
            i.key === key ? { ...i, quantity: nextQty, maxStock: product.stock } : i
          );
        }
        return [
          ...prev,
          {
            key,
            productId: product.id,
            name: product.name,
            category: product.category,
            image: product.images[0] || '',
            price: product.discountPrice,
            originalPrice: product.originalPrice,
            size,
            color,
            quantity: Math.min(qty, product.stock),
            maxStock: product.stock,
          },
        ];
      });
      if (openDrawer) setCartDrawerOpen(true);
    },
    []
  );

  const updateCartQuantity = useCallback((key: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.key !== key) return item;
          const clamped = Math.max(0, Math.min(quantity, item.maxStock));
          return { ...item, quantity: clamped };
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  const cartDiscount = useMemo(() => {
    if (!appliedCoupon || !appliedCoupon.active) return 0;
    if (cartSubtotal < appliedCoupon.minOrder) return 0;
    if (appliedCoupon.type === 'percent') {
      return Math.min(
        cartSubtotal,
        Math.round((cartSubtotal * appliedCoupon.value) / 100)
      );
    }
    return Math.min(cartSubtotal, Math.round(appliedCoupon.value));
  }, [appliedCoupon, cartSubtotal]);

  const cartShipping = useMemo(() => {
    if (cart.length === 0) return 0;
    const afterDiscount = Math.max(0, cartSubtotal - cartDiscount);
    // Complimentary nationwide shipping on orders Rs. 5,000+
    return afterDiscount >= 5000 ? 0 : 250;
  }, [cart.length, cartSubtotal, cartDiscount]);

  const cartTotal = useMemo(
    () => Math.max(0, cartSubtotal - cartDiscount + cartShipping),
    [cartSubtotal, cartDiscount, cartShipping]
  );

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const applyCouponCode = useCallback(
    async (rawCode: string): Promise<{ ok: boolean; message: string }> => {
      const code = rawCode.trim().toUpperCase();
      if (!code) return { ok: false, message: 'Enter a coupon code.' };

      try {
        const snap = await getDoc(doc(db, 'coupons', code));
        let coupon: Coupon | null = snap.exists() ? (snap.data() as Coupon) : null;
        if (!coupon) {
          const defaultFound = DEFAULT_COUPONS.find((c) => c.code === code);
          if (defaultFound) coupon = { ...defaultFound };
        }
        if (!coupon || !coupon.active) {
          return { ok: false, message: 'Invalid or expired coupon code.' };
        }
        if (cartSubtotal < coupon.minOrder) {
          return {
            ok: false,
            message: `Minimum order of Rs. ${coupon.minOrder.toLocaleString()} required for ${code}.`,
          };
        }
        setAppliedCoupon(coupon);
        return {
          ok: true,
          message:
            coupon.type === 'percent'
              ? `${coupon.value}% discount applied (${code}).`
              : `Rs. ${coupon.value.toLocaleString()} discount applied (${code}).`,
        };
      } catch {
        const defaultFound = DEFAULT_COUPONS.find((c) => c.code === code && c.active);
        if (defaultFound && cartSubtotal >= defaultFound.minOrder) {
          setAppliedCoupon({ ...defaultFound });
          return { ok: true, message: `Coupon ${code} applied.` };
        }
        return { ok: false, message: 'Unable to validate coupon code.' };
      }
    },
    [cartSubtotal]
  );

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  // Wishlist actions
  const toggleWishlist = useCallback(
    async (productId: string) => {
      const next = wishlist.includes(productId)
        ? wishlist.filter((id) => id !== productId)
        : [...wishlist, productId];
      setWishlist(next);

      if (user && user.emailVerified) {
        try {
          const refDoc = doc(db, 'users', user.uid, 'private', 'info');
          const snap = await getDoc(refDoc);
          if (snap.exists()) {
            await updateDoc(refDoc, {
              wishlist: next,
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(refDoc, {
              uid: user.uid,
              displayName: user.displayName || 'Atelier Client',
              email: user.email || '',
              wishlist: next,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('Wishlist sync notice:', err);
        }
      }
    },
    [wishlist, user]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  // Place Order with Firestore transaction & stock decrement
  const placeOrder = useCallback(
    async (payload: CheckoutPayload): Promise<Order> => {
      if (cart.length === 0) {
        throw new Error('Your shopping bag is empty.');
      }
      const orderId = `SC-${Date.now().toString().slice(-6)}${Math.floor(
        10 + Math.random() * 89
      )}`;
      const isGuest = !user;
      const paymentStatus: PaymentStatus =
        payload.paymentMethod === 'Cash on Delivery'
          ? 'Cash on Delivery'
          : 'Awaiting Verification';

      const orderDoc: Order = {
        orderId,
        userId: user ? user.uid : 'guest',
        isGuest,
        customerName: payload.customerName.trim(),
        ...(payload.customerEmail?.trim()
          ? { customerEmail: payload.customerEmail.trim() }
          : {}),
        customerPhone: payload.customerPhone.trim(),
        shippingAddress: payload.shippingAddress.trim(),
        city: payload.city.trim(),
        ...(payload.postalCode?.trim()
          ? { postalCode: payload.postalCode.trim() }
          : {}),
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          size: item.size,
          color: item.color.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: cartSubtotal,
        ...(appliedCoupon ? { discountCode: appliedCoupon.code } : {}),
        discountAmount: cartDiscount,
        shippingFee: cartShipping,
        total: cartTotal,
        paymentMethod: payload.paymentMethod,
        ...(payload.paymentReference?.trim()
          ? { paymentReference: payload.paymentReference.trim() }
          : {}),
        paymentStatus,
        status: 'Pending',
      };

      const path = `orders/${orderId}`;
      try {
        await runTransaction(db, async (tx) => {
          // Verify and decrement stock for products persisted in Firestore
          const uniqueProductIds = Array.from(
            new Set(cart.map((c) => c.productId))
          );
          const productSnaps = await Promise.all(
            uniqueProductIds.map((pid) => tx.get(doc(db, 'products', pid)))
          );

          for (let i = 0; i < uniqueProductIds.length; i++) {
            const pid = uniqueProductIds[i];
            const snap = productSnaps[i];
            if (snap.exists()) {
              const currentStock = Number(snap.data().stock ?? 0);
              const totalOrdered = cart
                .filter((c) => c.productId === pid)
                .reduce((s, c) => s + c.quantity, 0);
              if (currentStock < totalOrdered) {
                throw new Error(
                  `Insufficient stock for ${snap.data().name}. Remaining: ${currentStock}`
                );
              }
              tx.update(doc(db, 'products', pid), {
                stock: currentStock - totalOrdered,
                updatedAt: serverTimestamp(),
              });
            }
          }

          tx.set(doc(db, 'orders', orderId), {
            ...orderDoc,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }

      if (isGuest) {
        try {
          const raw = localStorage.getItem(GUEST_ORDERS_STORAGE_KEY);
          const existingIds: string[] = raw ? JSON.parse(raw) : [];
          localStorage.setItem(
            GUEST_ORDERS_STORAGE_KEY,
            JSON.stringify([orderId, ...existingIds].slice(0, 15))
          );
          setOrders((prev) => [orderDoc, ...prev]);
        } catch {
          // ignore
        }
      }

      // Also update customer CRM phone/city if signed in
      if (user && user.emailVerified) {
        try {
          await setDoc(
            doc(db, 'customers', user.uid),
            {
              uid: user.uid,
              name: payload.customerName.trim(),
              email: user.email || payload.customerEmail || '',
              phone: payload.customerPhone.trim(),
              city: payload.city.trim(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch {
          // ignore non-critical CRM merge
        }
      }

      setLastPlacedOrder(orderDoc);
      clearCart();
      return orderDoc;
    },
    [
      cart,
      user,
      cartSubtotal,
      appliedCoupon,
      cartDiscount,
      cartShipping,
      cartTotal,
      clearCart,
    ]
  );

  const lookupOrderById = useCallback(async (orderId: string): Promise<Order | null> => {
    const clean = orderId.trim();
    if (!clean) return null;
    try {
      const snap = await getDoc(doc(db, 'orders', clean));
      return snap.exists() ? (snap.data() as Order) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `orders/${clean}`);
    }
  }, []);

  // Reviews
  const fetchProductReviews = useCallback(async (productId: string): Promise<Review[]> => {
    try {
      const q = query(
        collection(db, 'products', productId, 'reviews'),
        where('productId', '==', productId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as Review);
      return list.sort((a, b) => {
        const ta = (a.createdAt as { seconds?: number })?.seconds ?? 0;
        const tb = (b.createdAt as { seconds?: number })?.seconds ?? 0;
        return tb - ta;
      });
    } catch {
      return [];
    }
  }, []);

  const submitProductReview = useCallback(
    async (productId: string, rating: number, comment: string) => {
      if (!user) throw new Error('Please sign in to post a review.');
      if (!user.emailVerified) {
        throw new Error('Please verify your email address before posting a review.');
      }
      const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const path = `products/${productId}/reviews/${reviewId}`;
      try {
        await runTransaction(db, async (tx) => {
          const prodRef = doc(db, 'products', productId);
          const prodSnap = await tx.get(prodRef);
          if (!prodSnap.exists()) {
            throw new Error(
              'This showcase item is awaiting catalog sync by the store administrator.'
            );
          }
          const data = prodSnap.data();
          const oldCount = Number(data.ratingCount ?? 0);
          const oldAvg = Number(data.ratingAvg ?? 0);
          const newCount = oldCount + 1;
          const newAvg = Number(
            ((oldAvg * oldCount + rating) / newCount).toFixed(2)
          );

          tx.set(doc(db, 'products', productId, 'reviews', reviewId), {
            id: reviewId,
            productId,
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0] || 'Client',
            rating,
            comment: comment.trim(),
            createdAt: serverTimestamp(),
          });

          tx.update(prodRef, {
            ratingAvg: newAvg,
            ratingCount: newCount,
            updatedAt: serverTimestamp(),
          });
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [user]
  );

  // Contact inquiry
  const submitInquiry = useCallback(
    async (data: {
      name: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
    }) => {
      const id = `inq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      try {
        await setDoc(doc(db, 'inquiries', id), {
          id,
          name: data.name.trim(),
          email: data.email.trim(),
          ...(data.phone?.trim() ? { phone: data.phone.trim() } : {}),
          subject: data.subject.trim(),
          message: data.message.trim(),
          status: 'new',
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `inquiries/${id}`);
      }
    },
    []
  );

  // Admin Product CRUD
  const saveProduct = useCallback(
    async (
      product: Omit<Product, 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount'> & {
        ratingAvg?: number;
        ratingCount?: number;
      },
      isEdit: boolean
    ) => {
      const path = `products/${product.id}`;
      try {
        if (isEdit) {
          const existingSnap = await getDoc(doc(db, 'products', product.id));
          const existingData = existingSnap.exists() ? existingSnap.data() : null;
          const createdAtVal = existingData?.createdAt ?? serverTimestamp();
          await setDoc(doc(db, 'products', product.id), {
            id: product.id,
            name: product.name.trim(),
            description: product.description.trim(),
            category: product.category,
            originalPrice: Number(product.originalPrice),
            discountPrice: Number(product.discountPrice),
            sizes: product.sizes,
            colors: product.colors,
            images: product.images,
            stock: Math.max(0, Math.round(Number(product.stock))),
            status: product.status,
            featured: Boolean(product.featured),
            ratingAvg: Number(product.ratingAvg ?? existingData?.ratingAvg ?? 5),
            ratingCount: Math.round(
              Number(product.ratingCount ?? existingData?.ratingCount ?? 0)
            ),
            createdAt: createdAtVal,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(doc(db, 'products', product.id), {
            id: product.id,
            name: product.name.trim(),
            description: product.description.trim(),
            category: product.category,
            originalPrice: Number(product.originalPrice),
            discountPrice: Number(product.discountPrice),
            sizes: product.sizes,
            colors: product.colors,
            images: product.images,
            stock: Math.max(0, Math.round(Number(product.stock))),
            status: product.status,
            featured: Boolean(product.featured),
            ratingAvg: 5,
            ratingCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    []
  );

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  }, []);

  const saveCategory = useCallback(
    async (cat: Omit<Category, 'createdAt'>, isEdit: boolean) => {
      const path = `categories/${cat.id}`;
      try {
        if (isEdit) {
          const snap = await getDoc(doc(db, 'categories', cat.id));
          await setDoc(doc(db, 'categories', cat.id), {
            ...cat,
            createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
          });
        } else {
          await setDoc(doc(db, 'categories', cat.id), {
            ...cat,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    []
  );

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${categoryId}`);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus, paymentStatus?: PaymentStatus) => {
      const path = `orders/${orderId}`;
      try {
        const payload: Record<string, unknown> = {
          status,
          updatedAt: serverTimestamp(),
        };
        if (paymentStatus) {
          payload.paymentStatus = paymentStatus;
        }
        await updateDoc(doc(db, 'orders', orderId), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    []
  );

  const saveCoupon = useCallback(
    async (coupon: Omit<Coupon, 'createdAt'>, isEdit: boolean) => {
      const code = coupon.code.trim().toUpperCase();
      const path = `coupons/${code}`;
      try {
        if (isEdit) {
          const snap = await getDoc(doc(db, 'coupons', code));
          await setDoc(doc(db, 'coupons', code), {
            ...coupon,
            code,
            createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
          });
        } else {
          await setDoc(doc(db, 'coupons', code), {
            ...coupon,
            code,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    []
  );

  const deleteCoupon = useCallback(async (code: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', code));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `coupons/${code}`);
    }
  }, []);

  const resolveInquiry = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'inquiries', id), { status: 'resolved' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inquiries/${id}`);
    }
  }, []);

  const deleteInquiry = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inquiries', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inquiries/${id}`);
    }
  }, []);

  // Upload image to Firebase Storage with automatic compressed WebP/JPEG fallback
  const uploadProductImage = useCallback(async (file: File): Promise<string> => {
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageRef = ref(storage, `products/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch {
      // Fallback: compress via Canvas so admin uploads never fail if Storage CORS/rules are unconfigured
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error('Invalid image format.'));
          img.onload = () => {
            const maxDim = 900;
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas unavailable.'));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          };
          img.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const value: StoreContextValue = {
    currentPage,
    selectedProductId,
    navigate,
    navigateToCategory,
    shopCategoryFilter,
    setShopCategoryFilter,
    globalSearchQuery,
    setGlobalSearchQuery,
    user,
    authReady,
    isAdmin,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    signOutUser,
    products,
    categories,
    catalogLoading,
    usingSeedFallback,
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    cartCount,
    wishlist,
    toggleWishlist,
    isInWishlist,
    orders,
    lastPlacedOrder,
    placeOrder,
    lookupOrderById,
    fetchProductReviews,
    submitProductReview,
    submitInquiry,
    coupons,
    customers,
    inquiries,
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
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
