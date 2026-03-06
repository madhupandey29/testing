'use client';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Close } from '@/svg';
import { toast } from 'react-toastify';
import { mapProductFields, getContentName, getDesignName, getFinishName, getStructureName, getColorName } from '@/utils/productFieldMapper';

/* cart thunks */
import { add_to_cart, fetch_cart_products } from '@/redux/features/cartSlice';
import { removeWishlistItem, fetchWishlist } from '@/redux/features/wishlist-slice';

import LoginArea from '@/components/login-register/login-area';
import RegisterArea from '@/components/login-register/register-area';
import useWishlistManager from '@/hooks/useWishlistManager';

import useGlobalSearch from '@/hooks/useGlobalSearch';
import { buildSearchPredicate } from '@/utils/searchMiddleware';

/* ---------- helpers (JS only) ---------- */
const nonEmpty = (v) =>
  Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '';

const pick = (...xs) => xs.find(nonEmpty);

const looksLikeId = (s) =>
  /^[a-f0-9]{24}$/i.test(String(s || '')) || /^[0-9a-f-]{8,}$/i.test(String(s || ''));

const toLabel = (v) => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') {
    const s = String(v).trim();
    return looksLikeId(s) ? '' : s;
  }
  if (Array.isArray(v)) return v.map(toLabel).filter(Boolean).join(', ');
  if (typeof v === 'object') return toLabel(v.name ?? v.title ?? v.value ?? v.label ?? '');
  return '';
};

const round = (n, d = 1) => (isFinite(n) ? Number(n).toFixed(d).replace(/\.0+$/, '') : '');
const gsmToOz = (gsm) => gsm * 0.0294935;
const cmToInch = (cm) => cm / 2.54;
const isNoneish = (s) => {
  if (!s) return true;
  const t = String(s).trim().toLowerCase().replace(/\s+/g, ' ');
  return ['none', 'na', 'none/ na', 'none / na', 'n/a', '-'].includes(t);
};

/* ---------- empty-banner manager ---------- */
function useEmptyBanner(listId, rowVisible, emptyText) {
  const rowRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__listVis = window.__listVis || {};
    const bucket = (window.__listVis[listId] = window.__listVis[listId] || {
      vis: 0,
      banner: null,
    });

    const tbody = rowRef.current?.closest('tbody');
    if (!tbody) return;

    const ensureBannerExists = () => {
      if (bucket.banner && bucket.banner.isConnected) return bucket.banner;
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      const td = document.createElement('td');
      td.colSpan = 999;
      td.innerHTML = `
        <div class="empty-wrap" role="status" aria-live="polite">
          <svg class="empty-ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path fill="currentColor" d="M10 18a8 8 0 1 1 5.3-14.03l4.36-4.35 1.41 1.41-4.35 4.36A8 8 0 0 1 10 18zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm10.59 6L16.3 17.7a8.96 8.96 0 0 0 1.41-1.41L22 20.59 20.59 22z"/>
          </svg>
          <span class="empty-text">${emptyText}</span>
        </div>
      `;
      tr.appendChild(td);
      bucket.banner = tr;
      return tr;
    };

    const prev = rowRef.current ? rowRef.current.__wasVisible : undefined;
    if (prev === undefined) {
      if (rowVisible) bucket.vis += 1;
    } else {
      if (rowVisible && !prev) bucket.vis += 1;
      if (!rowVisible && prev) bucket.vis -= 1;
    }
    if (rowRef.current) rowRef.current.__wasVisible = rowVisible;

    const banner = bucket.banner;
    if (bucket.vis <= 0) {
      const b = ensureBannerExists();
      if (!b.isConnected) tbody.appendChild(b);
    } else if (banner && banner.isConnected) {
      banner.remove();
    }

    return () => {
      const was = rowRef.current ? rowRef.current.__wasVisible : undefined;
      if (was) bucket.vis = Math.max(0, bucket.vis - 1);
      if (rowRef.current) rowRef.current.__wasVisible = false;

      if (bucket.vis <= 0) {
        const b = ensureBannerExists();
        if (!b.isConnected && tbody.isConnected) tbody.appendChild(b);
      } else if (bucket.banner && bucket.banner.isConnected && bucket.vis > 0) {
        banner.remove();
      }
    };
  }, [listId, rowVisible, emptyText]);

  return { rowRef };
}

