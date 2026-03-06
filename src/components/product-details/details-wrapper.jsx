/* ----------------------------------------------------------------------
   components/product-details/details-wrapper.jsx
---------------------------------------------------------------------- */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaStar, FaStarHalfAlt, FaFileAlt, FaCommentDots, FaHeart, FaDownload } from 'react-icons/fa';
import { AiOutlineStar, AiOutlineHeart } from 'react-icons/ai';
import Link from 'next/link';

import { useGetDesignByIdQuery } from '@/redux/features/designApi';
import { useGetMotifSizeByIdQuery } from '@/redux/features/motifSizeApi';

import { add_to_wishlist } from '@/redux/features/wishlist-slice';

/* ---------------- small helpers ---------------- */
const nonEmpty = (v) =>
  v !== undefined && v !== null && (typeof v === 'number' || String(v).trim() !== '');

const pick = (...xs) => xs.find(nonEmpty);

const asNumber = (value) => {
  if (value === undefined || value === null) return undefined;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

const isObjId = (s) => typeof s === 'string' && /^[a-f\d]{24}$/i.test(s);

/* ---------------- API helpers ---------------- */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER || 'x-api-key';

const fetchJson = async (url) => {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) headers[API_KEY_HEADER] = API_KEY;

  const res = await fetch(url, { headers, credentials: 'include' });
  if (!res.ok) return null;

  try {
    return await res.json();
  } catch {
    return null;
  }
};

/* ----- Stars (only stars; no rating number text) ----- */
const Stars = ({ value }) => {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  const iconStyle = { marginRight: 4, color: '#f59e0b' };

  return (
    <span aria-label={`Rating ${v} out of 5`} className="stars-only">
      {Array.from({ length: full }).map((_, i) => (
        <FaStar key={`f${i}`} style={iconStyle} />
      ))}
      {half === 1 && <FaStarHalfAlt style={iconStyle} />}
      {Array.from({ length: empty }).map((_, i) => (
        <AiOutlineStar key={`e${i}`} style={iconStyle} />
      ))}
    </span>
  );
};

/* ---------------- Specific resolvers ---------------- */
const useDesignName = (design, designId) => {
  const direct = useMemo(() => {
    if (typeof design === 'object') return design?.name;
    if (typeof design === 'string' && !isObjId(design)) return design;
    return undefined;
  }, [design]);

  const id = useMemo(() => {
    if (typeof design === 'object') return design?._id;
    if (typeof design === 'string' && isObjId(design)) return design;
    if (typeof designId === 'string' && isObjId(designId)) return designId;
    return undefined;
  }, [design, designId]);

  const { data: dQ } = useGetDesignByIdQuery(id, { skip: !id });
  const fromRtk = dQ?.data?.name;

  return pick(direct, fromRtk);
};

const useMotifName = (motif, motifId) => {
  const direct = useMemo(() => {
    if (typeof motif === 'object') return motif?.name || motif?.size;
    if (typeof motif === 'string' && !isObjId(motif)) return motif;
    return undefined;
  }, [motif]);

  const id = useMemo(() => {
    if (typeof motif === 'object') return motif?._id;
    if (typeof motif === 'string' && isObjId(motif)) return motif;
    if (typeof motifId === 'string' && isObjId(motifId)) return motifId;
    return undefined;
  }, [motif, motifId]);

  const { data: mQ } = useGetMotifSizeByIdQuery(id, { skip: !id });
  const fromRtk = mQ?.data?.name || mQ?.data?.size;

  return pick(direct, fromRtk);
};

const useColorNames = (colors) => {
  const arr = useMemo(() => {
    if (!colors) return [];
    if (Array.isArray(colors)) return colors;
    if (typeof colors === 'string') return colors.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }, [colors]);

  const givenNames = useMemo(
    () =>
      arr
        .map((x) => (typeof x === 'string' ? (!isObjId(x) ? x : null) : x?.name))
        .filter(Boolean),
    [arr]
  );

  return givenNames;
};

