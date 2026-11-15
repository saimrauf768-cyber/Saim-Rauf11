import { AnimatePresence, motion } from 'motion/react';
import { CartDrawer } from './components/layout/CartDrawer';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { BrandSplash } from './components/ui/BrandSplash';
import { StoreProvider, useStore } from './context/StoreContext';
import { AboutPage } from './pages/AboutPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthPage } from './pages/AuthPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShopPage } from './pages/ShopPage';
import { WishlistPage } from './pages/WishlistPage';

function StoreRouter() {
  const { currentPage, selectedProductId } = useStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return <ShopPage />;
      case 'mens-shirts':
        return (
          <ShopPage
            presetCategory="Men's Shirts"
            pageTitle="Men's Shirts"
            pageSubtitle="Formal spread-collar dress shirts and breathable Oxford casual shirting in PKR."
          />
        );
      case 'mens-trousers':
        return (
          <ShopPage
            presetCategory="Men's Trousers"
            pageTitle="Men's Trousers & Pants"
            pageSubtitle="Slim-fit wool-blend formal trousers and everyday tailored chinos."
          />
        );
      case 'jeans':
        return (
          <ShopPage
            presetCategory="Jeans"
            pageTitle="Selvedge Denim Jeans"
            pageSubtitle="Deep indigo and charcoal stretch denim tailored for clean structure."
          />
        );
      case 't-shirts':
        return (
          <ShopPage
            presetCategory="Men's T-Shirts"
            pageTitle="Polo & T-Shirts"
            pageSubtitle="Mercerized pima cotton polos with gold tipping and heavyweight tees."
          />
        );
      case 'product':
        return <ProductDetailPage key={selectedProductId || 'product'} />;
      case 'wishlist':
        return <WishlistPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'auth':
        return <AuthPage />;
      case 'orders':
        return <OrdersPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'admin':
        return <AdminDashboardPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F4F4F5]">
      <BrandSplash />
      <Navbar />
      <CartDrawer />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPage}-${selectedProductId || ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StoreRouter />
    </StoreProvider>
  );
}
