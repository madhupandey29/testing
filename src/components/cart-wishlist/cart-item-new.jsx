'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { selectUserId } from '@/utils/userSelectors';

/* ----------------------------- Helper Functions ---------------------------- */
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

const valueToUrlString = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return valueToUrlString(v[0]);
  if (typeof v === 'object')
    return valueToUrlString(v.secure_url || v.url || v.path || v.key || v.img || v.image);
  return '';
};

const isHttpUrl = (s) => /^https?:\/\//i.test(s || '');
const clean = (p) =>
  String(p || '')
    .replace(/^\/+/, '')
    .replace(/^api\/uploads\/?/, '')
    .replace(/^uploads\/?/, '');

/* ----------------------------- Currency Symbols ---------------------------- */
const CURRENCY_SYMBOLS = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
  CNY: '¥',
};

/* ----------------------------- Cart Item Component ---------------------------- */
const CartItemNew = ({ product, onRefresh, availableCurrencies = ['USD', 'EUR'] }) => {
  const userId = useSelector(selectUserId);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';

  // Local state
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(product?.orderQuantity || product?.qty || 1);
  const [localCurrency, setLocalCurrency] = useState(product?.priceCurrency || 'USD');

  // Extract product data
  const { productId, _id, id, slug, img, image, title, salesPrice, price, orderQuantity } = product || {};
  const nested = typeof productId === 'object' && productId ? productId : null;
  const PID = (nested && nested._id) || (typeof productId === 'string' ? productId : null) || _id || id || '';
  const cartItemId = product?.cartItemId || product?.__originalCartItem?.id || product?.id;

  console.log('🛒 Cart Item Debug:', {
    cartItemId,
    productId: PID,
    userId,
    product: {
      cartItemId: product?.cartItemId,
      __originalCartItem: product?.__originalCartItem,
      id: product?.id,
      _id: product?._id,
    }
  });

  // Product name
  const name = useMemo(() => {
    const firstNice = [
      nested?.name,
      title,
      product?.product?.name,
      product?.productName,
      product?.productTitle,
      product?.productname,
      product?.groupcode?.name,
      product?.fabricType,
      product?.content,
      product?.design,
    ]
      .filter(Boolean)
      .map(toLabel)
      .find(Boolean);
    if (firstNice) return firstNice;

    const parts = [
      toLabel(product?.color || product?.colorName || nested?.color),
      toLabel(product?.content || nested?.content),
      toLabel(product?.fabricType || nested?.fabricType),
      toLabel(product?.design || nested?.design),
    ].filter(Boolean);
    return parts.length ? parts.join(' ') + ' Fabric' : 'Product';
  }, [product, nested, title]);

  // Product slug and URL
  const safeSlug = nested?.slug || slug || product?.fabricCode || PID || '';
  const cleanSlug = safeSlug ? String(safeSlug).replace(/#$/, '') : safeSlug;
  const href = `/fabric/${cleanSlug}`;

  // Product image
  const fallbackCdn = (process.env.NEXT_PUBLIC_CDN_BASE || 'https://test.amrita-fashions.com/shopy').replace(/\/+$/, '');
  const rawImg =
    valueToUrlString(product?.img) ||
    valueToUrlString(product?.image) ||
    valueToUrlString(product?.image1) ||
    valueToUrlString(product?.image1CloudUrl) ||
    valueToUrlString(product?.image2) ||
    valueToUrlString(product?.product?.img) ||
    valueToUrlString(product?.product?.image) ||
    valueToUrlString(product?.product?.image1) ||
    valueToUrlString(product?.product?.image1CloudUrl) ||
    valueToUrlString(nested?.img || nested?.image || nested?.image1 || nested?.image1CloudUrl) ||
    valueToUrlString(img) ||
    valueToUrlString(image) ||
    '';
  const imageUrl = rawImg
    ? isHttpUrl(rawImg)
      ? rawImg
      : `${API_BASE || fallbackCdn}/uploads/${clean(rawImg)}`
    : '/assets/img/product/default-product-img.jpg';

  // Product metadata
  const src = product || product?.product || nested || {};
  const gsm = Number(src.gsm ?? product?.gsm ?? product?.weightGsm ?? product?.weight_gsm);
  const widthCm = Number(
    src.cm ?? src.widthCm ?? src.width_cm ?? src.width ?? product?.widthCm ?? product?.width_cm ?? product?.width
  );
  
  // Get unit of measurement from product
  const unitOfMeasurement = src.uM || product?.uM || nested?.uM || 'Kg';

  const fabricTypeVal = toLabel(pick(src.category?.name, src.category, src.fabricType, src.fabric_type)) || 'Woven Fabrics';
  const contentVal = toLabel(pick(src.content));
  const designVal = toLabel(pick(src.design));
  const finishVal = toLabel(pick(src.subfinish, src.finish));
  const structureVal = toLabel(pick(src.substructure, src.structure));
  const colorsVal = Array.isArray(src.color)
    ? toLabel(src.color.map((c) => c?.name ?? c))
    : toLabel(pick(src.colorName, src.color));

  const weightVal =
    isFinite(gsm) && gsm > 0 ? `${round(gsm)} gsm / ${round(gsmToOz(gsm), 1)} oz` : toLabel(src.weight);
  const widthVal =
    isFinite(widthCm) && widthCm > 0
      ? `${round(widthCm, 0)} cm / ${round(cmToInch(widthCm), 0)} inch`
      : toLabel(src.widthLabel);

  const row1Parts = [fabricTypeVal, colorsVal, contentVal, finishVal, structureVal, designVal].filter(
    (v) => nonEmpty(v) && !isNoneish(v)
  );
  const row2Parts = [weightVal, widthVal].filter((v) => nonEmpty(v) && !isNoneish(v));

  // Pricing
  console.log('💰 Cart Item Pricing Debug:', {
    productId: PID,
    salesPrice,
    price,
    'product.price': product?.price,
    'product.salesPrice': product?.salesPrice,
    'product.priceConverted': product?.priceConverted,
    'nested.price': nested?.price,
    '__originalCartItem': product?.__originalCartItem,
  });
  
  // Try multiple sources for price
  const rawPrice = 
    product?.price || 
    product?.salesPrice || 
    nested?.price || 
    nested?.salesPrice ||
    product?.__originalCartItem?.product?.price ||
    salesPrice || 
    price || 
    0;
  
  const unit = typeof rawPrice === 'number' ? rawPrice : Number.parseFloat(String(rawPrice)) || 0;
  const displayPrice = product?.priceConverted || unit;
  const currencySymbol = CURRENCY_SYMBOLS[localCurrency] || localCurrency;
  const lineTotal = displayPrice * localQuantity;

  /* ----------------------------- API Actions ---------------------------- */
  
  // Update quantity
  const updateQuantity = useCallback(
    async (newQty) => {
      if (!cartItemId || !userId || isUpdating) return;
      
      console.log('🔄 Updating quantity:', { cartItemId, newQty, localCurrency, userId });
      
      // Optimistically update UI first
      setLocalQuantity(newQty);
      setIsUpdating(true);
      
      try {
        // Get the actual price from the product
        const actualPrice = rawPrice || displayPrice || 0;
        
        // Use PUT instead of PATCH - backend uses PUT /:base/:entity/:id
        const url = `${API_BASE}/wishlist/${encodeURIComponent(cartItemId)}`;
        const payload = { 
          qty: newQty, 
          priceCurrency: localCurrency,
          price: actualPrice.toString() // Include price in the update
        };
        
        console.log('🔄 PUT request:', { url, payload });
        
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        console.log('🔄 Response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('🔄 Error response:', errorText);
          throw new Error(`Failed to update quantity: ${res.status} ${errorText}`);
        }

        const result = await res.json();
        console.log('🔄 Update success:', result);

        toast.success('Quantity updated', { position: 'top-center', autoClose: 2000 });
        onRefresh?.();
      } catch (error) {
        console.error('🔄 Update quantity error:', error);
        toast.error('Failed to update quantity', { position: 'top-center', autoClose: 3000 });
        // Revert to previous quantity on error
        setLocalQuantity(orderQuantity || 1);
      } finally {
        setIsUpdating(false);
      }
    },
    [cartItemId, userId, localCurrency, isUpdating, API_BASE, onRefresh, orderQuantity, rawPrice, displayPrice]
  );

  // Update currency
  const updateCurrency = useCallback(
    async (newCurrency) => {
      if (!cartItemId || !userId || isUpdating) return;
      
      console.log('💱 Updating currency:', { cartItemId, newCurrency, userId });
      
      // Optimistically update UI first
      setLocalCurrency(newCurrency);
      setIsUpdating(true);
      
      try {
        // Get the actual price from the product
        const actualPrice = rawPrice || displayPrice || 0;
        
        // Use PUT instead of PATCH - backend uses PUT /:base/:entity/:id
        const url = `${API_BASE}/wishlist/${encodeURIComponent(cartItemId)}`;
        const payload = { 
          priceCurrency: newCurrency,
          price: actualPrice.toString() // Include price in the update
        };
        
        console.log('💱 PUT request:', { url, payload });
        
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        console.log('💱 Response status:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('💱 Error response:', errorText);
          throw new Error(`Failed to update currency: ${res.status} ${errorText}`);
        }

        const result = await res.json();
        console.log('💱 Update success:', result);

        toast.success('Currency updated', { position: 'top-center', autoClose: 2000 });
        onRefresh?.();
      } catch (error) {
        console.error('💱 Update currency error:', error);
        toast.error('Failed to update currency', { position: 'top-center', autoClose: 3000 });
        // Revert to previous currency on error
        setLocalCurrency(product?.priceCurrency || 'USD');
      } finally {
        setIsUpdating(false);
      }
    },
    [cartItemId, userId, isUpdating, API_BASE, onRefresh, product?.priceCurrency, rawPrice, displayPrice]
  );

  // Remove from cart
  const removeFromCart = useCallback(async () => {
    if (!cartItemId || !userId || isRemoving) return;
    setIsRemoving(true);
    try {
      const res = await fetch(`${API_BASE}/wishlist/${encodeURIComponent(cartItemId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customerAccountId: userId, productId: PID }),
      });

      if (!res.ok) throw new Error('Failed to remove item');

      toast.success('Removed from cart', { position: 'top-center', autoClose: 2000 });
      onRefresh?.();
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove item', { position: 'top-center', autoClose: 3000 });
    } finally {
      setIsRemoving(false);
    }
  }, [cartItemId, userId, PID, isRemoving, API_BASE, onRefresh]);

  // Move to wishlist
  const moveToWishlist = useCallback(async () => {
    if (!cartItemId || !userId || isSaving) return;
    setIsSaving(true);
    try {
      // First, add to wishlist using POST /api/wishlist
      const addRes = await fetch(`${API_BASE}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          customerAccountId: userId,
          productId: PID
        }),
      });

      if (!addRes.ok) {
        const errorText = await addRes.text();
        console.error('Add to wishlist error:', errorText);
        throw new Error('Failed to add to wishlist');
      }

      // Then remove from cart
      const removeRes = await fetch(`${API_BASE}/wishlist/${encodeURIComponent(cartItemId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customerAccountId: userId, productId: PID }),
      });

      if (!removeRes.ok) {
        console.error('Remove from cart error');
        // Don't throw - item was added to wishlist successfully
      }

      toast.success('Moved to wishlist', { position: 'top-center', autoClose: 2000 });
      onRefresh?.();
    } catch (error) {
      console.error('Move to wishlist error:', error);
      toast.error('Failed to move to wishlist', { position: 'top-center', autoClose: 3000 });
    } finally {
      setIsSaving(false);
    }
  }, [cartItemId, userId, PID, isSaving, API_BASE, onRefresh]);

  /* ----------------------------- Event Handlers ---------------------------- */
  
  const handleIncrement = () => {
    if (isUpdating) return;
    const newQty = localQuantity + 1;
    updateQuantity(newQty);
  };

  const handleDecrement = () => {
    if (isUpdating || localQuantity <= 1) return;
    const newQty = Math.max(1, localQuantity - 1);
    updateQuantity(newQty);
  };

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    if (newCurrency !== localCurrency) {
      updateCurrency(newCurrency);
    }
  };

  // Rating display
  const ratingCount = src.ratingCount || 0;
  const ratingValue = src.ratingValue || 0;

  return (
    <>
      <div className="cart-item-card">
        {/* Product Image */}
        <div className="cart-item-image">
          <Link href={href} target="_blank" rel="noopener noreferrer">
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 140px"
              className="product-image"
              unoptimized
            />
          </Link>
        </div>

        {/* Product Info */}
        <div className="cart-item-info">
          {/* Product Name */}
          <Link href={href} target="_blank" rel="noopener noreferrer" className="product-name">
            {name}
          </Link>

          {/* Price with Currency Dropdown */}
          <div className="price-row">
            <select
              value={localCurrency}
              onChange={handleCurrencyChange}
              disabled={isUpdating}
              className="currency-dropdown"
              aria-label="Select currency"
            >
              {availableCurrencies.map((curr) => (
                <option key={curr} value={curr}>
                  {CURRENCY_SYMBOLS[curr] || curr} {curr}
                </option>
              ))}
            </select>
            <span className="product-price">
              {currencySymbol}{displayPrice.toFixed(2)}/{unitOfMeasurement}
            </span>
          </div>

          {/* Product Details - All in same style */}
          <div className="product-details-row">
            {row1Parts.length > 0 && row1Parts.slice(0, 3).map((txt, i) => (
              <span key={`tag-${i}`} className="detail-tag">
                {txt}
              </span>
            ))}
            {row2Parts.length > 0 && row2Parts.slice(0, 2).map((txt, i) => (
              <span key={`spec-${i}`} className="detail-tag">
                {txt}
              </span>
            ))}
          </div>

          {/* Actions as text links */}
          <div className="cart-item-actions">
            <span
              onClick={moveToWishlist}
              className={`action-link ${isSaving || isRemoving ? 'disabled' : ''}`}
              role="button"
              tabIndex={isSaving || isRemoving ? -1 : 0}
            >
              {isSaving ? 'Moving...' : 'Move to Wishlist'}
            </span>
            <span
              onClick={removeFromCart}
              className={`action-link ${isRemoving || isSaving ? 'disabled' : ''}`}
              role="button"
              tabIndex={isRemoving || isSaving ? -1 : 0}
            >
              {isRemoving ? 'Removing...' : 'Delete'}
            </span>
          </div>
        </div>

        {/* Quantity Control */}
        <div className="cart-item-quantity">
          <div className="qty-label">Ordered qty:</div>
          <div className="qty-controls">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={isUpdating || localQuantity <= 1}
              className="qty-btn"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="qty-value">{localQuantity}{unitOfMeasurement}</span>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={isUpdating}
              className="qty-btn"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <div className="line-total">
            {currencySymbol}{lineTotal.toFixed(2)}
          </div>
        </div>
      </div>

      <style jsx>{`
        .cart-item-card {
          display: flex;
          gap: 20px;
          padding: 20px;
          border-bottom: 1px solid #e8e8e8;
          background: white;
          transition: all 0.2s ease;
          align-items: flex-start;
          position: relative;
        }

        .cart-item-card:hover {
          background-color: #fafafa;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .cart-item-card:last-child {
          border-bottom: none;
        }

        .cart-item-image {
          position: relative;
          flex-shrink: 0;
          width: 140px;
          height: 140px;
          border-radius: 12px;
          overflow: hidden;
          background: #f8f8f8;
          border: 1px solid #e8e8e8;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .cart-item-image a {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
        }

        .product-image {
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .cart-item-image:hover .product-image {
          transform: scale(1.05);
        }

        .cart-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .product-name {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          text-decoration: none;
          line-height: 1.4;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-name:hover {
          color: #2c4c97;
        }

        .price-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }

        .currency-dropdown {
          padding: 6px 10px;
          border: 1px solid #d8d8d8;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .currency-dropdown:hover:not(:disabled) {
          border-color: #2c4c97;
          box-shadow: 0 2px 6px rgba(44, 76, 151, 0.15);
        }

        .currency-dropdown:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .product-price {
          font-size: 17px;
          font-weight: 700;
          color: #2c4c97;
        }

        .product-details-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 6px 0;
        }

        .detail-tag {
          font-size: 12px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #f5f7fa 0%, #eef1f5 100%);
          border: 1px solid #dde2e8;
          border-radius: 6px;
          color: #4a5568;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .detail-tag:hover {
          background: linear-gradient(135deg, #e8ecf2 0%, #dde2e8 100%);
          transform: translateY(-1px);
        }

        .cart-item-actions {
          display: flex;
          gap: 20px;
          margin-top: 8px;
        }

        .action-link {
          font-size: 14px;
          font-weight: 600;
          color: #2c4c97;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          user-select: none;
          position: relative;
          padding-bottom: 2px;
        }

        .action-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #2c4c97;
          transition: width 0.2s ease;
        }

        .action-link:hover:not(.disabled)::after {
          width: 100%;
        }

        .action-link:hover:not(.disabled) {
          color: #1e3a7a;
        }

        .action-link.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cart-item-quantity {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          min-width: 160px;
        }

        .qty-label {
          font-size: 12px;
          color: #666;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .qty-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 2px solid #e8e8e8;
          border-radius: 8px;
          padding: 6px 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .qty-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f8f8;
          border: 1px solid #d8d8d8;
          border-radius: 6px;
          font-size: 18px;
          font-weight: 700;
          color: #333;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .qty-btn:hover:not(:disabled) {
          background: #2c4c97;
          color: white;
          border-color: #2c4c97;
          transform: scale(1.05);
        }

        .qty-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .qty-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .qty-value {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          min-width: 60px;
          text-align: center;
        }

        .line-total {
          font-size: 20px;
          font-weight: 800;
          color: #1a1a1a;
          margin-top: 4px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
          border-radius: 8px;
          border: 1px solid #d0e0ff;
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .cart-item-card {
            gap: 16px;
            padding: 18px;
          }

          .cart-item-image {
            width: 120px;
            height: 120px;
          }

          .cart-item-quantity {
            min-width: 140px;
          }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .cart-item-card {
            flex-direction: column;
            gap: 10px;
            padding: 12px;
            align-items: stretch;
          }

          .cart-item-image {
            position: relative;
            width: 100%;
            height: auto;
            padding-bottom: 60%;
            border-radius: 10px;
          }

          .cart-item-image a {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .product-image {
            object-fit: cover;
          }

          .cart-item-info {
            gap: 8px;
          }

          .product-name {
            font-size: 16px;
            text-align: left;
          }

          .price-row {
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 8px;
          }

          .currency-dropdown {
            padding: 5px 8px;
            font-size: 12px;
          }

          .product-price {
            font-size: 15px;
          }

          .product-details-row {
            justify-content: flex-start;
            gap: 6px;
          }

          .detail-tag {
            font-size: 11px;
            padding: 4px 8px;
          }

          .cart-item-actions {
            justify-content: flex-start;
            gap: 14px;
          }

          .action-link {
            font-size: 13px;
          }

          .cart-item-quantity {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            min-width: auto;
            padding: 10px;
            background: #f8f8f8;
            border-radius: 8px;
            border: 1px solid #e8e8e8;
            margin-top: 4px;
          }

          .qty-label {
            display: block;
            font-size: 10px;
          }

          .qty-controls {
            gap: 6px;
            padding: 3px;
          }

          .qty-btn {
            width: 28px;
            height: 28px;
            font-size: 16px;
          }

          .qty-value {
            font-size: 13px;
            min-width: 45px;
          }

          .line-total {
            margin-top: 0;
            font-size: 16px;
            padding: 6px 10px;
          }
        }

        /* Small Mobile */
        @media (max-width: 480px) {
          .cart-item-card {
            padding: 10px;
            gap: 8px;
          }

          .cart-item-image {
            padding-bottom: 56%;
            border-radius: 8px;
          }

          .product-name {
            font-size: 15px;
          }

          .product-price {
            font-size: 14px;
          }

          .detail-tag {
            font-size: 10px;
            padding: 3px 7px;
          }

          .cart-item-actions {
            gap: 12px;
          }

          .action-link {
            font-size: 12px;
          }

          .cart-item-quantity {
            padding: 8px;
            gap: 8px;
          }

          .qty-controls {
            gap: 5px;
            padding: 2px;
          }

          .qty-btn {
            width: 26px;
            height: 26px;
            font-size: 15px;
          }

          .qty-value {
            font-size: 12px;
            min-width: 40px;
          }

          .line-total {
            font-size: 15px;
            padding: 5px 8px;
          }
        }
      `}</style>
    </>
  );
};

export default CartItemNew;