/* ---------------- Main component ---------------- */
const DetailsWrapper = ({ productItem = {} }) => {
  const params = useSearchParams();
  const q = (params?.get('searchText') || '').trim();
  const query = q.toLowerCase();

  const highlight = (text) => {
    const s = String(text || '');
    if (!query) return s;
    try {
      const re = new RegExp(`(${q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'ig');
      return s.replace(re, '<mark style="background:#fff3bf">$1</mark>');
    } catch {
      return s;
    }
  };

  const {
    id,
    _id,

    name,
    title,
    productTitle,

    category,
    newCategoryId,

    description,
    shortProductDescription,
    shortDescription,

    slug,
    productslug,

    leadtime,
    status,
    supplyModel,

    structure,
    content,
    finish,

    design,
    designId,

    motif,
    motifId,

    color,
    colors,

    gsm,
    oz,
    cm,
    inch,
    width,

    // fields from API
    uM,
    salesMOQ,
    fabricCode,
    vendorFabricCode,
  } = productItem;

  const productId = pick(_id, id);
  const slugValue = pick(slug, productslug);
  
  const titleValue = productTitle || title || name;

  /* Fetch full product (slug) for reliable fields */
  const [productFull, setProductFull] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!API_BASE || !slugValue) {
        if (live) setProductFull(null);
        return;
      }
      const json = await fetchJson(`${API_BASE}/product/fieldname/productslug/${slugValue}`);
      const data = json?.data || null;
      if (live) setProductFull(data);
    })();
    return () => {
      live = false;
    };
  }, [slugValue]);

  const supplyModelDisplay = pick(
    supplyModel,
    productFull?.supplyModel,
    Array.isArray(leadtime) && leadtime.length > 0 ? leadtime[0] : null,
    status,
    'In Stock'
  );

  // Clean up supply model display - remove dashes and format properly
  const cleanSupplyModelDisplay = useMemo(() => {
    if (!supplyModelDisplay) return 'In Stock';
    
    const cleaned = String(supplyModelDisplay)
      .replace(/-/g, ' ') // Replace all dashes with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing spaces
    
    // Ensure proper capitalization - first letter uppercase, rest lowercase except for proper nouns
    const words = cleaned.split(' ');
    const capitalizedWords = words.map((word, index) => {
      if (index === 0) {
        // First word should always be capitalized
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      } else {
        // Other words should be lowercase unless they're specific terms
        const lowerWord = word.toLowerCase();
        // Keep certain words capitalized if needed
        if (['stock', 'order', 'out', 'of', 'in'].includes(lowerWord)) {
          return lowerWord;
        }
        return lowerWord;
      }
    });
    
    return capitalizedWords.join(' ');
  }, [supplyModelDisplay]);

  const shortDescHtml = pick(
    shortProductDescription,
    productFull?.shortProductDescription,
    shortDescription
  );

  const seoDoc = null;

  const ratingValue = pick(productItem?.ratingValue, productFull?.ratingValue, seoDoc?.rating_value);
  const ratingCount = pick(productItem?.ratingCount, productFull?.ratingCount, seoDoc?.rating_count);

  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const isInWishlist = wishlist?.some((prd) => pick(prd?._id, prd?.id) === productId);
  
  const toggleWishlist = () => {
    // Check if already in wishlist
    if (isInWishlist) {
      // Show notification that it's already in wishlist
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
    
    dispatch(add_to_wishlist(productItem));
  };

  // Download Catalogue Handler with PDF generation
  const handleRequestSample = async () => {
    try {
      // Show loading state
      const button = document.querySelector('.action-btn.primary');
      const originalText = button?.querySelector('.btn-text')?.textContent;
      if (button) {
        button.disabled = true;
        const btnText = button.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Generating PDF...';
      }

      // Dynamic import to avoid SSR issues
      const { downloadProductPdf } = await import('@/utils/productPdf');
      
      // Get current page URL for QR code
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      
      // Update button text to show progress
      if (button) {
        const btnText = button.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Loading images...';
      }
      
      // Generate PDF with product data
      const result = await downloadProductPdf(productItem, {
        productUrl: currentUrl,
        onProgress: (message) => {
          // Always show simple "Generating PDF..." message
          if (button) {
            const btnText = button.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Generating PDF...';
          }
        },
        // You can add more options here if needed
        // companyName: 'Custom Company Name',
        // phone1: 'Custom Phone',
        // etc.
      });

      // Show success message
      if (result?.success) {
        // Temporarily show success message
        if (button) {
          const btnText = button.querySelector('.btn-text');
          if (btnText) {
            btnText.textContent = 'PDF Downloaded!';
            setTimeout(() => {
              btnText.textContent = 'Catalogue';
            }, 2000);
          }
        }
      }

      } catch (error) {
      console.error('PDF generation error:', error);
      
      // Show more specific error messages
      let errorMessage = 'Error generating PDF. ';
      
      if (error.message?.includes('timeout')) {
        errorMessage += 'The request timed out. Please check your internet connection and try again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage += 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('image')) {
        errorMessage += 'Some images could not be loaded, but the PDF should still be generated. Please try again.';
      } else {
        errorMessage += 'Please try again. If the problem persists, contact support.';
      }
      
      alert(errorMessage);
    } finally {
      // Reset button state
      const button = document.querySelector('.action-btn.primary');
      if (button) {
        button.disabled = false;
        const btnText = button.querySelector('.btn-text');
        if (btnText && btnText.textContent !== 'PDF Downloaded!') {
          btnText.textContent = 'Catalogue';
        }
      }
    }
  };

  /* Computed displays */
  const weightParts = [];
  if (nonEmpty(gsm)) weightParts.push(`${gsm} gsm`);
  if (nonEmpty(oz)) weightParts.push(`${Number(oz).toFixed(1)} oz`);
  const weightDisplay = weightParts.join(' / ') || 'N/A';

  const cmNum = asNumber(cm ?? width);
  const inchNum = asNumber(inch);
  const widthDisplay =
    [cmNum != null ? `${cmNum} cm` : undefined, inchNum != null ? `${Math.round(inchNum)} inch` : undefined]
      .filter(Boolean)
      .join(' / ') || 'N/A';

  const designName = useDesignName(design, designId);
  const motifName = useMotifName(motif || productItem?.motifsize, motifId);
  const colorNames = useColorNames(Array.isArray(color) ? color : Array.isArray(colors) ? colors : []);

  const fabricCodeDisplay = pick(
    fabricCode,
    productItem?.fabricCode,
    productItem?.fabriccode,
    productFull?.fabricCode,
    productFull?.fabriccode,
    vendorFabricCode,
    productItem?.vendorFabricCode,
    productFull?.vendorFabricCode
  );

  const unitDisplay = pick(uM, productFull?.uM, productItem?.unit, productItem?.unitOfMeasure);

  const moqNum = asNumber(pick(salesMOQ, productFull?.salesMOQ, productItem?.moq, productItem?.minOrderQty));
  const moqDisplay = moqNum != null ? `${moqNum}${unitDisplay ? ` ${unitDisplay}` : ''}` : 'N/A';

  const categoryBadge = useMemo(() => {
    const c = pick(category?.name, newCategoryId?.name, category);
    return nonEmpty(c) ? String(c) : 'N/A';
  }, [category, newCategoryId, category]);

  // ✅ Finish display: compact tags/chips format with cleaned values
  const finishDisplay = useMemo(() => {
    const raw = pick(finish, productFull?.finish);
    if (!raw) return null;
    
    // Split by common separators and clean up
    let finishArray = [];
    if (Array.isArray(raw)) {
      finishArray = raw.filter(Boolean);
    } else {
      const str = String(raw);
      // Split by bullet, comma, semicolon, or " - "
      finishArray = str
        .split(/[•,;]|\s-\s/)
        .map(s => s.trim())
        .filter(Boolean);
    }
    
    // Clean up finish values by removing "Chemical -" and "Mechanical -" prefixes
    const cleanedFinishArray = finishArray.map(finish => {
      let cleaned = finish.trim();
      
      // Remove "Chemical - " prefix (case insensitive)
      cleaned = cleaned.replace(/^Chemical\s*-\s*/i, '');
      
      // Remove "Mechanical - " prefix (case insensitive)  
      cleaned = cleaned.replace(/^Mechanical\s*-\s*/i, '');
      
      return cleaned;
    }).filter(Boolean); // Remove any empty strings after cleaning
    
    return cleanedFinishArray;
  }, [finish, productFull?.finish]);

  return (
    <div className="product-details-modern-wrapper">
      {/* Header */}
      <div className="product-header">
        <div className="product-category">
          <span className="category-badge">{categoryBadge}</span>
          <span className="stock-badge">{cleanSupplyModelDisplay}</span>
          {nonEmpty(fabricCodeDisplay) && fabricCodeDisplay !== 'N/A' && (
            <span className="fabric-code-badge">{fabricCodeDisplay}</span>
          )}
          <span className="rating-badge">
            <Stars value={ratingValue} />
          </span>
        </div>

        <h1 className="product-title" dangerouslySetInnerHTML={{ __html: highlight(titleValue) }} />

        {nonEmpty(shortDescHtml) ? (
          <div className="product-description" dangerouslySetInnerHTML={{ __html: shortDescHtml }} />
        ) : (
          <p className="product-description" dangerouslySetInnerHTML={{ __html: highlight(description) }} />
        )}
      </div>

      {/* Specs */}
      <div className="quick-facts-section">
        <div className="facts-grid">
          <div className="fact-item">
            <span className="fact-label">Content</span>
            <span className="fact-value">{Array.isArray(content) ? content.join(', ') : content || 'N/A'}</span>
          </div>

          <div className="fact-item">
            <span className="fact-label">Width</span>
            <span className="fact-value">{widthDisplay}</span>
          </div>

          <div className="fact-item">
            <span className="fact-label">Weight</span>
            <span className="fact-value">{weightDisplay}</span>
          </div>

          <div className="fact-item">
            <span className="fact-label">Design</span>
            <span className="fact-value">{design || designName || 'N/A'}</span>
          </div>

          <div className="fact-item">
            <span className="fact-label">Structure</span>
            <span className="fact-value">{structure || 'N/A'}</span>
          </div>

          <div className="fact-item">
            <span className="fact-label">Colors</span>
            <span className="fact-value">{colorNames?.length ? colorNames.join(', ') : 'N/A'}</span>
          </div>

          <div className="fact-item">
            <span className="fact-label">Motif</span>
            <span className="fact-value">{motif || motifName || 'N/A'}</span>
          </div>

          <div className="fact-item">
            <span className="fact-label">Sales MOQ</span>
            <span className="fact-value">{moqDisplay}</span>
          </div>

          <div className="fact-item fact-item-finish">
            <span className="fact-label">Finish</span>
            <span className="fact-value">
              {finishDisplay && finishDisplay.length > 0 ? finishDisplay.join(', ') : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="action-section">
        <div className="action-buttons">
          <button 
            className="action-btn primary" 
            type="button"
            onClick={handleRequestSample}
          >
            <FaDownload />
            <span className="btn-text">Catalogue</span>
          </button>

          <Link href="/contact" style={{ flex: 1, textDecoration: 'none' }}>
            <button className="action-btn secondary" type="button" style={{ width: '100%' }}>
              <FaCommentDots />
              <span className="btn-text">Request Quote</span>
            </button>
          </Link>

          <button
            type="button"
            onClick={toggleWishlist}
            className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
            aria-label="Add to Wishlist"
          >
            {isInWishlist ? <FaHeart /> : <AiOutlineHeart />}
          </button>
        </div>
      </div>

      <style jsx>{`
        .product-details-modern-wrapper {
          padding: 0;
          height: fit-content;
        }

        .product-header {
          margin-bottom: 18px;
        }

        .product-category {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .category-badge {
          display: inline-block;
          padding: 6px 14px;
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          border-radius: 999px;
          font-family: var(--tp-ff-jost);
          letter-spacing: 0.3px;
        }

        .stock-badge {
          display: inline-block;
          padding: 6px 14px;
          background: var(--tp-theme-green);
          color: var(--tp-common-white);
          font-size: 11px;
          font-weight: 700;
          text-transform: none;
          border-radius: 999px;
          font-family: var(--tp-ff-jost);
        }
        
        .fabric-code-badge {
          display: inline-block;
          padding: 6px 14px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: var(--tp-common-white);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          border-radius: 999px;
          font-family: var(--tp-ff-jost);
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
        
        .rating-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1.5px solid #f59e0b;
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
        }
        
        .rating-badge .stars-only {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        .rating-badge .stars-only i {
          font-size: 12px !important;
          margin-right: 0 !important;
        }

        .product-title {
          font-family: var(--tp-ff-jost);
          font-size: 28px;
          font-weight: 800;
          color: var(--tp-text-1);
          margin: 0 0 10px 0;
          line-height: 1.2;
          letter-spacing: -0.2px;
        }

        .product-description {
          font-family: var(--tp-ff-roboto);
          font-size: 15px;
          line-height: 1.6;
          color: var(--tp-text-2);
          margin: 0;
        }

        /* ✅ Specs table - Enhanced responsive design */
        .quick-facts-section {
          --spec-accent: #2C4C97;
          --spec-mint: rgba(44, 76, 151, 0.08);
          --spec-border: rgba(20, 46, 46, 0.12);
          --spec-text-dim: rgba(20, 46, 46, 0.72);

          background: var(--tp-common-white);
          border-radius: 15px;
          margin-top: 18px;
          border: 1px solid var(--spec-border);
          overflow: hidden;
          border-top: 3px solid var(--spec-accent);
          box-shadow: 0 10px 24px rgba(16, 24, 40, 0.06);
        }

        .facts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }

        /* ✅ RESPONSIVE FIX: Better proportions with flexible columns */
        .fact-item {
          display: grid;
          grid-template-columns: minmax(90px, 1fr) minmax(0, 2fr);
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--spec-border);
          align-items: start;
          min-height: 60px;
        }

        .fact-item:nth-child(odd) {
          border-right: 1px solid var(--spec-border);
        }

        .fact-item:nth-child(4n + 1),
        .fact-item:nth-child(4n + 2) {
          background: var(--spec-mint);
        }

        .fact-item:last-child,
        .fact-item:nth-last-child(2) {
          border-bottom: none;
        }

        .fact-label {
          font-family: var(--tp-ff-jost);
          font-size: 13px;
          font-weight: 900;
          color: var(--spec-accent);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1.3;
          padding-top: 2px;
          word-wrap: break-word;
        }

        /* ✅ RESPONSIVE FIX: Better text wrapping and flexible alignment */
        .fact-value {
          font-family: var(--tp-ff-roboto);
          font-size: 14px;
          font-weight: 600;
          color: var(--tp-text-1);
          text-align: right;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          min-width: 0;
        }

        /* ✅ Finish: full width with better mobile handling */
        .fact-item-finish {
          grid-column: 1 / -1;
          grid-template-columns: minmax(90px, 1fr) minmax(0, 3fr);
        }
        
        .fact-item-finish .fact-value {
          text-align: left;
        }

        .rating-inline {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          width: 100%;
          min-width: 0;
        }

        .rating-count {
          font-size: 12px;
          color: var(--spec-text-dim);
          font-weight: 800;
          white-space: nowrap;
        }

        /* ✅ Buttons: slightly smaller, still beautiful */
        .action-section {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(44, 76, 151, 0.1);
        }

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 13px 20px;
          border: none;
          border-radius: 14px;
          font-family: var(--tp-ff-jost);
          font-size: 12.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          min-height: 50px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .action-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .action-btn:hover::before {
          opacity: 1;
        }

        .action-btn i {
          font-size: 16px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .action-btn:hover i {
          transform: scale(1.15) rotate(5deg);
        }

        /* Primary Button - Deep Blue (Theme Primary) */
        .action-btn.primary {
          background: linear-gradient(135deg, #2C4C97 0%, #1e3a7a 100%);
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(44, 76, 151, 0.35);
        }
        
        .action-btn.primary:hover {
          background: linear-gradient(135deg, #3558b0 0%, #2442a0 100%);
          box-shadow: 0 10px 28px rgba(44, 76, 151, 0.45);
          transform: translateY(-2px);
        }

        /* Secondary Button - Yellow/Gold (Theme Secondary) */
        .action-btn.secondary {
          background: linear-gradient(135deg, #d6854b99 0%, #b8903f 100%);
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(214, 167, 75, 0.35);
        }
        
        .action-btn.secondary:hover {
          background: linear-gradient(135deg, #e0b55f 0%, #c89535 100%);
          box-shadow: 0 10px 28px rgba(214, 167, 75, 0.45);
          transform: translateY(-2px);
        }

        .action-btn:active {
          transform: translateY(-1px);
        }
        
        .action-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
        }
        
        .action-btn:disabled:hover {
          transform: none !important;
          box-shadow: 0 6px 20px rgba(44, 76, 151, 0.35);
        }
        
        .action-btn:disabled::before {
          opacity: 0;
        }
        
        .btn-text {
          font-weight: 800;
        }

        /* ✅ Wishlist: slightly smaller */
        .wishlist-btn {
          width: 50px;
          min-width: 50px;
          height: 50px;
          background: #ffffff;
          border: 2px solid rgba(16, 24, 40, 0.15);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: rgba(16, 24, 40, 0.45);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(16, 24, 40, 0.08);
          position: relative;
          overflow: hidden;
        }
        
        .wishlist-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(44, 76, 151, 0.08);
          transform: translate(-50%, -50%);
          transition: width 0.5s ease, height 0.5s ease;
        }
        
        .wishlist-btn:hover::before {
          width: 120%;
          height: 120%;
        }
        
        .wishlist-btn i {
          position: relative;
          z-index: 1;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .wishlist-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 24, 40, 0.15);
          border-color: rgba(44, 76, 151, 0.35);
          color: rgba(44, 76, 151, 0.85);
        }
        
        .wishlist-btn:hover i {
          transform: scale(1.15);
        }

        .wishlist-btn.active {
          background: linear-gradient(135deg, #ff5a7a 0%, #e11d48 100%);
          border-color: rgba(225, 29, 72, 0.4);
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(225, 29, 72, 0.35);
        }
        
        .wishlist-btn.active::before {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .wishlist-btn.active:hover {
          background: linear-gradient(135deg, #ff6b8a 0%, #e92d58 100%);
          box-shadow: 0 10px 28px rgba(225, 29, 72, 0.45);
        }

        @media (max-width: 768px) {
          .product-details-modern-wrapper {
            padding: 0 0 15px 0;
          }

          .product-title {
            font-size: clamp(18px, 5vw, 24px);
            line-height: 1.3;
            margin-bottom: 8px;
          }
          
          .product-category {
            gap: 6px;
            margin-bottom: 10px;
          }
          
          .category-badge,
          .stock-badge,
          .fabric-code-badge {
            font-size: 10px;
            padding: 4px 10px;
          }
          
          .rating-badge {
            padding: 3px 8px;
          }
          
          .rating-badge .stars-only i {
            font-size: 10px !important;
          }

          .product-description {
            font-size: 14px;
            line-height: 1.5;
          }

          .quick-facts-section {
            margin-top: 15px;
          }

          .facts-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .fact-item {
            border-right: none !important;
            grid-template-columns: minmax(80px, 1fr) minmax(0, 2fr);
            padding: 14px 15px;
            gap: 10px;
            min-height: 50px;
          }
          
          .fact-item-finish {
            grid-template-columns: minmax(80px, 1fr) minmax(0, 2fr);
          }
          
          .fact-item-finish .fact-value {
            text-align: left;
          }

          .fact-label {
            font-size: 11px;
            padding-top: 1px;
            letter-spacing: 0.3px;
          }

          .fact-value {
            font-size: 13px;
            text-align: left;
            line-height: 1.3;
          }

          .fact-item:nth-child(even) {
            background: rgba(44, 76, 151, 0.04);
          }
          .fact-item:nth-child(odd) {
            background: var(--tp-common-white);
          }

          .action-section {
            margin-top: 15px;
          }

          .action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 8px;
            align-items: stretch;
          }

          .action-btn {
            min-height: 44px;
            padding: 10px 12px;
            font-size: 11px;
            border-radius: 10px;
            gap: 6px;
          }
          
          .action-btn i {
            font-size: 13px;
          }

          .wishlist-btn {
            width: 44px;
            min-width: 44px;
            height: 44px;
            border-radius: 10px;
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .product-details-modern-wrapper {
            padding: 0 0 12px 0;
          }

          .product-title {
            font-size: clamp(16px, 4.5vw, 20px);
            margin-bottom: 6px;
          }

          .product-category {
            gap: 5px;
            margin-bottom: 8px;
          }

          .category-badge,
          .stock-badge,
          .fabric-code-badge {
            font-size: 9px;
            padding: 3px 8px;
          }

          .product-description {
            font-size: 13px;
          }

          .quick-facts-section {
            margin-top: 12px;
          }

          .fact-item {
            grid-template-columns: minmax(70px, 1fr) minmax(0, 2fr);
            padding: 12px 12px;
            gap: 8px;
            min-height: 48px;
          }

          .fact-item-finish {
            grid-template-columns: minmax(70px, 1fr) minmax(0, 2fr);
          }
          
          .fact-item-finish .fact-value {
            text-align: left;
          }

          .fact-label {
            font-size: 10px;
            letter-spacing: 0.2px;
          }

          .fact-value {
            font-size: 12px;
          }

          .action-section {
            margin-top: 12px;
          }

          .action-buttons {
            grid-template-columns: 1fr 1fr auto;
            gap: 6px;
          }

          .action-btn {
            min-height: 40px;
            padding: 8px 6px;
            font-size: 10px;
            border-radius: 8px;
            gap: 4px;
          }

          .action-btn i {
            font-size: 12px;
          }

          .wishlist-btn {
            width: 40px;
            min-width: 40px;
            height: 40px;
            border-radius: 8px;
            font-size: 14px;
          }
        }

        /* Ultra small screens - Enhanced responsive handling */
        @media (max-width: 360px) {
          .fact-item {
            grid-template-columns: minmax(60px, 1fr) minmax(0, 2fr);
            padding: 10px 10px;
            gap: 6px;
            min-height: 44px;
          }

          .fact-item-finish {
            grid-template-columns: minmax(60px, 1fr) minmax(0, 2fr);
          }
          
          .fact-item-finish .fact-value {
            text-align: left;
          }

          .fact-label {
            font-size: 9px;
            letter-spacing: 0.1px;
          }

          .fact-value {
            font-size: 11px;
            line-height: 1.2;
          }

          .action-btn {
            min-height: 38px;
            padding: 6px 4px;
            font-size: 9px;
          }

          .wishlist-btn {
            width: 38px;
            min-width: 38px;
            height: 38px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default DetailsWrapper;
