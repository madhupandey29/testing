'use client';

import React, { useEffect, useState, useId, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { formatProductForCart, formatProductForWishlist } from '@/utils/authUtils';
import { add_to_cart, openCartMini, fetch_cart_products } from '@/redux/features/cartSlice';
import { toggleWishlistItem } from '@/redux/features/wishlist-slice';
import { getCollectionMediaForProduct } from '@/utils/collectionUtils';

import { Cart, CartActive, Wishlist, WishlistActive, QuickView, Share } from '@/svg';
import { handleProductModal } from '@/redux/features/productModalSlice';
import { useGetProductsByGroupcodeQuery } from '@/redux/features/productApi';
import { useGetProductsByCollectionQuery } from '@/redux/features/newProductApi';

import useGlobalSearch from '@/hooks/useGlobalSearch';
import { buildSearchPredicate } from '@/utils/searchMiddleware';
import { selectUserId } from '@/utils/userSelectors';

/* helpers */
const nonEmpty = (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '');
const pick = (...xs) => xs.find(nonEmpty);
const toText = (v) => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(', ');
  if (typeof v === 'object') return toText(v.name ?? v.value ?? v.title ?? v.label ?? '');
  return '';
};
const isNoneish = (s) => {
  if (!s) return true;
  const t = String(s).trim().toLowerCase().replace(/\s+/g, ' ');
  return ['none', 'na', 'none/ na', 'none / na', 'n/a', '-'].includes(t);
};
const round = (n, d = 1) => (isFinite(n) ? Number(n).toFixed(d).replace(/\.0+$/, '') : '');
const gsmToOz = (gsm) => gsm * 0.0294935;
const cmToInch = (cm) => cm / 2.54;
const uniq = (arr) => {
  const seen = new Set();
  return arr.filter((x) => {
    const k = String(x).trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};
const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ');

// Helper function to convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  
  // Handle YouTube URLs
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(youtubeRegex);
  
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  
  // Return original URL if it's already an embed URL or other video service
  return url;
};

/* safely extract a comparable id */
const getAnyId = (obj) =>
  obj?._id || obj?.id || obj?.productId || obj?.slug || obj?.productslug || obj?.product?._id || obj?.product?.id || obj?.product;

/* ensure a robust cart payload for your slice */
const buildCartItem = (prd, opts = {}) => {
  const id = getAnyId(prd);
  const slug = prd?.slug || prd?.product?.slug || id;
  const name =
    prd?.name ||
    prd?.product?.name ||
    prd?.productname ||
    prd?.title ||
    prd?.productTitle ||
    prd?.groupcode?.name ||
    'Product';

  const price =
    prd?.price ??
    prd?.mrp ??
    prd?.minPrice ??
    prd?.sellingPrice ??
    prd?.product?.price ??
    0;

  const image =
    prd?.image ||
    prd?.img ||
    prd?.image1 ||
    prd?.image2 ||
    prd?.thumbnail ||
    prd?.images?.[0] ||
    prd?.mainImage ||
    '/assets/img/product/default-product-img.jpg';

  return {
    _id: id,
    id,
    productId: id,
    name,
    slug,
    image,
    price,
    qty: opts.qty ?? 1,
    product: prd,
    ...opts,
  };
};

/**
 * Pass `index` from the map in Shop page:
 * products.map((p, i) => <ProductItem key={...} product={p} index={i} />)
 */
const ProductItem = ({ product, index = 0 }) => {
  const router = useRouter();
  const rainbowId = useId();
  const dispatch = useDispatch();

  const { debounced: q } = useGlobalSearch();

  const [showActions, setShowActions] = useState(false);
  const [supportsHover, setSupportsHover] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [collectionMedia, setCollectionMedia] = useState(null);
  const [showCollectionMedia, setShowCollectionMedia] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupportsHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    }
  }, []);

  // Load collection media
  useEffect(() => {
    const loadCollectionMedia = async () => {
      try {
        const media = await getCollectionMediaForProduct(product);
        if (media.image || media.video) {
          setCollectionMedia(media);
          } else {/*  */
          }
      } catch (error) {/*  */
        }
    };

    if (product) {
      loadCollectionMedia();
    }
  }, [product]);

  const userId = useSelector(selectUserId);

  /* image helpers */
  const valueToUrlString = (v) => {
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    if (Array.isArray(v)) return valueToUrlString(v[0]);
    if (typeof v === 'object') return valueToUrlString(v.secure_url || v.url || v.path || v.key);
    return '';
  };
  const isHttpUrl = (s) => /^https?:\/\//i.test(s);

  const imageUrl = useMemo(() => {
    // First check for Cloudinary URLs (direct URLs)
    const cloudinaryFields = [
      product?.image1CloudUrlWeb,
      product?.image2CloudUrlWeb,
      product?.image3CloudUrlWeb,
      product?.imageCloudUrl,
      product?.cloudUrl,
    ];

    for (const field of cloudinaryFields) {
      if (field && typeof field === 'string' && field.trim() && field !== 'null' && field !== 'undefined' && field !== '') {
        const cleanUrl = field.trim().replace(/#$/, ''); // Remove trailing hash character
        if (cleanUrl.startsWith('http')) return cleanUrl;
      }
    }

    // Fallback to other image fields
    const raw =
      valueToUrlString(product?.img) ||
      valueToUrlString(product?.image1) ||
      valueToUrlString(product?.image2) ||
      valueToUrlString(product?.image3) ||
      valueToUrlString(product?.image) ||
      valueToUrlString(product?.images) ||
      valueToUrlString(product?.thumbnail);

    if (!raw) return '/assets/img/product/default-product-img.jpg';
    if (isHttpUrl(raw)) return raw;

    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
    const clean = (p) =>
      (p || '')
        .replace(/^\/+/, '')
        .replace(/^api\/uploads\/?/, '')
        .replace(/^uploads\/?/, '');
    return `${base}/uploads/${clean(raw)}`;
  }, [product]);

  /* title, slug, category */
  const productId = getAnyId(product);
  const seoDoc = null; // Removed SEO API call

  const titleHtml =
    pick(
      product?.productTitle,
      product?.name,
      product?.product?.name,
      product?.productname,
      product?.title,
      product?.productTitle,
      seoDoc?.title,
      product?.seoTitle,
      product?.groupcode?.name
    ) || '—';

  const titleText = stripHtml(titleHtml).trim() || 'Product';

  const slug =
    product?.slug ||
    product?.productslug ||
    product?.product?.slug ||
    product?.aiTempOutput ||
    product?.fabricCode ||
    seoDoc?.slug ||
    productId;

  // Clean the slug by removing trailing hash character
  const cleanSlug = slug ? String(slug).replace(/#$/, '') : slug;

  const categoryLabel =
    pick(product?.category?.name, product?.category, product?.product?.category?.name, product?.categoryName, seoDoc?.category) || '';

  /* options count */
  const groupcodeId = product?.groupcode?._id || product?.groupcode || null;
  const { data: groupItems = [], isFetching, isError } = useGetProductsByGroupcodeQuery(groupcodeId, { skip: !groupcodeId });
  const optionCount = Array.isArray(groupItems) ? groupItems.length : 0;
  const showOptionsBadge = !!groupcodeId && !isFetching && !isError && optionCount > 1;

  /* collection count */
  const collectionId = product?.collectionId || product?.collection?.id || product?.collection?._id || null;
  const { data: collectionData = {}, isFetching: collectionFetching, isError: collectionError } = useGetProductsByCollectionQuery(collectionId, { skip: !collectionId });
  
  // Handle both old and new response structures
  const collectionItems = Array.isArray(collectionData?.data) ? collectionData.data : Array.isArray(collectionData) ? collectionData : [];
  const collectionCount = collectionData?.total || collectionItems.length;
  const showCollectionBadge = !!collectionId && !collectionFetching && !collectionError && collectionCount > 1;

  /* values */
  const fabricTypeVal =
    toText(pick(product?.fabricType, product?.fabric_type, product?.category, seoDoc?.fabricType)) || 'Woven Fabrics';
  const contentVal = toText(pick(product?.content, product?.contentName, product?.content_label, seoDoc?.content));
  const gsm = Number(pick(product?.gsm, product?.weightGsm, product?.weight_gsm));
  const ozs = Number(pick(product?.ozs, product?.oz));
  const weightVal =
    isFinite(gsm) && gsm > 0
      ? `${round(gsm)} gsm / ${round(gsmToOz(gsm))} oz`
      : isFinite(ozs) && ozs > 0
      ? `${round(gsmToOz(ozs * 34))} gsm / ${round(ozs)} oz`
      : toText(product?.weight);

  const designVal = toText(pick(product?.design, product?.designName, seoDoc?.design));
  const colorsVal = toText(pick(product?.colors, product?.color, product?.colorName, seoDoc?.colors));
  const widthCm = Number(pick(product?.widthCm, product?.width_cm, product?.width, product?.cm));
  const widthInch = Number(pick(product?.widthInch, product?.width_inch, product?.inch));
  const widthVal =
    isFinite(widthCm) && widthCm > 0
      ? `${round(widthCm, 0)} cm / ${round(cmToInch(widthCm), 0)} inch`
      : isFinite(widthInch) && widthInch > 0
      ? `${round(widthInch * 2.54, 0)} cm / ${round(widthInch, 0)} inch`
      : toText(product?.widthLabel);

  const finishVal = toText(pick(product?.finish, product?.subfinish?.name, product?.finishName, seoDoc?.finish));
  const structureVal = toText(pick(product?.structure, product?.substructure?.name, product?.structureName, seoDoc?.structure));
  const motifVal = toText(pick(product?.motif, product?.motifName, seoDoc?.motif));
  const leadTimeVal = toText(pick(product?.leadTime, product?.lead_time, seoDoc?.leadTime));

  const details = uniq(
    [fabricTypeVal, contentVal, weightVal, designVal, colorsVal, widthVal, finishVal, structureVal, motifVal, leadTimeVal].filter(
      (v) => nonEmpty(v) && !isNoneish(v)
    )
  );

  // keep your limit (6) but make sure all visible on mobile (no cut)
  const limitedDetails = details.slice(0, 6);
  const mid = Math.ceil(limitedDetails.length / 2);
  const leftDetails = limitedDetails.slice(0, mid);
  const rightDetails = limitedDetails.slice(mid);

  const showCategory =
    categoryLabel && String(categoryLabel).trim().toLowerCase() !== String(fabricTypeVal).trim().toLowerCase();

  /* select from slices */
  const cartItems = useSelector((s) => s.cart?.cart_products || []);
  const wishlistItems = useSelector((s) => s.wishlist?.wishlist || []);

  const inCart = cartItems.some((it) => String(getAnyId(it)) === String(productId));
  const inWishlist = wishlistItems.some((it) => String(getAnyId(it)) === String(productId));

  /* above-the-fold: priority */
  const isAboveFold = index < 4;

  /* ADD TO CART */
  const handleAddProduct = async (prd, e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    
    // Prevent multiple clicks while processing
    if (addingCart) return;

    // Check if already in cart - use the real cart state
    if (inCart) {
      toast.info('Product already in cart', {
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

    setAddingCart(true);

    try {
      const baseItem = buildCartItem(prd, { qty: 1 });

      const mapped = typeof formatProductForCart === 'function' ? { ...baseItem, ...formatProductForCart(prd) } : baseItem;

      if (!userId) {
        router.push('/login');
        setAddingCart(false);
        return;
      }

      // Add to cart via API
      await dispatch(add_to_cart({ userId, productId: mapped.productId, quantity: mapped.qty })).unwrap();
      
      // Refresh cart data to ensure UI is in sync
      await dispatch(fetch_cart_products({ userId }));

      dispatch(openCartMini());
      setShowActions(true);
      
      toast.success('Added to cart', {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    } catch (err) {
      // Check if error is about duplicate item
      const errorMsg = err?.message || String(err);
      if (errorMsg.includes('already in cart')) {
        toast.info('Product already in cart', {
          position: 'top-center',
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'light',
        });
      } else {
        toast.error('Failed to add to cart', {
          position: 'top-center',
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'light',
        });
      }
    } finally {
      setAddingCart(false);
    }
  };

  const handleWishlistProduct = async (prd, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!userId) {
      router.push('/login');
      return;
    }

    // Check if already in wishlist
    if (inWishlist) {
      toast.info('Product already in wishlist', {
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

    // Priority logic: If product is in cart, don't add to wishlist
    if (inCart) {
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

    const formatted =
      typeof formatProductForWishlist === 'function'
        ? formatProductForWishlist(prd)
        : { product: prd, productId: getAnyId(prd) };

    try {
      await dispatch(toggleWishlistItem({ customerAccountId: userId, product: formatted })).unwrap();
    } catch (err) {
      toast.error('Failed to update wishlist', {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    }
  };

  const openQuickView = async (prd, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    let productWithGroupCode = { ...prd };

    // Fetch groupcode data if needed
    if (prd.groupcode && typeof prd.groupcode === 'object' && prd.groupcode._id && !prd.groupcode.img) {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

        const response = await fetch(`${API_BASE}/groupcode/`, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
        });

        if (response.ok) {
          const groupCodeResponse = await response.json();
          const groupCodes = groupCodeResponse.data || [];
          const fullGroupCode = groupCodes.find((gc) => gc._id === prd.groupcode._id);
          if (fullGroupCode) productWithGroupCode.groupcode = fullGroupCode;
        }
      } catch {
        /* ignore */
      }
    }

    // Fetch collection data if needed
    if (prd.collectionId && (!prd.collection || !prd.collection.collectionimage1CloudUrl)) {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

        const response = await fetch(`${API_BASE}/collection/${prd.collectionId}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
        });

        if (response.ok) {
          const collectionResponse = await response.json();
          if (collectionResponse.success && collectionResponse.data) {
            productWithGroupCode.collection = collectionResponse.data;
          }
        }
      } catch {
        /* ignore */
      }
    }

    // Ensure all product image fields are properly mapped
    const processedProduct = {
      ...productWithGroupCode,
      // Map Cloudinary URLs to standard fields, removing trailing hash
      img: (productWithGroupCode.image1CloudUrlWeb && typeof productWithGroupCode.image1CloudUrlWeb === 'string' 
        ? productWithGroupCode.image1CloudUrlWeb.replace(/#$/, '') 
        : productWithGroupCode.image1CloudUrlWeb) || productWithGroupCode.img || productWithGroupCode.image || '',
      image1: (productWithGroupCode.image1CloudUrlWeb && typeof productWithGroupCode.image1CloudUrlWeb === 'string' 
        ? productWithGroupCode.image1CloudUrlWeb.replace(/#$/, '') 
        : productWithGroupCode.image1CloudUrlWeb) || productWithGroupCode.image1 || '',
      image2: (productWithGroupCode.image2CloudUrlWeb && typeof productWithGroupCode.image2CloudUrlWeb === 'string' 
        ? productWithGroupCode.image2CloudUrlWeb.replace(/#$/, '') 
        : productWithGroupCode.image2CloudUrlWeb) || productWithGroupCode.image2 || '',
      image3: (productWithGroupCode.image3CloudUrlWeb && typeof productWithGroupCode.image3CloudUrlWeb === 'string' 
        ? productWithGroupCode.image3CloudUrlWeb.replace(/#$/, '') 
        : productWithGroupCode.image3CloudUrlWeb) || productWithGroupCode.image3 || '',
      video: productWithGroupCode.videoURL || productWithGroupCode.videourl || productWithGroupCode.video || '',
      videourl: productWithGroupCode.videoURL || productWithGroupCode.videourl || productWithGroupCode.video || '',
      videoThumbnail: productWithGroupCode.videoThumbnail || '',
      // Alt text fields
      altTextImage1: productWithGroupCode.altTextImage1 || '',
      altTextImage2: productWithGroupCode.altTextImage2 || '',
      altTextImage3: productWithGroupCode.altTextImage3 || '',
      altTextVideo: productWithGroupCode.altTextVideo || '',
    };

    console.log('🔍 Quick View - Processed Product Data:', {
      hasImage1: !!processedProduct.image1,
      hasImage2: !!processedProduct.image2,
      hasImage3: !!processedProduct.image3,
      hasVideo: !!processedProduct.video,
      hasCollection: !!processedProduct.collection,
      collectionImage: processedProduct.collection?.collectionimage1CloudUrl,
      collectionVideo: processedProduct.collection?.collectionvideoURL,
    });

    dispatch(handleProductModal(processedProduct));
  };

  /* global search visibility */
  const isVisible = useMemo(() => {
    const query = (q || '').trim();
    if (query.length < 2) return true;
    const fields = [
      () => titleText,
      () => slug || '',
      () => categoryLabel || '',
      () => details.join(' '),
      () => fabricTypeVal || '',
      () => designVal || '',
      () => colorsVal || '',
    ];
    const pred = buildSearchPredicate(query, fields, { mode: 'AND', normalize: true });
    return pred(product);
  }, [q, titleText, slug, categoryLabel, details, fabricTypeVal, designVal, colorsVal, product]);

  if (!isVisible) return null;

  return (
    <div className="product-col">
      <div
        className={`fashion-product-card ${showActions ? 'show-actions' : ''}`}
        onMouseEnter={() => supportsHover && setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={() => setShowActions(true)}
      >
        <div className="card-wrapper">
          <div className="product-image-container">
            <Link
              href={`/fabric/${cleanSlug}`}
              aria-label={`View ${titleText}`}
              className="image-link"
              onClick={(e) => {
                if (!supportsHover && !showActions) {
                  e.preventDefault();
                  setShowActions(true);
                }
              }}
            >
              <div className="image-wrapper">
                <Image
                  src={imageUrl}
                  alt={titleText}
                  title={titleText}
                  width={420}
                  height={420}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
                  className="img-main"
                  {...(isAboveFold ? { priority: true } : { loading: 'lazy' })}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/img/product/default-product-img.jpg';
                  }}
                />
                <div className="image-overlay" />
              </div>
            </Link>

            {showOptionsBadge && (
              <button
                type="button"
                className="options-ribbon"
                onClick={() => router.push(`/fabric/${cleanSlug}`)}
                aria-label={`${optionCount} options for ${titleText}`}
                title={`${optionCount} options`}
              >
                <span className="ribbon-inner">
                  <span className="ribbon-icon" aria-hidden="true">
                    <Image
                      src="/assets/img/product/icons/tshirt.svg"
                      alt="Options"
                      title="Options"
                      width={16}
                      height={16}
                      className="badge-icon"
                      loading="lazy"
                    />
                  </span>
                  <span className="ribbon-text">
                    <strong>{optionCount}</strong> Options
                  </span>
                </span>
              </button>
            )}

            {showCollectionBadge && (
              <button
                type="button"
                className="collection-ribbon"
                onClick={() => router.push(`/fabric/${cleanSlug}`)}
                aria-label={`${collectionCount} items in collection for ${titleText}`}
                title={`${collectionCount} items in collection`}
              >
                <span className="ribbon-inner collection-inner">
                  <span className="ribbon-icon" aria-hidden="true">
                    <Image
                      src="/assets/img/banner/layers.png"
                      alt="Collection Items"
                      title="Collection Items"
                      width={18}
                      height={18}
                      className="layers-icon"
                      loading="lazy"
                    />
                  </span>
                  <span className="ribbon-text">
                    <strong>{collectionCount}</strong> Options
                  </span>
                </span>
              </button>
            )}

            <div className="product-actions">
              <button
                type="button"
                onClick={(e) => handleAddProduct(product, e)}
                className={`action-button ${inCart ? 'active cart-active' : ''}`}
                aria-label={inCart ? 'In cart' : 'Add to cart'}
                aria-pressed={inCart}
                title={inCart ? 'Added to cart' : 'Add to cart'}
                disabled={addingCart}
              >
                {inCart ? <CartActive /> : <Cart />}
              </button>

              <button
                type="button"
                onClick={(e) => handleWishlistProduct(product, e)}
                className={`action-button ${inWishlist ? 'active wishlist-active' : ''}`}
                aria-label={inWishlist ? 'In wishlist' : 'Add to wishlist'}
                aria-pressed={inWishlist}
                title={inWishlist ? 'Added to wishlist' : 'Add to wishlist'}
              >
                {inWishlist ? <WishlistActive /> : <Wishlist />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e?.stopPropagation?.();
                  e?.preventDefault?.();
                  const url =
                    typeof window !== 'undefined' ? `${window.location.origin}/fabric/${cleanSlug}` : `/fabric/${cleanSlug}`;
                  const title = titleText;
                  const text = 'Check out this fabric on Amrita Global Enterprises';
                  (async () => {
                    try {
                      if (navigator?.share) await navigator.share({ title, text, url });
                      else if (navigator?.clipboard) {
                        await navigator.clipboard.writeText(url);
                        alert('Link copied!');
                      } else {
                        prompt('Copy link', url);
                      }
                    } catch {
                      /* ignore */
                    }
                  })();
                }}
                className="action-button"
                aria-label="Share product"
                title="Share"
              >
                <Share />
              </button>

              <button
                type="button"
                onClick={(e) => openQuickView(product, e)}
                className="action-button"
                aria-label="Quick view"
                title="Quick view"
              >
                <QuickView />
              </button>
            </div>
          </div>

          <div className="product-info">
            {showCategory ? <div className="product-category">{categoryLabel}</div> : null}

            <h3 className="product-title">
              <Link href={`/fabric/${cleanSlug}`} title={titleText}>
                <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
              </Link>
            </h3>

            {limitedDetails.length ? (
              <div className="spec-columns">
                <ul className="spec-col">
                  {leftDetails.map((v, i) => (
                    <li key={i} className="spec-row" title={v}>
                      <span className="spec-value">{v}</span>
                    </li>
                  ))}
                </ul>
                <ul className="spec-col">
                  {rightDetails.map((v, i) => (
                    <li key={i} className="spec-row" title={v}>
                      <span className="spec-value">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Collection Media Section */}
            {(() => {
              return null;
            })()}
            {collectionMedia && (collectionMedia.image || collectionMedia.video) && (
              <div className="collection-media-section">
                <div className="collection-media-header">
                  <h4 className="collection-media-title">
                    {collectionMedia.collectionName}
                  </h4>
                  <button
                    type="button"
                    className="collection-media-toggle"
                    onClick={() => setShowCollectionMedia(!showCollectionMedia)}
                    aria-label={showCollectionMedia ? 'Hide collection media' : 'Show collection media'}
                  >
                    {showCollectionMedia ? '−' : '+'}
                  </button>
                </div>
                
                {showCollectionMedia && (
                  <div className="collection-media-content">
                    {collectionMedia.image && (
                      <div className="collection-image">
                        <Image
                          src={collectionMedia.image}
                          alt={collectionMedia.altText || `${collectionMedia.collectionName} collection`}
                          width={300}
                          height={200}
                          className="collection-img"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {collectionMedia.video && (
                      <div className="collection-video">
                        <iframe
                          src={getYouTubeEmbedUrl(collectionMedia.video)}
                          title={collectionMedia.videoAltText || `${collectionMedia.collectionName} video`}
                          width="300"
                          height="169"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Mobile-first grid: 1 product per row on mobile, multiple on desktop */
        :global(.products-grid) {
          display: grid;
          grid-template-columns: 1fr; /* Mobile: 1 column */
          gap: 20px; /* Normal gap - original size */
          margin: 0;
          padding: 0;
          width: 100%;
        }
        @media (min-width: 640px) {
          :global(.products-grid) {
            grid-template-columns: repeat(2, 1fr); /* Small tablet: 2 columns */
            gap: 22px;
          }
        }
        @media (min-width: 768px) {
          :global(.products-grid) {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* Tablet: auto-fill */
            gap: 24px;
          }
        }
        @media (min-width: 1024px) {
          :global(.products-grid) {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* Desktop */
            gap: 28px;
          }
        }
        @media (min-width: 1200px) {
          :global(.products-grid) {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* Large desktop */
            gap: 32px;
          }
        }
        :global(.products-grid .product-col) {
          width: 100%;
          min-width: 0;
          height: 100%;
        }

        .fashion-product-card {
          --primary: var(--tp-theme-primary, #2c4c97);
          --secondary: var(--tp-theme-secondary, #d6a74b);
          --text-primary: var(--tp-text-1, #0f2235);
          --text-secondary: var(--tp-text-2, #475569);
          --bg-white: var(--tp-common-white, #ffffff);
          --bg-grey: var(--tp-grey-1, #f7f9fc);
          --border-color: var(--tp-grey-2, #e6ecf2);
          --success: var(--tp-theme-green, #1e824c);

          position: relative;
          width: 100%;
          height: 100%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .fashion-product-card:hover {
          transform: translateY(-6px);
        }

        .card-wrapper {
          background: var(--bg-white);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(44, 76, 151, 0.08);
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: all 0.4s ease;
          position: relative;
        }

        .fashion-product-card:hover .card-wrapper {
          border-color: var(--primary);
          box-shadow: 0 12px 32px rgba(44, 76, 151, 0.18);
        }

        /* Enhanced image container with gradient overlay */
        .product-image-container {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          display: flex;
          align-items: center;
          justify-content: center;

          height: 280px; /* mobile - original container size */
        }
        @media (min-width: 480px) {
          .product-image-container {
            height: 280px; /* larger mobile - same size */
          }
        }
        @media (min-width: 640px) {
          .product-image-container {
            height: 280px; /* small tablet */
          }
        }
        @media (min-width: 768px) {
          .product-image-container {
            height: 300px; /* tablet/desktop */
          }
        }
        @media (min-width: 1200px) {
          .product-image-container {
            height: 320px; /* large desktop */
          }
        }

        .image-link {
          display: block;
          width: 100%;
          height: 100%;
        }

        /* Enhanced image styling with MAXIMUM size images */
        .image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          padding: 0px; /* mobile - NO padding for MAXIMUM image size */
        }
        @media (min-width: 480px) {
          .image-wrapper {
            padding: 0px; /* larger mobile - no padding */
          }
        }
        @media (min-width: 768px) {
          .image-wrapper {
            padding: 4px; /* desktop - minimal padding */
          }
        }
        @media (min-width: 1200px) {
          .image-wrapper {
            padding: 6px; /* large desktop - minimal padding */
          }
        }

        :global(.img-main) {
          width: 100% !important;
          height: 100% !important;
          object-position: center;
          display: block;
          background: #fff;
          border-radius: 8px; /* Smaller border radius for bigger appearance */
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

          /* Use cover for maximum image fill */
          object-fit: cover !important;
        }

        .fashion-product-card:hover :global(.img-main) {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.04) 100%);
          z-index: 1;
          pointer-events: none;
          border-radius: 8px; /* Match image border radius */
        }

        .options-ribbon {
          position: absolute;
          left: 16px;
          bottom: 16px;
          border: 0;
          background: transparent;
          cursor: pointer;
          z-index: 3;
        }

        .collection-ribbon {
          position: absolute;
          left: 50%;
          bottom: 16px;
          transform: translateX(-50%);
          border: 0;
          background: transparent;
          cursor: pointer;
          z-index: 3;
          animation: subtle-bounce 2s ease-in-out infinite;
        }

        @keyframes subtle-bounce {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-2px);
          }
        }

        .collection-ribbon:hover {
          animation: none;
        }

        .ribbon-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 36px;
          padding: 0 16px;
          border-radius: 18px;
          background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
        }

        .ribbon-inner::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.6s ease;
        }

        .collection-inner {
          background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
        }

        .ribbon-inner:hover,
        .collection-inner:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.45);
        }

        .ribbon-inner:hover::before {
          left: 100%;
        }

        .collection-inner:hover {
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.45);
        }

        .ribbon-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .badge-icon {
          width: 100%;
          height: 100%;
          display: block;
          filter: brightness(0) invert(1);
        }

        .layers-icon {
          width: 20px;
          height: 20px;
          filter: brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
          opacity: 0.95;
          transition: all 0.3s ease;
        }

        .collection-inner:hover .layers-icon {
          transform: scale(1.1) rotate(5deg);
          opacity: 1;
        }

        .collection-icon {
          width: 16px;
          height: 16px;
          color: #fff;
        }

        .ribbon-text {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.4px;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          white-space: nowrap;
        }

        .ribbon-text strong {
          font-weight: 700;
          margin-right: 4px;
          font-size: 15px;
        }

        .product-actions {
          position: absolute;
          top: 14px;
          right: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3;
        }

        @media (max-width: 767px) {
          .product-actions {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (hover: hover) and (pointer: fine) {
          .fashion-product-card:hover .product-actions,
          .fashion-product-card:focus-within .product-actions {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .fashion-product-card.show-actions .product-actions {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fashion-product-card.show-actions .product-actions {
          opacity: 1;
          transform: translateY(0);
        }

        .action-button {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(44, 76, 151, 0.1);
          box-shadow: 0 4px 12px rgba(44, 76, 151, 0.12);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .action-button :global(svg) {
          width: 18px;
          height: 18px;
          color: var(--text-primary);
          transition: all 0.3s ease;
        }

        .action-button:hover {
          background: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 6px 16px rgba(44, 76, 151, 0.3);
          transform: scale(1.1);
        }

        .action-button:hover :global(svg) {
          color: #fff !important;
        }

        .action-button.cart-active {
          background: var(--success);
          border-color: var(--success);
        }

        .action-button.cart-active :global(svg) {
          color: #fff;
        }

        .action-button.wishlist-active {
          background: #ef4444;
          border-color: #ef4444;
        }

        .action-button.wishlist-active :global(svg) {
          color: #fff;
        }

        .action-button:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        .product-info {
          padding: 18px;
          border-top: 1px solid rgba(44, 76, 151, 0.08);
          background: var(--bg-white);
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          min-height: 170px;
        }

        .product-category {
          display: none;
        }

        .product-title {
          font-family: var(--tp-ff-jost, 'Poppins', sans-serif);
          font-size: 16px;
          font-weight: 600;
          line-height: 1.4;
          color: var(--text-primary);
          margin: 0 0 14px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.8em;
          flex-shrink: 0;
        }

        .product-title :global(a) {
          color: inherit;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .product-title :global(a:hover) {
          color: var(--primary);
        }

        /* Enhanced specifications display - always 2 columns even on mobile */
        .spec-columns {
          display: grid;
          grid-template-columns: 1fr 1fr; /* Always 2 columns on all screen sizes */
          gap: 0 14px;
          margin-top: auto;
          flex-grow: 1;
          max-height: none;
          overflow: visible;
        }

        .spec-col {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .spec-row {
          display: flex;
          align-items: flex-start;
          padding: 5px 0;
          border-bottom: 1px solid rgba(44, 76, 151, 0.06);
          min-height: 30px;
        }

        .spec-row:last-child {
          border-bottom: 0;
        }

        .spec-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          line-height: 1.4;
          position: relative;
          padding-left: 14px;
          display: block;
          overflow: visible;
          text-overflow: initial;
          white-space: normal;
          word-break: break-word;
        }

        .spec-value::before {
          content: '';
          position: absolute;
          left: 0;
          top: 9px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--secondary) 0%, #b8860b 100%);
          box-shadow: 0 1px 3px rgba(214, 167, 75, 0.3);
        }

        .price-wrapper {
          display: none;
        }

        /* Collection Media Styles */
        .collection-media-section {
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .collection-media-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .collection-media-title {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          line-height: 1.2;
        }

        .collection-media-toggle {
          width: 24px;
          height: 24px;
          border: 1px solid #ddd;
          background: white;
          color: #666;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.2s ease;
        }

        .collection-media-toggle:hover {
          background: #f8f9fa;
          border-color: #007bff;
          color: #007bff;
        }

        .collection-media-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .collection-image,
        .collection-video {
          width: 100%;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .collection-img {
          width: 100%;
          height: auto;
          display: block;
        }

        .collection-video iframe {
          width: 100%;
          height: auto;
          aspect-ratio: 16/9;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .collection-media-section {
            padding: 10px;
            margin-top: 10px;
          }

          .collection-media-title {
            font-size: 12px;
          }

          .collection-media-toggle {
            width: 20px;
            height: 20px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductItem;
