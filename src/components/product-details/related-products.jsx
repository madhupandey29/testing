/* eslint-disable no-unused-vars */
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import {
  useGetProductsByCollectionQuery,
  useGetTopRatedQuery,
} from '@/redux/features/newProductApi';
import { mapProductFields, getProductId, getCategoryName, getPrimaryImageUrl } from '@/utils/productFieldMapper';
import ErrorMsg from '../common/error-msg';
import { HomeNewArrivalPrdLoader } from '../loader';

/** Normalize relation -> product */
const normalizeRelationToProduct = (rel) => {
  if (!rel) return null;

  // Use the field mapper to handle both old and new API structures
  const mapped = mapProductFields(rel);
  if (!mapped) return null;

  // Handle nested product structure if it exists
  if (rel.product && typeof rel.product === 'object') {
    const productMapped = mapProductFields(rel.product);
    const merged = { ...mapped, ...productMapped };
    
    // Preserve important fields from the relation level
    merged.id = getProductId(rel.product) || getProductId(rel);
    merged.slug = rel.product.slug || rel.slug || mapped.slug;
    merged.category = getCategoryName(rel.product) || getCategoryName(rel);
    
    if (rel.salesPrice != null && merged.salesPrice == null) merged.salesPrice = rel.salesPrice;
    if (rel.price != null && merged.price == null) merged.price = rel.price;

    return merged;
  }

  return mapped;
};

const FALLBACK_IMG = '/assets/img/product/product-1.jpg'; // Use local fallback image

const isRemote = (url) => !!url && /^https?:\/\//i.test(url);
const isDataUrl = (url) => !!url && /^data:/i.test(url);

// Helper function to get contrasting text color
const getContrastColor = (hexColor) => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

const processImageUrl = (url) => {
  if (!url) return FALLBACK_IMG;
  if (isRemote(url) || isDataUrl(url)) return url;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = String(url).startsWith('/') ? String(url).slice(1) : String(url);

  const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
  return `${cleanBaseUrl}/uploads/${encodedPath}`;
};

