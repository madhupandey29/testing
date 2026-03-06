'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import ProductItem from '../products/fashion/product-item';
import ShopTopLeft from './shop-top-left';
import EnhancedShopSidebarFilters from './EnhancedShopSidebarFilters';
import EmptyState from '@/components/common/empty-state';
import { handleFilterSidebarOpen } from '@/redux/features/shop-filter-slice';
import { Filter } from '@/svg';

const ShopContent = ({
  all_products = [],
  products = [],
  otherProps,
  shop_right,
  hidden_sidebar,
}) => {
  // ────── ECATALOGUE PRODUCTS FILTERING ──────
  const eCatalogueProducts = useMemo(() => {
    return all_products.filter(product => {
      // Check if product contains "eCatalogue" in various fields
      const searchFields = [
        product.name,
        product.title,
        product.description,
        product.category,
        product.brand,
        product.tags?.join(' '),
        product.merchTags?.join(' '),
        JSON.stringify(product)
      ].filter(Boolean);
      
      return searchFields.some(field => 
        String(field).toLowerCase().includes('ecatalogue')
      );
    });
  }, [all_products]);

  const {
    priceFilterValues,
    selectHandleFilter,
    selectedFilters,
    handleFilterChange,
    isSearchActive,
    searchResults,
  } = otherProps || {};

  const { setPriceValue, priceValue } = priceFilterValues || {};
  const dispatch = useDispatch();

  // ────── INFINITE SCROLL STATE ──────
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const PRODUCTS_PER_LOAD = 12; // Show 12 products per load (3 rows of 4 products)
  const INITIAL_LOAD = 12; // Show 12 products initially

  // ────── INITIALIZE DISPLAYED PRODUCTS ──────
  useEffect(() => {
    if (products.length > 0) {
      const initialProducts = products.slice(0, INITIAL_LOAD);
      setDisplayedProducts(initialProducts);
      setHasMore(products.length > INITIAL_LOAD);
      } else {
      setDisplayedProducts([]);
      setHasMore(false);
    }
  }, [products]);

  // ────── LOAD MORE PRODUCTS ──────
  const loadMoreProducts = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      const currentLength = displayedProducts.length;
      const nextProducts = products.slice(currentLength, currentLength + PRODUCTS_PER_LOAD);
      
      if (nextProducts.length > 0) {
        setDisplayedProducts(prev => [...prev, ...nextProducts]);
        }
      
      setHasMore(currentLength + nextProducts.length < products.length);
      setIsLoading(false);
    }, 300);
  }, [displayedProducts.length, products, isLoading, hasMore]);

  // ────── INFINITE SCROLL OBSERVER ──────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading) {
          loadMoreProducts();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before reaching the bottom
        threshold: 0.1,
      }
    );

    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [loadMoreProducts, hasMore, isLoading]);

  // Simple header height calculation for CSS custom properties
  const [centerOffset, setCenterOffset] = useState(140);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header =
        document.querySelector('.tp-header-area') ||
        document.querySelector('.tp-header-style-primary');
      const toolbar = document.querySelector('.shop-toolbar-sticky');
      const h = header ? header.getBoundingClientRect().height : 88;
      const t = toolbar ? toolbar.getBoundingClientRect().height : 0;
      
      setCenterOffset(h + t);
      
      // Update CSS custom property for sticky positioning
      document.documentElement.style.setProperty('--tp-header-height', `${h}px`);
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const maxPrice = useMemo(() => {
    return all_products.reduce(
      (m, p) => Math.max(m, +p.salesPrice || +p.price || 0),
      1000
    );
  }, [all_products]);

  const pv = Array.isArray(priceValue) ? priceValue : [0, maxPrice];
  const priceActive = pv[0] > 0 || pv[1] < maxPrice;

  const resetAll = () => {
    setPriceValue?.([0, maxPrice]);
    handleFilterChange?.({});
  };

  // ✅ Build chips list
  const chips = useMemo(() => {
    const out = [];

    if (selectedFilters) {
      for (const [k, vals] of Object.entries(selectedFilters)) {
        if (!Array.isArray(vals)) continue;
        vals.forEach((v) => {
          out.push({
            id: `${k}:${v}`,
            key: k,
            value: String(v),
          });
        });
      }
    }

    if (priceActive) {
      out.push({
        id: `price:${pv[0]}-${pv[1]}`,
        key: 'price',
        value: `${pv[0]} - ${pv[1]}`,
      });
    }

    return out;
  }, [selectedFilters, priceActive, pv]);

  const removeChip = (chip) => {
    if (!chip) return;

    if (chip.key === 'price') {
      setPriceValue?.([0, maxPrice]);
      return;
    }

    const current = Array.isArray(selectedFilters?.[chip.key]) ? selectedFilters[chip.key] : [];
    const nextArr = current.filter((x) => String(x) !== String(chip.value));
    const next = { ...(selectedFilters || {}) };

    if (nextArr.length) next[chip.key] = nextArr;
    else delete next[chip.key];

    handleFilterChange?.(next);
  };

  return (
    <section className="tp-shop-area pb-120">
      <div className="container">
        <div className="row align-items-start shop-content-wrapper">
          {/* sidebar */}
          {!shop_right && !hidden_sidebar && (
            <aside className="col-auto shop-sidebar-col">
              <div className="sticky-filter" id="shop-filters-sidebar">
                <EnhancedShopSidebarFilters
                  selected={selectedFilters}
                  onFilterChange={handleFilterChange}
                  onResetAll={resetAll}
                  eCatalogueProducts={eCatalogueProducts} // 🎯 Pass eCatalogue products
                />
              </div>
            </aside>
          )}

          {/* main */}
          <div className={hidden_sidebar ? 'col-12' : 'col shop-main-col'}>
            <div className="tp-shop-main-wrapper">
              <div className="shop-toolbar-sticky">
                <div className="tp-shop-top">
                  <div className="row align-items-start">
                    <div className="col-xl-7 mb-10">
                      <ShopTopLeft
                        total={isSearchActive ? (searchResults?.data?.length || 0) : products.length}
                        chips={chips}
                        onRemoveChip={removeChip}
                        onClearAll={resetAll}
                      />
                    </div>
                    <div className="col-xl-5">
                      <div className="shopTopRight" role="region" aria-label="Sort toolbar">
                        {/* Enhanced Sort Dropdown */}
                        {selectHandleFilter && (
                          <div className="shopSort d-none d-lg-block">
                            <div className="sort-dropdown-wrapper">
                              <select 
                                onChange={(e) => {
                                  if (selectHandleFilter) {
                                    selectHandleFilter({ value: e.target.value });
                                  }
                                }} 
                                aria-label="Sort products"
                                className="sort-select"
                              >
                                <option value="default">Sort: Recommended</option>
                                <option value="nameAsc">Name: A to Z</option>
                                <option value="nameDesc">Name: Z to A</option>
                                <option value="new">Recently Added</option>
                                <option value="old">First Added</option>
                              </select>
                              <div className="sort-dropdown-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mobile Filter button */}
                        <div className="shopFilterBtn d-lg-none">
                          <button
                            type="button"
                            className="tp-filter-btn"
                            onClick={() => dispatch(handleFilterSidebarOpen())}
                            aria-label="Open filters"
                          >
                            <span className="tp-filter-icon"><Filter /></span>
                            <span className="tp-filter-label">Filter</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tp-shop-items-wrapper tp-shop-item-primary">
                {products.length === 0 ? (
                  <div className="shop-empty" style={{ '--page-offset': `${centerOffset}px` }}>
                    <EmptyState
                      title="No products match your filters"
                      subtitle="Try adjusting your filters."
                      tips={['Clear some filters', 'Try a different category', 'Widen the price range']}
                      primaryAction={{ label: 'Reset all filters', onClick: resetAll }}
                      secondaryAction={{ label: 'Browse all products', href: '/fabric' }}
                    />
                  </div>
                ) : (
                  <>
                    {/* ✅ Infinite Scroll Grid */}
                    <div className="products-grid">
                      {displayedProducts.map((item, i) => {
                        const uniqueKey = item._id || item.id || `product-${i}`;
                        return (
                          <ProductItem 
                            key={uniqueKey} 
                            product={item} 
                            index={i} 
                          />
                        );
                      })}
                    </div>

                    {/* Infinite Scroll Sentinel */}
                    {hasMore && (
                      <div id="infinite-scroll-sentinel" className="infinite-scroll-sentinel">
                        {isLoading && (
                          <div className="infinite-scroll-loading">
                            <div className="loading-spinner"></div>
                            <span>Loading more products...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show progress */}
                    <div className="products-progress">
                      <div className="progress-text">
                        Showing {displayedProducts.length} of {products.length} {products.length === 1 ? 'product' : 'products'}
                        {hasMore && (
                          <span className="scroll-hint"> • Scroll down for more</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {shop_right && <aside className="col-xl-3 col-lg-4 d-none d-lg-block" />}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .tp-shop-main-wrapper { overflow: visible; }
        .tp-shop-top{ padding: 14px 0; border-bottom: 1px solid var(--tp-grey-2); }
        .shop-empty {
          min-height: calc(100vh - var(--page-offset, 140px));
          display: grid;
          place-items: center;
          padding: 8px 0;
        }
        .shop-main-col { min-width: 0; }
        .products-grid{
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap:24px; /* Increased gap for larger mobile images */
          width:100%;
          margin-top: 18px;
        }
        @media (min-width: 1200px){
          .products-grid{ grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        
        /* Products Summary */
        .products-progress {
          display: flex;
          justify-content: center;
          padding: 30px 20px;
          margin-top: 20px;
          border-top: 1px solid var(--tp-grey-2);
        }
        
        .progress-text {
          font-size: 16px;
          font-weight: 600;
          color: var(--tp-text-1);
          text-align: center;
        }
        
        .scroll-hint {
          color: var(--tp-theme-primary);
          font-weight: 500;
        }
        
        /* Infinite Scroll */
        .infinite-scroll-sentinel {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
        }
        
        .infinite-scroll-loading {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--tp-text-2);
          font-size: 14px;
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--tp-grey-3);
          border-top: 2px solid var(--tp-theme-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: 1fr;
            gap: 20px; /* Normal gap - original size */
          }
          
          .progress-text {
            font-size: 14px;
          }
          
          .infinite-scroll-loading {
            font-size: 13px;
          }
          
          .products-progress {
            padding: 25px 15px;
          }
        }
        
        @media (max-width: 480px) {
          .products-grid {
            gap: 18px; /* Normal gap - original size */
            grid-template-columns: 1fr;
          }
          
          .products-progress {
            padding: 20px 15px;
          }
          
          .progress-text {
            font-size: 13px;
          }
        }
        
        @media (max-width: 991.98px){
          .shop-sidebar-col{ flex:1 1 auto; max-width:100%; }
        }
        .shopTopRight{
          display:flex;
          align-items:center;
          justify-content:flex-end;
          gap:12px;
        }
        .shopSort select{
          height:44px;
          border:1px solid var(--tp-grey-2);
          border-radius:10px;
          padding:0 12px;
          background:var(--tp-common-white);
          font: 600 13px/1 var(--tp-ff-roboto);
          color:var(--tp-text-1);
          cursor:pointer;
        }
        
        /* Enhanced Sort Dropdown Styling */
        .sort-dropdown-wrapper {
          position: relative;
          display: inline-block;
        }
        
        .sort-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          height: 44px;
          min-width: 180px;
          border: 2px solid var(--tp-grey-2);
          border-radius: 12px;
          padding: 0 40px 0 16px;
          background: var(--tp-common-white);
          font: 600 13px/1 var(--tp-ff-roboto);
          color: var(--tp-text-1);
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }
        
        .sort-select:hover {
          border-color: var(--tp-theme-primary);
          box-shadow: 0 4px 12px rgba(44, 76, 151, 0.15);
        }
        
        .sort-select:focus {
          outline: none;
          border-color: var(--tp-theme-primary);
          box-shadow: 0 0 0 3px rgba(44, 76, 151, 0.12);
        }
        
        .sort-dropdown-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: var(--tp-text-2);
          transition: all 0.3s ease;
        }
        
        .sort-dropdown-wrapper:hover .sort-dropdown-icon {
          color: var(--tp-theme-primary);
        }
        
        .sort-select option {
          padding: 8px 16px;
          font-weight: 500;
          color: var(--tp-text-1);
          background: var(--tp-common-white);
        }
        
        .sort-select option:hover {
          background: var(--tp-grey-1);
        }
        @media (max-width: 640px){
          .shopTopRight{
            display:grid;
            grid-template-columns:minmax(0,1fr) 132px;
            gap:10px;
          }
        }
      `}} />
    </section>
  );
};

export default ShopContent;