/* ---------- Component ---------- */
const WishlistItem = ({ product }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const { cart_products } = useSelector((s) => s.cart) || {};
  const { userId, wishlist, loading } = useWishlistManager();
  const wlLoading = useSelector((s) => s.wishlist?.loading) ?? false;

  const _id =
    product?._id || product?.id || product?.product?._id || product?.productId || product?.product || null;

  const isInCart = cart_products?.find?.((item) => String(item?._id) === String(_id));

  const [moving, setMoving] = useState(false);
  const [authModal, setAuthModal] = useState(null);


  /* ---- HYDRATE ---- */
  const [hydrated, setHydrated] = useState(null);
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!_id) return;

      // Use field mapper to check for labels
      const mappedProduct = mapProductFields(product);
      const hasLabels =
        mappedProduct?.contentName ||
        mappedProduct?.design ||
        mappedProduct?.finishName ||
        mappedProduct?.structure ||
        mappedProduct?.colorName ||
        getContentName(product?.product) ||
        getDesignName(product?.product) ||
        getFinishName(product?.product) ||
        getStructureName(product?.product) ||
        getColorName(product?.product);

      if (hasLabels) return;

      const slug = product?.slug || product?.product?.slug;
      // Clean the slug by removing trailing hash character
      const cleanSlug = slug ? String(slug).replace(/#$/, '') : slug;

      const endpoints = [
        `${apiBase}/products/${_id}`,
        `${apiBase}/product/${_id}`,
        `${apiBase}/product/single/${_id}`,
        `${apiBase}/api/products/${_id}`,
        `${apiBase}/api/product/${_id}`,
        slug ? `${apiBase}/products/slug/${slug}` : null,
        slug ? `${apiBase}/product/slug/${slug}` : null,
        slug ? `${apiBase}/api/products/slug/${slug}` : null,
      ].filter(Boolean);

      for (const url of endpoints) {
        try {
          const res = await fetch(url, { credentials: 'include' });
          if (!res.ok) continue;
          const json = await res.json();
          const data = json?.data ?? json;
          if (data && typeof data === 'object' && !ignore) {
            setHydrated(data);
            break;
          }
        } catch {/*  */}
      }
    })();
    return () => {
      ignore = true;
    };
  }, [_id, product, apiBase]);

  /* SEO fallbacks (removed API call) */
  const seoDoc = null;

  // search
  const { debounced: globalQuery } = useGlobalSearch(150);
  const searchableFields = useMemo(
    () => [
      (p) => p?.title,
      (p) => p?.name,
      (p) => p?._id,
      (p) => p?.id,
      (p) => p?.slug,
      (p) => p?.fabricType || p?.fabric_type,
      (p) => toLabel(p?.content ?? hydrated?.content ?? seoDoc?.content),
      (p) => toLabel(p?.design ?? hydrated?.design ?? seoDoc?.design),
      (p) => toLabel(p?.subfinish ?? hydrated?.subfinish ?? seoDoc?.finish),
      (p) => toLabel(p?.substructure ?? hydrated?.substructure ?? seoDoc?.structure),
      (p) =>
        Array.isArray(p?.color)
          ? p.color.map((c) => toLabel(c?.name ?? c)).join(', ')
          : '',
      (p) => p?.widthLabel || p?.width_cm || p?.width,
      (p) => p?.tags,
      (p) => p?.sku,
    ],
    [hydrated, seoDoc]
  );

  const matchesQuery = useMemo(() => {
    const q = (globalQuery || '').trim();
    if (q.length < 2) return true;
    const pred = buildSearchPredicate(q, searchableFields, {
      mode: 'AND',
      normalize: true,
      minTokenLen: 2,
    });
    return pred(product);
  }, [globalQuery, product, searchableFields]);

  const showByServer = useMemo(() => {
    if (!Array.isArray(wishlist)) return false;
    return wishlist.some((it) => String(it?._id) === String(_id));
  }, [wishlist, _id]);

  const wlReady = Array.isArray(wishlist) && !wlLoading && !loading;
  const hidden = !wlReady || !matchesQuery || !showByServer;

  const { rowRef } = useEmptyBanner('wishlist', !hidden, 'No product found in wishlist');

  const currentUrlWithQuery = useMemo(() => {
    const url =
      typeof window !== 'undefined'
        ? new URL(window.location.href)
        : new URL('http://localhost');
    return url.pathname + url.search;
  }, [pathname, searchParams]);

  const pushAuthQuery = useCallback(
    (type) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (type) {
        url.searchParams.set('auth', type);
        url.searchParams.set('redirect', currentUrlWithQuery);
      } else {
        url.searchParams.delete('auth');
        url.searchParams.delete('redirect');
      }
      const qs = url.searchParams.toString();
      router.push(qs ? `${url.pathname}?${qs}` : url.pathname, { scroll: false });
    },
    [currentUrlWithQuery, router]
  );

  const closeAuth = useCallback(() => {
    setAuthModal(null);
    pushAuthQuery(null);
  }, [pushAuthQuery]);
  const openLogin = useCallback(() => {
    setAuthModal('login');
    pushAuthQuery('login');
  }, [pushAuthQuery]);
  const openRegister = useCallback(() => {
    setAuthModal('register');
    pushAuthQuery('register');
  }, [pushAuthQuery]);

  /* ---------- actions ---------- */
  const handleAddProduct = async () => {
    if (!userId) {
      openLogin();
      return;
    }
    if (!_id) return;
    
    // ✅ FIX: Check if item is already in cart before adding
    if (isInCart) {
      toast.info('Product is already in cart', {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
      return;
    }
    
    try {
      setMoving(true);
      await dispatch(
        add_to_cart({ userId, productId: String(_id), quantity: 1 })
      ).unwrap?.();
      await dispatch(fetch_cart_products({ userId }));
      // Don't open cart mini - user stays on wishlist page

      await dispatch(
        removeWishlistItem({
          customerAccountId: userId,
          productId: String(_id),
          title: getDisplayTitle,
        })
      ).unwrap?.();

      dispatch(fetchWishlist(userId));

      // Toast: white card style (like your "Added to wishlist")
      toast.dismiss();
      toast.success(`${getDisplayTitle} moved to cart`, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light', // important for white card + green progress
        toastId: `moved-${_id}`,
      });
    } catch (e) {
      // Check if error is about duplicate item
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes('already in cart') || errorMsg.includes('duplicate')) {
        toast.info('Product is already in cart', {
          position: 'top-center',
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'light',
        });
      } else {
        toast.error('Failed to move item to cart', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'light',
        });
      }
    } finally {
      setTimeout(() => setMoving(false), 250);
    }
  };

  const handleRemovePrd = async (prd) => {
    if (!userId) {
      openLogin();
      return;
    }
    try {
      await dispatch(
        removeWishlistItem({
          customerAccountId: userId,
          productId: String(prd?.id || prd?._id),
          title: getDisplayTitle,
        })
      ).unwrap?.();
      dispatch(fetchWishlist(userId));
    } catch (e) {
      alert('Failed to remove item from wishlist. Please try again.');
    }
  };

  /* ---------- presentation ---------- */
  const fallbackCdn = (process.env.NEXT_PUBLIC_CDN_BASE || 'https://test.amrita-fashions.com/shopy').replace(/\/+$/, '');

  const valueToUrlString = (v) => {
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    if (Array.isArray(v)) return valueToUrlString(v[0]);
    if (typeof v === 'object') return valueToUrlString(v.secure_url || v.url || v.path || v.key || v.img);
    return '';
  };

  const rawImg =
    valueToUrlString(product?.image1CloudUrl) ||
    valueToUrlString(product?.image2CloudUrl) ||
    valueToUrlString(product?.image3CloudUrl) ||
    valueToUrlString(product?.imageCloudUrl) ||
    valueToUrlString(product?.img) ||
    valueToUrlString(product?.image) ||
    valueToUrlString(product?.image1) ||
    valueToUrlString(product?.image2) ||
    valueToUrlString(product?.product?.image1CloudUrl) ||
    valueToUrlString(product?.product?.img) ||
    valueToUrlString(hydrated?.image1CloudUrl) ||
    valueToUrlString(hydrated?.img) ||
    '';

  const isHttpUrl = (s) => /^https?:\/\//i.test(s || '');
  const clean = (p) =>
    String(p || '')
      .replace(/^\/+/, '')
      .replace(/^api\/uploads\/?/, '')
      .replace(/^uploads\/?/, '');

  const imageUrl = rawImg
    ? isHttpUrl(rawImg)
      ? rawImg
      : `${apiBase || fallbackCdn}/uploads/${clean(rawImg)}`
    : '';

  const getDisplayTitle = useMemo(() => {
    const nameOptions = [
      product?.title,
      product?.name,
      product?.product?.name,
      hydrated?.name,
      seoDoc?.title,
      product?.productname,
      product?.productTitle,
      product?.seoTitle,
      product?.groupcode?.name,
      product?.fabricType,
      product?.content,
      product?.design,
    ].filter(Boolean);

    const firstNice = nameOptions.map(toLabel).find((s) => s && s.length > 0);
    if (firstNice) return firstNice;

    const parts = [
      toLabel(product?.color || product?.colorName || hydrated?.color),
      toLabel(product?.content || hydrated?.content),
      toLabel(product?.fabricType || hydrated?.fabricType),
      toLabel(product?.design || hydrated?.design),
    ].filter(Boolean);
    return parts.length ? parts.join(' ') + ' Fabric' : 'Product';
  }, [product, hydrated, seoDoc, _id]);

  const slug = product?.slug || product?.product?.slug || hydrated?.slug;
  
  // Generate slug from product name if no slug exists
  const generateSlug = (name) => {
    if (!name) return null;
    return String(name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
  };
  
  const fallbackSlug = generateSlug(getDisplayTitle) || _id;
  const finalSlug = slug || fallbackSlug;
  
  // Clean the slug by removing trailing hash character
  const cleanSlug = finalSlug ? String(finalSlug).replace(/#$/, '') : finalSlug;

  const src =
    hydrated || product || product?.product || {};
  const gsm = Number(
    src.gsm ?? product?.gsm ?? product?.weightGsm ?? product?.weight_gsm
  );
  const widthCm = Number(
    src.cm ??
      src.widthCm ??
      src.width_cm ??
      src.width ??
      product?.widthCm ??
      product?.width_cm ??
      product?.width
  );

  const fabricTypeVal =
    toLabel(pick(src.category?.name, src.fabricType, src.fabric_type)) ||
    'Woven Fabrics';
  const contentVal = toLabel(pick(src.content, seoDoc?.content));
  const designVal = toLabel(pick(src.design, seoDoc?.design));
  const finishVal = toLabel(pick(src.subfinish, seoDoc?.finish));
  const structureVal = toLabel(pick(src.substructure, seoDoc?.structure));
  const colorsVal = Array.isArray(src.color)
    ? toLabel(src.color.map((c) => c?.name ?? c))
    : toLabel(pick(src.colorName, src.color));

  const weightVal =
    isFinite(gsm) && gsm > 0
      ? `${round(gsm)} gsm / ${round(gsmToOz(gsm))} oz`
      : toLabel(src.weight);

  // FIX: check widthCm (not gsm) here
  const widthVal =
    isFinite(widthCm) && widthCm > 0
      ? `${round(widthCm, 0)} cm / ${round(cmToInch(widthCm), 0)} inch`
      : toLabel(src.widthLabel);

  const row1Parts = [fabricTypeVal, colorsVal, contentVal, finishVal, structureVal, designVal].filter(
    (v) => nonEmpty(v) && !isNoneish(v)
  );
  const row2Parts = [weightVal, widthVal].filter((v) => nonEmpty(v) && !isNoneish(v));

  // Get price and rating
  const price = product?.price || product?.product?.price || hydrated?.price || null;
  const salesPrice = product?.salesPrice || product?.product?.salesPrice || hydrated?.salesPrice || null;
  const displayPrice = salesPrice || price;
  
  const ratingValue = product?.ratingValue || product?.product?.ratingValue || hydrated?.ratingValue || null;
  const ratingCount = product?.ratingCount || product?.product?.ratingCount || hydrated?.ratingCount || null;

  return (
    <>
      <div
        className={`wishlist-card ${hidden ? 'hidden' : ''}`}
        ref={rowRef}
        aria-hidden={hidden ? 'true' : 'false'}
      >
        <div className="card-image-wrapper">
          <Link href={`/fabric/${cleanSlug}`} target="_blank" rel="noopener noreferrer" className="image-link">
            {!!imageUrl && (
              <img
                src={imageUrl}
                alt={getDisplayTitle || 'product image'}
                className="product-image"
                loading="lazy"
              />
            )}
          </Link>
          <button
            onClick={() => handleRemovePrd({ title: getDisplayTitle, id: _id })}
            className="remove-btn"
            type="button"
            title="Remove from wishlist"
            aria-label="Remove from wishlist"
          >
            <Close />
          </button>
        </div>

        <div className="card-body">
          <div className="title-rating-row">
            <Link href={`/fabric/${cleanSlug}`} target="_blank" rel="noopener noreferrer" className="product-title">
              {getDisplayTitle || 'Product'}
            </Link>
            {ratingValue && (
              <div className="rating-display">
                <span className="star-icon">★</span>
                <span className="rating-value">{Number(ratingValue).toFixed(1)}</span>
                {ratingCount && (
                  <span className="rating-count">({ratingCount})</span>
                )}
              </div>
            )}
          </div>

          {/* Price Row */}
          {displayPrice && (
            <div className="price-display">
              ${Number(displayPrice).toFixed(2)}
            </div>
          )}

          {(row1Parts.length > 0 || row2Parts.length > 0) && (
            <div className="product-specs">
              <div className="specs-row">
                {[...row1Parts, ...row2Parts].map((txt, i) => (
                  <span className="spec-badge" key={`spec-${i}`}>
                    {txt}
                  </span>
                ))}
              </div>
            </div>
          )}

          <span
            onClick={handleAddProduct}
            className={`move-to-cart-link ${moving ? 'loading' : ''} ${isInCart ? 'in-cart' : ''}`}
            role="button"
            tabIndex={isInCart && !moving ? -1 : 0}
            title="Move to Cart"
          >
            {moving ? 'Moving...' : isInCart ? 'In Cart' : 'Move to Cart'}
          </span>
        </div>
      </div>

      {/* AUTH MODALS */}
      {authModal === 'login' && (
        <LoginArea onClose={closeAuth} onSwitchToRegister={openRegister} />
      )}
      {authModal === 'register' && (
        <RegisterArea onClose={closeAuth} onSwitchToLogin={openLogin} />
      )}

      <style jsx>{`
        .wishlist-card {
          background: var(--tp-common-white);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid #f0f0f0;
        }

        .wishlist-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transform: translateY(-4px);
        }

        .wishlist-card.hidden {
          display: none;
        }

        .card-image-wrapper {
          position: relative;
          width: 100%;
          height: 170px;
          overflow: hidden;
          background: var(--tp-grey-1);
          flex-shrink: 0;
        }

        .image-link {
          display: block;
          width: 100%;
          height: 100%;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .wishlist-card:hover .product-image {
          transform: scale(1.05);
        }

        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
          color: #666;
          z-index: 2;
        }

        .remove-btn:hover {
          background: #ef4444;
          color: white;
          transform: scale(1.1);
        }

        .card-body {
          padding: 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .title-rating-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .product-title {
          display: block;
          font-weight: 800;
          font-size: 16px;
          line-height: 1.3;
          color: var(--tp-text-1);
          text-decoration: none;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          flex: 1;
          transition: color 0.2s ease;
        }

        .product-title:hover {
          color: var(--tp-theme-primary);
        }

        .price-display {
          font-size: 17px;
          font-weight: 700;
          color: var(--tp-theme-primary);
          margin-bottom: 4px;
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 13px;
          color: var(--tp-text-1);
          flex-shrink: 0;
          white-space: nowrap;
        }

        .star-icon {
          color: #fbbf24;
          font-size: 15px;
          line-height: 1;
        }

        .rating-value {
          font-weight: 700;
          font-size: 13px;
        }

        .rating-count {
          color: var(--tp-text-2);
          font-size: 11px;
        }

        .product-specs {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .specs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .spec-badge {
          font-size: 11px;
          color: var(--tp-text-2);
          background: var(--tp-grey-1);
          padding: 5px 9px;
          border-radius: 4px;
          border: 1px solid var(--tp-grey-3);
          font-weight: 500;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .move-to-cart-link {
          display: inline-block;
          width: 100%;
          text-align: center;
          background: transparent;
          color: var(--tp-theme-primary);
          border: none;
          padding: 10px 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: auto;
          text-decoration: none;
          position: relative;
        }

        .move-to-cart-link::after {
          content: '';
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: var(--tp-theme-primary);
          transition: width 0.2s ease;
        }

        .move-to-cart-link:hover:not(.loading):not(.in-cart) {
          color: #1e3a7a;
        }

        .move-to-cart-link:hover:not(.loading):not(.in-cart)::after {
          width: 80%;
        }

        .move-to-cart-link.loading {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .move-to-cart-link.in-cart {
          color: #10b981;
          cursor: default;
        }

        .move-to-cart-link.in-cart::after {
          display: none;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .card-image-wrapper {
            height: 150px;
          }

          .card-body {
            padding: 10px;
            gap: 6px;
          }

          .product-title {
            font-size: 13px;
            font-weight: 700;
            line-height: 1.3;
          }

          .price-display {
            font-size: 14px;
          }

          .rating-display {
            font-size: 11px;
          }

          .star-icon {
            font-size: 12px;
          }

          .rating-value {
            font-size: 11px;
          }

          .rating-count {
            font-size: 9px;
          }

          .spec-badge {
            font-size: 9px;
            padding: 3px 6px;
          }

          .move-to-cart-link {
            padding: 8px 10px;
            font-size: 13px;
          }
        }

        @media (max-width: 480px) {
          .card-image-wrapper {
            height: 130px;
          }

          .card-body {
            padding: 8px;
            gap: 5px;
          }

          .product-title {
            font-size: 12px;
            font-weight: 700;
            line-height: 1.2;
          }

          .price-display {
            font-size: 13px;
          }

          .rating-display {
            font-size: 10px;
          }

          .star-icon {
            font-size: 11px;
          }

          .rating-value {
            font-size: 10px;
          }

          .rating-count {
            font-size: 9px;
          }

          .spec-badge {
            font-size: 8px;
            padding: 2px 5px;
          }

          .move-to-cart-link {
            padding: 7px 8px;
            font-size: 12px;
          }
          }

          .remove-btn {
            width: 28px;
            height: 28px;
            top: 6px;
            right: 6px;
          }
        }
      `}</style>
    </>
  );
};

export default WishlistItem;