const RelatedProducts = ({ collectionId }) => {
  const shouldSkip = !collectionId || String(collectionId).trim() === '';

    if (collectionId) {
    const isNokia = collectionId === '690a0e676132664ee';
    const isMajestica = collectionId === '695f9b0b956eb958b';
  }

  // 1) Try related-by-collection (if we have a collection)
  const {
    data: relData,
    isError: relError,
    isLoading: relLoading,
    isFetching: relFetching,
    isSuccess: relSuccess,
  } = useGetProductsByCollectionQuery(shouldSkip ? '' : collectionId, { skip: shouldSkip });

    if (relData && collectionId) {
    // Query result available
  }

  const relList = (relData?.data ?? relData ?? []).map(normalizeRelationToProduct).filter(Boolean);
  const relDone = !relLoading && !relFetching;
  const relEmpty = relDone && relSuccess && relList.length === 0;

  // 2) Decide if we should use Top Rated as a fallback
  const wantTopRated = shouldSkip || relError || relEmpty;

  // 3) Fetch Top Rated only when needed
  const {
    data: topData,
    isError: topError,
    isLoading: topLoading,
    isFetching: topFetching,
    isSuccess: topSuccess,
  } = useGetTopRatedQuery(undefined, { skip: !wantTopRated });

  const topList =
    (topData?.data ?? topData ?? []).map(normalizeRelationToProduct).filter(Boolean);

  // 4) Loading states
  if (!wantTopRated && (relLoading || relFetching)) return <HomeNewArrivalPrdLoader loading />;
  if (wantTopRated && (topLoading || topFetching)) return <HomeNewArrivalPrdLoader loading />;

  // 5) If falling back to Top Rated
  const renderGrid = (list, title = "Mix and Match") => (
    <div className="tp-related-products-section">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="tp-section-title-wrapper text-center mb-40">
              <h3 className="tp-section-title">{title}</h3>
            </div>
          </div>
        </div>
        <div className="tp-related-grid">
          <div className="row g-3 g-md-4">
            {list.map((p) => {
          const cleanSlug = p?.slug ? String(p.slug).replace(/#$/, '') : p?.slug;
          const href = cleanSlug ? `/fabric/${cleanSlug}` : '#';

          // Use the field mapper to get the primary image, with better fallback logic
          let imgSrc = processImageUrl(p?.primaryImage || getPrimaryImageUrl(p._original));
          
          // If still no image, create a color-based placeholder
          if (imgSrc === FALLBACK_IMG && p?.hex && p.hex.length > 0) {
            // Create a simple colored square as placeholder using the product's hex color
            const hexColor = p.hex[0] || '#cccccc';
            imgSrc = `data:image/svg+xml;base64,${btoa(`
              <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="${hexColor}"/>
                <text x="100" y="100" text-anchor="middle" dy=".3em" fill="${getContrastColor(hexColor)}" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
                  ${(p?.color && p.color[0]) || 'Color'}
                </text>
              </svg>
            `)}`;
          }

          return (
            <div key={p.id || p._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
              <Link href={href} target="_blank" rel="noopener noreferrer" className="card-mini">
                <div className="thumb">
                  {/* ✅ FIX: use width+height (no fill) so SEO tools won’t show “HTML - x -” */}
                  <Image
                    src={imgSrc}
                    alt={p?.name || 'Product'}
                    width={200}
                    height={200}
                    sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 200px"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span className="thumb-gloss" />
                </div>
                <div className="meta">
                  <h4 className="title" title={p?.name}>
                    {p?.name || 'Untitled Product'}
                  </h4>
                  {/* Show color info */}
                  {p?.color && p.color.length > 0 && (
                    <p className="color-info">
                      {p.color.join(', ')}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
        </div>
      </div>
    </div>

      <style jsx>{`
        .tp-related-products-section {
          padding: 60px 0;
          background: #f8f9fa;
        }
        
        .tp-section-title-wrapper {
          margin-bottom: 40px;
        }
        
        .tp-section-title {
          font-size: 32px;
          font-weight: 700;
          color: #0b1620;
          margin: 0;
          position: relative;
        }
        
        .tp-section-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: #0989ff;
          border-radius: 2px;
        }

        .card-mini {
          --radius: 14px;
          --shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
          --shadow-hover: 0 8px 20px rgba(0, 0, 0, 0.14);

          display: flex;
          flex-direction: column;
          height: 100%;
          border-radius: var(--radius);
          background: #fff;
          text-decoration: none;
          color: inherit;
          border: 1px solid #ececec;
          box-shadow: var(--shadow);
          transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
          overflow: hidden;
        }
        .card-mini:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-hover);
          border-color: #e2e2e2;
        }

        .thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background: #f6f7f9;
        }
        .thumb :global(img) {
          transform: scale(1);
          transition: transform 220ms ease;
        }
        .card-mini:hover .thumb :global(img) {
          transform: scale(1.04);
        }

        .thumb-gloss {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.22) 0%,
            rgba(255, 255, 255, 0.0) 28%,
            rgba(0, 0, 0, 0.03) 100%
          );
          pointer-events: none;
        }

        .meta {
          padding: 10px 12px;
          border-top: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 54px;
        }
        .title {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.25;
          letter-spacing: 0.2px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .color-info {
          margin: 0;
          font-size: 12px;
          color: #666;
          font-weight: 500;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tp-related-grid :global(.row) {
          margin-left: 0;
          margin-right: 0;
        }
        
        @media (max-width: 768px) {
          .tp-section-title {
            font-size: 24px;
          }
          
          .tp-related-products-section {
            padding: 40px 0;
          }
        }
      `}</style>
    </div>
  );

  if (wantTopRated) {
    if (topError) return <ErrorMsg msg="Couldn’t load products right now." />;
    if (!topSuccess || topList.length === 0) return <ErrorMsg msg="No Products found!" />;
    return renderGrid(topList, "Mix and Match");
  }

  if (!relSuccess || relList.length === 0) return <ErrorMsg msg="No Products found!" />;
  return renderGrid(relList, "Mix and Match");
};

export default RelatedProducts;
