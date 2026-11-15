import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../components/shop/ProductCard';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../lib/studioAssets';
import { GarmentSize } from '../types/store';

interface ShopPageProps {
  presetCategory?: string;
  pageTitle?: string;
  pageSubtitle?: string;
}

const ALL_SIZES: GarmentSize[] = ['S', 'M', 'L', 'XL', 'XXL'];

export function ShopPage({
  presetCategory,
  pageTitle = 'The Complete Collection',
  pageSubtitle = 'Filter by silhouette, size, price in PKR, or color.',
}: ShopPageProps) {
  const {
    products,
    categories,
    globalSearchQuery,
    setGlobalSearchQuery,
    shopCategoryFilter,
    setShopCategoryFilter,
  } = useStore();

  const highestPrice = useMemo(
    () =>
      Math.max(
        15000,
        ...products.map((p) => Math.ceil((p.discountPrice || 0) / 1000) * 1000)
      ),
    [products]
  );

  const [selectedCategory, setSelectedCategory] = useState<string>(
    presetCategory || shopCategoryFilter || 'All'
  );
  const [selectedSize, setSelectedSize] = useState<GarmentSize | 'All'>('All');
  const [maxPrice, setMaxPrice] = useState<number>(highestPrice);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [localSearch, setLocalSearch] = useState(globalSearchQuery);

  useEffect(() => {
    setSelectedCategory(presetCategory || shopCategoryFilter || 'All');
  }, [presetCategory, shopCategoryFilter]);

  useEffect(() => {
    setMaxPrice((prev) => (prev < highestPrice && prev === 15000 ? highestPrice : Math.min(prev, highestPrice) || highestPrice));
  }, [highestPrice]);

  useEffect(() => {
    setLocalSearch(globalSearchQuery);
  }, [globalSearchQuery]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === 'active'),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    const list = activeProducts.filter((p) => {
      // Category match (supports grouped routes like Men's Shirts / Men's Trousers)
      if (selectedCategory !== 'All') {
        if (selectedCategory === "Men's Shirts") {
          const valid = [
            "Men's Shirts",
            'Formal Shirts',
            'Casual Shirts',
          ].includes(p.category);
          if (!valid) return false;
        } else if (selectedCategory === "Men's Trousers") {
          const valid = [
            "Men's Pants",
            'Formal Trousers',
            'Casual Trousers',
          ].includes(p.category);
          if (!valid) return false;
        } else if (p.category !== selectedCategory) {
          return false;
        }
      }

      if (selectedSize !== 'All' && !p.sizes.includes(selectedSize)) {
        return false;
      }

      if (p.discountPrice > maxPrice) {
        return false;
      }

      if (q) {
        const hay = `${p.name} ${p.category} ${p.description} ${p.colors
          .map((c) => c.name)
          .join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.discountPrice - b.discountPrice);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.discountPrice - a.discountPrice);
    }
    if (sortBy === 'rating') {
      return [...list].sort((a, b) => b.ratingAvg - a.ratingAvg);
    }
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [activeProducts, selectedCategory, selectedSize, maxPrice, localSearch, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('All');
    setShopCategoryFilter('All');
    setSelectedSize('All');
    setMaxPrice(highestPrice);
    setLocalSearch('');
    setGlobalSearchQuery('');
    setSortBy('featured');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
      {/* Header */}
      <div className="pb-8 border-b border-zinc-800">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
          SAIM CLOTHES Catalog
        </p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F4F5]">
              {pageTitle}
            </h1>
            <p className="text-sm text-zinc-400 mt-2">{pageSubtitle}</p>
          </div>
          <p className="text-xs text-zinc-400 tabular-nums">
            Showing {filteredProducts.length} of {activeProducts.length} garments
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="py-6 border-b border-zinc-800/80 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setGlobalSearchQuery(e.target.value);
              }}
              placeholder="Search by garment name, fabric, or category..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#111114] border border-zinc-800 rounded-md text-sm text-[#F4F4F5] placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  setGlobalSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Size Filter */}
          <div className="lg:col-span-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-zinc-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Size:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSize('All')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedSize === 'All'
                  ? 'bg-[#D4AF37] text-[#09090B]'
                  : 'bg-[#111114] text-zinc-300 border border-zinc-800 hover:border-zinc-600'
              }`}
            >
              All
            </button>
            {ALL_SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedSize === sz
                    ? 'bg-[#D4AF37] text-[#09090B]'
                    : 'bg-[#111114] text-zinc-300 border border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* Price Ceiling */}
          <div className="lg:col-span-2 flex flex-col gap-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Max Price</span>
              <span className="text-[#D4AF37] tabular-nums font-medium">
                {formatPKR(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={1500}
              max={highestPrice}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-[#D4AF37] cursor-pointer"
            />
          </div>

          {/* Sort */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort garments"
              className="w-full px-3 py-2.5 bg-[#111114] border border-zinc-800 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* All 11 Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setShopCategoryFilter('All');
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              selectedCategory === 'All'
                ? 'bg-[#F4F4F5] text-[#09090B]'
                : 'bg-[#111114] text-zinc-300 border border-zinc-800 hover:border-zinc-600'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.name);
                setShopCategoryFilter(cat.name);
              }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-[#D4AF37] text-[#09090B]'
                  : 'bg-[#111114] text-zinc-300 border border-zinc-800 hover:border-zinc-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-[#111114] border border-zinc-800 rounded-lg mt-8">
          <p className="font-display text-3xl text-zinc-200">
            No matching garments found
          </p>
          <p className="text-sm text-zinc-400 mt-2">
            Try widening your price ceiling or clearing active category filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 px-5 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
