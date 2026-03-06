'use client';
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NiceSelect from "@/ui/nice-select";
import ErrorMsg from "@/components/common/error-msg";
import SearchPrdLoader from "@/components/loader/search-prd-loader";
import ProductItem from "@/components/products/fashion/product-item";
import { Search } from "@/svg";
import {
  useSearchNewProductQuery,
  useGetGsmUptoQuery,
  useGetOzUptoQuery,
  useGetPriceUptoQuery,
  useGetQuantityUptoQuery,
  useGetPurchasePriceUptoQuery,
  useGetAllNewProductsQuery
} from "@/redux/features/newProductApi";

export default function SearchArea() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchText = searchParams.get('searchText') || searchParams.get('q') || '';
  const productType = searchParams.get('productType');
  const isNumeric = searchText && !isNaN(Number(searchText));
  const [shortValue, setShortValue] = useState("");
  const [searchQuery, setSearchQuery] = useState(searchText);
  const perView = 8;
  const [next, setNext] = useState(perView);

  // Update search query when URL params change
  useEffect(() => {
    setSearchQuery(searchText);
  }, [searchText]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/fabric?searchText=${encodeURIComponent(query)}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    const url = new URL(window.location);
    url.searchParams.delete('searchText');
    url.searchParams.delete('q');
    const newUrl = url.pathname + (url.search ? url.search : '');
    router.replace(newUrl);
  };

  // API hooks for all value-based APIs
  const { data: gsmData, isLoading: gsmLoading, isError: gsmError } = useGetGsmUptoQuery(searchText, { skip: !isNumeric });
  const { data: ozData, isLoading: ozLoading, isError: ozError } = useGetOzUptoQuery(searchText, { skip: !isNumeric });
  const { data: priceData, isLoading: priceLoading, isError: priceError } = useGetPriceUptoQuery(searchText, { skip: !isNumeric });
  const { data: quantityData, isLoading: quantityLoading, isError: quantityError } = useGetQuantityUptoQuery(searchText, { skip: !isNumeric });
  const { data: purchasePriceData, isLoading: purchasePriceLoading, isError: purchasePriceError } = useGetPurchasePriceUptoQuery(searchText, { skip: !isNumeric });
  const { data: searchResults, isLoading: searchLoading, isError: searchError } = useSearchNewProductQuery(searchText, { skip: !searchText || isNumeric });
  const { data: allProducts, isLoading: allLoading, isError: allError } = useGetAllNewProductsQuery(undefined, { skip: !!searchText });

  // Decide which data to use (priority order)
  let products = null;
  let isLoading = false;
  let isError = false;

  if (searchText && searchText.trim()) {
    if (isNumeric) {
      if (gsmData?.data?.length > 0) {
        products = gsmData;
        isLoading = gsmLoading;
        isError = gsmError;
      } else if (ozData?.data?.length > 0) {
        products = ozData;
        isLoading = ozLoading;
        isError = ozError;
      } else if (quantityData?.data?.length > 0) {
        products = quantityData;
        isLoading = quantityLoading;
        isError = quantityError;
      } else if (purchasePriceData?.data?.length > 0) {
        products = purchasePriceData;
        isLoading = purchasePriceLoading;
        isError = purchasePriceError;
      } else if (priceData?.data?.length > 0) {
        products = priceData;
        isLoading = priceLoading;
        isError = priceError;
      } else {
        products = { data: [] };
        isLoading = gsmLoading || ozLoading || priceLoading || quantityLoading || purchasePriceLoading;
        isError = gsmError && ozError && priceError && quantityError && purchasePriceError;
      }
    } else {
      products = searchResults;
      isLoading = searchLoading;
      isError = searchError;
    }
  } else {
    products = allProducts;
    isLoading = allLoading;
    isError = allError;
  }

  // Sorting and rendering logic
  let product_items = products?.data || [];
  
  // Handle search results from new API structure
  if (searchText && !isNumeric && searchResults?.success && Array.isArray(searchResults?.data)) {
    product_items = searchResults.data;
  }
  
  if (searchText && productType) {
    product_items = product_items.filter(
      (prd) => prd.newCategoryId?.name?.toLowerCase() === productType.toLowerCase()
    );
  }
  if (shortValue === "Price low to high") {
    product_items = product_items.slice().sort((a, b) => Number(a.salesPrice) - Number(b.salesPrice));
  }
  if (shortValue === "Price high to low") {
    product_items = product_items.slice().sort((a, b) => Number(b.salesPrice) - Number(a.salesPrice));
  }

  // UI rendering
  let content = null;
  if (isLoading) {
    content = <SearchPrdLoader loading={isLoading} />;
  } else if (isError) {
    content = <ErrorMsg msg="There was an error" />;
  } else if (product_items.length === 0) {
    content = (
      <div className="text-center pt-80 pb-80">
        <h3>Sorry, nothing matched <span style={{ color: '#0974ff' }}>{searchText}</span> search terms</h3>
      </div>
    );
  } else {
    content = (
      <>
        {/* Search Input Section */}
        <section className="tp-search-input-area pt-40 pb-20">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-8 col-lg-10">
                <div className="tp-search-input-wrapper">
                  <form onSubmit={handleSearch} className="tp-search-form">
                    <div className="tp-search-input-box">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for products..."
                        className="tp-search-input"
                        autoFocus
                      />
                      {searchQuery.trim() && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="tp-search-clear"
                          aria-label="Clear search"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        type="submit"
                        className="tp-search-btn"
                        aria-label="Search"
                      >
                        <Search />
                      </button>
                    </div>
                  </form>
                  {searchText && (
                    <div className="tp-search-result-info">
                      <p>Search results for: <strong>{`"`}{searchText}{`"`}</strong></p>
                      <button
                        onClick={clearSearch}
                        className="tp-search-back-btn"
                      >
                        ← Back to all products
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tp-shop-area pb-120">
          <div className="container">
            <div className="row">
              <div className="col-xl-12 col-lg-12">
                <div className="tp-shop-main-wrapper">
                  <div className="tp-shop-top mb-45">
                    <div className="row">
                      <div className="col-xl-6">
                        <div className="tp-shop-top-left d-flex align-items-center ">
                          <div className="tp-shop-top-result">
                            <p>Showing 1–{product_items.length} of {product_items.length} {product_items.length === 1 ? 'result' : 'results'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-6">
                        <div className="tp-shop-top-right d-sm-flex align-items-center justify-content-xl-end">
                          <div className="tp-shop-top-select">
                            <NiceSelect
                              options={[
                                { value: "Short By Price", text: "Short By Price" },
                                { value: "Price low to high", text: "Price low to high" },
                                { value: "Price high to low", text: "Price high to low" },
                              ]}
                              defaultCurrent={0}
                              onChange={(e) => setShortValue(e.value)}
                              name="Short By Price"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tp-shop-items-wrapper tp-shop-item-primary">
                    <div className="tp-search-products-grid">
                      {product_items
                        .slice(0, next)
                        ?.map((item, index) => (
                          <div key={item._id} className="tp-search-product-item">
                            <ProductItem product={item} index={index} />
                          </div>
                        ))}
                    </div>
                  </div>
                  {next < product_items?.length && (
                    <div className="load-more-btn text-center pt-50">
                      <button onClick={() => setNext(next + 4)} className="tp-btn tp-btn-2 tp-btn-blue">
                        Load More
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <style jsx>{`
          .tp-search-input-wrapper {
            background: #fff;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e5e7eb;
          }

          .tp-search-form {
            margin-bottom: 20px;
          }

          .tp-search-input-box {
            position: relative;
            width: 100%;
          }

          .tp-search-input {
            width: 100%;
            height: 56px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 0 120px 0 20px;
            font-size: 16px;
            color: #111827;
            background: #fff;
            outline: none;
            transition: all 0.3s ease;
          }

          .tp-search-input:focus {
            border-color: var(--tp-theme-primary);
            box-shadow: 0 0 0 3px rgba(44, 76, 151, 0.12);
          }

          .tp-search-input::placeholder {
            color: #6b7280;
          }

          .tp-search-clear {
            position: absolute;
            right: 60px;
            top: 50%;
            transform: translateY(-50%);
            width: 36px;
            height: 36px;
            border: none;
            background: transparent;
            color: #6b7280;
            font-size: 20px;
            cursor: pointer;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          .tp-search-clear:hover {
            background: #f3f4f6;
            color: #111827;
          }

          .tp-search-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border: none;
            background: var(--tp-theme-primary);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          .tp-search-btn:hover {
            background: var(--tp-theme-secondary);
          }

          .tp-search-result-info {
            text-align: center;
            color: #6b7280;
          }

          .tp-search-result-info p {
            margin: 0 0 10px 0;
            font-size: 16px;
          }

          .tp-search-back-btn {
            background: none;
            border: none;
            color: var(--tp-theme-primary);
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
            padding: 5px 10px;
            border-radius: 6px;
            transition: all 0.2s ease;
          }

          .tp-search-back-btn:hover {
            background: #eef2ff;
            text-decoration: none;
          }

          /* Mobile-first grid layout */
          .tp-search-products-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            width: 100%;
          }

          /* Tablet: 2 columns */
          @media (min-width: 576px) {
            .tp-search-products-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 18px;
            }
          }

          /* Desktop: 3 columns */
          @media (min-width: 992px) {
            .tp-search-products-grid {
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
          }

          /* Large desktop: 4 columns */
          @media (min-width: 1200px) {
            .tp-search-products-grid {
              grid-template-columns: repeat(4, 1fr);
              gap: 24px;
            }
          }

          .tp-search-product-item {
            width: 100%;
          }

          /* Mobile responsive adjustments */
          @media (max-width: 575px) {
            .tp-search-input-wrapper {
              padding: 20px;
              margin: 0 15px;
            }

            .tp-search-input {
              height: 50px;
              padding: 0 100px 0 16px;
              font-size: 15px;
            }

            .tp-search-clear {
              right: 50px;
              width: 32px;
              height: 32px;
              font-size: 18px;
            }

            .tp-search-btn {
              width: 36px;
              height: 36px;
              right: 7px;
            }
          }
        `}</style>
      </>
    );
  }

  return <>{content}</>;
}