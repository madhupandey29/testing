// PDF Generation Utility for Product Details
// @ts-expect-error - QRCode module doesn't have TypeScript definitions
import QRCode from "qrcode";

// Environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// Configuration constants
const IMAGE_LOAD_TIMEOUT = 15000; // 15 seconds
const BATCH_SIZE = 3; // Load images in smaller batches
const BATCH_DELAY = 200; // Delay between batches in ms

/* ------------------------------ Helper Functions ------------------------------ */
function cleanStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function joinArr(val, sep = ", ") {
  if (Array.isArray(val)) return val.map(cleanStr).filter(Boolean).join(sep);
  return cleanStr(val);
}

function isNum(v) {
  const n = Number(v);
  return Number.isFinite(n);
}

function fmtNum(v, decimals = 2) {
  if (!isNum(v)) return "";
  const n = Number(v);
  const r = Math.round(n);
  if (Math.abs(n - r) < 1e-6) return String(r);
  return n.toFixed(decimals).replace(/\.?0+$/, "");
}

function toUpperLabel(s) {
  const t = cleanStr(s);
  return t ? t.toUpperCase() : "";
}

function pdfWrap(doc, text, maxW) {
  const t = cleanStr(text);
  if (!t) return [];
  return doc.splitTextToSize(t, maxW);
}

function hyphenToSpace(v) {
  return cleanStr(v).replace(/-/g, " ").replace(/\s{2,}/g, " ").trim();
}

function finishLabel(v) {
  const t = cleanStr(v);
  if (!t) return "";
  if (t.includes("=")) return cleanStr(t.split("=").pop());
  if (t.includes("-")) return cleanStr(t.split("-").pop());
  return t;
}

function joinFinish(val, sep = ", ") {
  if (Array.isArray(val)) return val.map(finishLabel).filter(Boolean).join(sep);
  return finishLabel(val);
}

/* ---- fit text to single line (prevents wrap/merge) ---- */
function fitOneLine(doc, text, maxW) {
  const t0 = cleanStr(text);
  if (!t0) return "";
  if (doc.getTextWidth(t0) <= maxW) return t0;
  const ell = "...";
  const ellW = doc.getTextWidth(ell);
  if (ellW >= maxW) return "";
  let lo = 0;
  let hi = t0.length;
  let best = "";
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const s = t0.slice(0, mid).trimEnd();
    const w = doc.getTextWidth(s) + ellW;
    if (w <= maxW) {
      best = s;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return (best || "").trimEnd() + ell;
}

/* ------------------------------ Image Helpers ------------------------------ */
function getPrimaryImage(p) {
  const candidates = [
    p?.image1CloudUrl,
    p?.image1ThumbUrl,
    p?.image2CloudUrl,
    p?.image2ThumbUrl,
    p?.image3CloudUrl,
    p?.image3ThumbUrl,
    p?.img,
    p?.image1,
    p?.image2,
    p?.image3,
  ].map(cleanStr).filter(Boolean);
  return candidates[0] || "";
}

/* ✅ NEW: prefer thumbs for grid cards (faster) */
function getCardImage(p) {
  const candidates = [
    p?.image1ThumbUrl,
    p?.image1CloudUrl,
    p?.image2ThumbUrl,
    p?.image2CloudUrl,
    p?.image3ThumbUrl,
    p?.image3CloudUrl,
  ].map(cleanStr).filter(Boolean);
  return candidates[0] || "";
}

// Enhanced image loading with multiple fallback strategies
async function loadImageWithFallbacks(product, isCard = false) {
  const imageUrl = isCard ? getCardImage(product) : getPrimaryImage(product);
  
  if (!imageUrl) {
    return { dataUrl: null, size: null };
  }
  
  try {
    // Try to load the image
    const dataUrl = await toDataUrl(imageUrl);
    if (dataUrl) {
      const size = await getDataUrlSize(dataUrl);
      return { dataUrl, size };
    }
  } catch (error) {
    // Silent fallback - no console warnings
  }
  
  // If primary image fails, try other candidates
  const allCandidates = isCard ? [
    product?.image2ThumbUrl,
    product?.image3ThumbUrl,
    product?.image1CloudUrl,
    product?.image2CloudUrl,
    product?.image3CloudUrl,
    product?.img,
    product?.image1,
    product?.image2,
    product?.image3,
  ] : [
    product?.image2CloudUrl,
    product?.image3CloudUrl,
    product?.image1ThumbUrl,
    product?.image2ThumbUrl,
    product?.image3ThumbUrl,
    product?.img,
    product?.image2,
    product?.image3,
  ];
  
  for (const fallbackUrl of allCandidates.map(cleanStr).filter(Boolean)) {
    try {
      const dataUrl = await toDataUrl(fallbackUrl);
      if (dataUrl) {
        const size = await getDataUrlSize(dataUrl);
        return { dataUrl, size };
      }
    } catch (error) {
      continue; // Silent fallback
    }
  }
  
  return { dataUrl: null, size: null };
}

async function toDataUrl(url) {
  const u = cleanStr(url);
  if (!u) return null;
  
  try {
    // First try: Direct fetch with CORS
    const res = await fetch(u, { 
      mode: "cors",
      headers: {
        'Accept': 'image/*',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(IMAGE_LOAD_TIMEOUT) // Configurable timeout
    });
    
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    
    const blob = await res.blob();
    
    // Verify it's actually an image
    if (!blob.type.startsWith('image/')) {
      throw new Error('Response is not an image');
    }
    
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Fallback: Try using Next.js Image API proxy
    try {
      const encodedUrl = encodeURIComponent(u);
      const proxyUrl = `/api/image-proxy?url=${encodedUrl}`;
      
      const res = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(IMAGE_LOAD_TIMEOUT)
      });
      
      if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
      
      const blob = await res.blob();
      
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (proxyError) {
      // Final fallback: Try loading via Image element (for same-origin images)
      try {
        return await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.naturalWidth || img.width;
              canvas.height = img.naturalHeight || img.height;
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            } catch (canvasError) {
              reject(canvasError);
            }
          };
          
          img.onerror = () => reject(new Error('Image load failed'));
          
          // Set timeout for image loading
          setTimeout(() => reject(new Error('Image load timeout')), IMAGE_LOAD_TIMEOUT - 2000);
          
          img.src = u;
        });
      } catch (imageError) {
        return null;
      }
    }
  }
}

async function getDataUrlSize(dataUrl) {
  const src = cleanStr(dataUrl);
  if (!src.startsWith("data:image/")) return null;
  return await new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        w: img.naturalWidth || img.width || 0,
        h: img.naturalHeight || img.height || 0,
      });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fitIntoBox(srcW, srcH, boxW, boxH) {
  if (!srcW || !srcH) return { w: boxW, h: boxH, scale: 1 };
  const s = Math.min(boxW / srcW, boxH / srcH);
  return { w: srcW * s, h: srcH * s, scale: s };
}

/* ✅ NEW: draw image "contain" inside box (no stretch) */
function fitContain(srcW, srcH, boxW, boxH) {
  if (!srcW || !srcH) return { w: boxW, h: boxH, dx: 0, dy: 0 };
  const s = Math.min(boxW / srcW, boxH / srcH);
  const w = srcW * s;
  const h = srcH * s;
  return { w, h, dx: (boxW - w) / 2, dy: (boxH - h) / 2 };
}

/* ------------------------------ Drawing Helpers ------------------------------ */
function fillR(doc, x, y, w, h, rgb, r = 0) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  if (r > 0) doc.roundedRect(x, y, w, h, r, r, "F");
  else doc.rect(x, y, w, h, "F");
}

function strokeR(doc, x, y, w, h, rgb, r = 0, lw = 0.2) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(lw);
  if (r > 0) doc.roundedRect(x, y, w, h, r, r, "S");
  else doc.rect(x, y, w, h, "S");
}

function pill(doc, x, y, text, { bg, fg, padX = 4.2, h = 7.2, r = 3.6, fontSize = 7.2, bold = true } = {}) {
  const t = cleanStr(text);
  if (!t) return { w: 0 };
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  const w = doc.getTextWidth(t) + padX * 2;
  fillR(doc, x, y, w, h, bg, r);
  doc.setTextColor(fg[0], fg[1], fg[2]);
  doc.text(t, x + padX, y + h * 0.68);
  return { w };
}

/* ------------------------------ QR Helper ------------------------------ */
async function makeQrDataUrl(data) {
  const d = cleanStr(data);
  if (!d) return null;
  try {
    return await QRCode.toDataURL(d, {
      errorCorrectionLevel: "M",
      margin: 0,
      width: 420,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    });
  } catch {
    return null;
  }
}

/* ------------------------------ Stars (proper star shapes) ------------------------------ */
function normalizeRatingTo5(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  if (n <= 5) return Math.max(0, Math.min(5, n));
  if (n <= 10) return Math.max(0, Math.min(5, n / 2));
  if (n <= 100) return Math.max(0, Math.min(5, (n * 5) / 100));
  return 5;
}

function buildStarPoints(cx, cy, size) {
  const outer = size / 2;
  const inner = outer * 0.38;
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const oa = Math.PI / 2 + (i * 2 * Math.PI) / 5;
    pts.push({ x: cx + outer * Math.cos(oa), y: cy - outer * Math.sin(oa) });
    const ia = oa + Math.PI / 5;
    pts.push({ x: cx + inner * Math.cos(ia), y: cy - inner * Math.sin(ia) });
  }
  return { pts, outer };
}

function starPath(doc, pts) {
  doc.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i].x, pts[i].y);
  doc.close();
}

function fillStar(doc, pts, rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  starPath(doc, pts);
  doc.fill();
}

function drawStarNoStroke(doc, cx, cy, size, fillPercent, goldColor, emptyColor) {
  const { pts, outer } = buildStarPoints(cx, cy, size);
  const fill = Math.max(0, Math.min(1, Number(fillPercent) || 0));
  fillStar(doc, pts, emptyColor);
  if (fill <= 0) return;
  if (fill >= 1) {
    fillStar(doc, pts, goldColor);
    return;
  }
  try {
    doc.saveGraphicsState();
    starPath(doc, pts);
    doc.clip();
    if (doc.discardPath) doc.discardPath();
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    const left = cx - outer;
    const top = cy - outer;
    doc.rect(left, top, outer * 2 * fill, outer * 2, "F");
    doc.restoreGraphicsState();
  } catch {
    if (fill >= 0.5) fillStar(doc, pts, goldColor);
  }
}

function drawStars(doc, x, yCenter, ratingValue, opts = {}) {
  const r = normalizeRatingTo5(ratingValue);
  if (r === null) return;
  const size = Number(opts.size ?? 3.0);
  const gap = Number(opts.gap ?? 0.5);
  const goldColor = [245, 158, 11];
  const emptyColor = [203, 213, 225];
  let cx = x + size / 2;
  for (let i = 1; i <= 5; i++) {
    const starStart = i - 1;
    const starEnd = i;
    let fillPercent = 0;
    if (r >= starEnd) fillPercent = 1;
    else if (r > starStart) fillPercent = r - starStart;
    drawStarNoStroke(doc, cx, yCenter, size, fillPercent, goldColor, emptyColor);
    cx += size + gap;
  }
}

/* ------------------------------ API Helpers ------------------------------ */
async function fetchCompanyInformation() {
  try {
    const url = `${API_BASE_URL}/companyinformation`;
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    
    const res = await fetch(url, { headers, mode: "cors" });
    if (!res.ok) return null;
    
    const response = await res.json();
    // Fix: API returns 'data' array, not 'list' array
    const list = Array.isArray(response?.data) ? response.data : [];
    
    // Get the AGE company (Amrita Global Enterprises) with highest version
    const ageCompanies = list.filter(item => 
      !item?.deleted && 
      (item?.name === 'AGE' || item?.legalName?.includes('Amrita'))
    );
    
    if (ageCompanies.length > 0) {
      // Sort by version number and get the latest
      const sorted = ageCompanies.sort((a, b) => Number(b?.versionNumber || 0) - Number(a?.versionNumber || 0));
      return sorted[0];
    }
    
    // Fallback: get the most recent non-deleted company
    const sorted = list
      .filter(item => !item?.deleted)
      .sort((a, b) => Number(b?.versionNumber || 0) - Number(a?.versionNumber || 0));
    
    return sorted[0] || null;
  } catch (error) {
    return null;
  }
}

async function fetchCollectionProductsCount(collectionId) {
  if (!collectionId) return 0;
  
  try {
    const url = `${API_BASE_URL}/product?limit=150`;
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    
    const res = await fetch(url, { headers, mode: "cors" });
    if (!res.ok) return 0;
    
    const response = await res.json();
    const products = Array.isArray(response?.data) ? response.data : [];
    
    // Filter products by collection ID
    const collectionProducts = products.filter(product => {
      return product.collectionId === collectionId || 
             product.collection === collectionId ||
             product.collection_id === collectionId;
    });
    
    return collectionProducts.length;
  } catch (error) {
    return 0;
  }
}

async function fetchCollectionProductsList(collectionId) {
  if (!collectionId) return [];
  
  try {
    const url = `${API_BASE_URL}/product?limit=150`;
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    
    const res = await fetch(url, { headers, mode: "cors" });
    if (!res.ok) return [];
    
    const response = await res.json();
    const products = Array.isArray(response?.data) ? response.data : [];
    
    // Filter products by collection ID and exclude current product
    const collectionProducts = products.filter(product => {
      return (product.collectionId === collectionId || 
              product.collection === collectionId ||
              product.collection_id === collectionId) &&
             product.fabricCode !== collectionId; // Don't include the same product
    });
    
    return collectionProducts; // Return all products for complete grid
  } catch (error) {
    return [];
  }
}

/* ------------------------------ Utility Functions ------------------------------ */
function getWidthText(p) {
  const cm = p?.cm;
  const inch = p?.inch;
  if (isNum(cm) && isNum(inch)) return `${fmtNum(cm, 0)} cm / ${fmtNum(inch, 0)} inch`;
  if (isNum(inch)) return `${fmtNum(inch, 0)} inch`;
  if (isNum(cm)) return `${fmtNum(cm, 0)} cm`;
  return "";
}

function getWeightText(p) {
  const gsm = isNum(p?.gsm) ? fmtNum(p.gsm, 0) : "";
  const oz = isNum(p?.ozs || p?.oz) ? fmtNum(p.ozs || p.oz, 1) : "";
  if (gsm && oz) return `${gsm} gsm / ${oz} oz`;
  if (gsm) return `${gsm} gsm`;
  if (oz) return `${oz} oz`;
  return "";
}

function buildAddressLineFromCompany(ci) {
  const street = cleanStr(ci?.addressStreet);
  const city = cleanStr(ci?.addressCity);
  const state = cleanStr(ci?.addressState);
  const country = cleanStr(ci?.addressCountry);
  const pin = cleanStr(ci?.addressPostalCode);
  const parts = [street, city, state, country].filter(Boolean);
  const base = parts.join(", ");
  if (!base && pin) return pin;
  if (base && pin) return `${base} ${pin}`;
  return base;
}

function normalizeUrl(u) {
  const s = cleanStr(u);
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return "https:" + s;
  return "https://" + s;
}

function normalizeTel(s) {
  return cleanStr(s).replace(/[^\d+]/g, "").trim();
}

function normalizeWaDigits(s) {
  return cleanStr(s).replace(/[^\d]/g, "").trim();
}

function normalizeEmail(s) {
  return cleanStr(s);
}

function looksLikeEmail(s) {
  const t = cleanStr(s);
  return !!t && /@/.test(t);
}
/* ------------------------------ Header/Footer Drawing ------------------------------ */
function drawHeader(doc, { pageW, headerTop, logoDataUrl, logoSize, companyName, GOLD_LINE, GOLD_LINE_DARK }) {
  const logoBoxW = 22;
  const logoBoxH = 14.5;
  const gap = 5;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.setTextColor(0, 0, 0);
  
  const headerCompanyName = cleanStr(companyName);
  const nameW = doc.getTextWidth(headerCompanyName || " ");
  const totalW = logoBoxW + gap + nameW;
  const startX = Math.max(10, (pageW - totalW) / 2);
  const logoX = startX;
  const logoY = headerTop;
  
  if (logoDataUrl) {
    const isPng = String(logoDataUrl).startsWith("data:image/png");
    const isJpeg = String(logoDataUrl).startsWith("data:image/jpeg") || String(logoDataUrl).startsWith("data:image/jpg");
    const isWebp = String(logoDataUrl).startsWith("data:image/webp");
    const fmt = isPng ? "PNG" : isJpeg ? "JPEG" : isWebp ? "WEBP" : "PNG";
    const srcW = logoSize?.w || 100; // Default size if detection fails
    const srcH = logoSize?.h || 100;
    const fit = fitIntoBox(srcW, srcH, logoBoxW, logoBoxH);
    const drawW = fit.w || logoBoxW;
    const drawH = fit.h || logoBoxH;
    const dx = logoX + (logoBoxW - drawW) / 2;
    const dy = logoY + (logoBoxH - drawH) / 2;
    
    try {
      doc.addImage(logoDataUrl, fmt, dx, dy, drawW, drawH);
      } catch (error) {
        // Error adding logo image - continue without logo
      }
  } else {
    // No logo data available
    }
  
  if (headerCompanyName) {
    doc.text(headerCompanyName, logoX + logoBoxW + gap, headerTop + 11.0);
  }
  
  const lineY = headerTop + 17.2;
  doc.setDrawColor(GOLD_LINE[0], GOLD_LINE[1], GOLD_LINE[2]);
  doc.setLineWidth(0.9);
  doc.line(12, lineY, pageW - 12, lineY);
  doc.setDrawColor(GOLD_LINE_DARK[0], GOLD_LINE_DARK[1], GOLD_LINE_DARK[2]);
  doc.setLineWidth(0.2);
  doc.line(12, lineY + 1.1, pageW - 12, lineY + 1.1);
  
  return { lineY };
}

function drawFooter(doc, { pageW, pageH, M, BORDER, dynamicPhone1, dynamicPhone2, dynamicEmail, dynamicAddress }) {
  const footerLineY = pageH - 32;
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.35);
  doc.line(M, footerLineY, pageW - M, footerLineY);
  
  const footerY = footerLineY + 10;
  const iconR = 4.0;
  
  const footerPhone1 = cleanStr(dynamicPhone1);
  const footerPhone2 = cleanStr(dynamicPhone2);
  const footerEmail = cleanStr(dynamicEmail);
  const tel1 = normalizeTel(footerPhone1);
  const wa2 = normalizeWaDigits(footerPhone2);
  
  const footerItems = [
    footerPhone1 ? { 
      text: footerPhone1, 
      color: [194, 120, 62], 
      icon: "phone", 
      url: tel1 ? `tel:${tel1}` : "" 
    } : null,
    footerPhone2 ? { 
      text: footerPhone2, 
      color: [22, 163, 74], 
      icon: "whatsapp", 
      url: wa2 ? `https://wa.me/${wa2}` : "" 
    } : null,
    footerEmail ? {
      text: footerEmail,
      color: [30, 64, 175],
      icon: "mail",
      url: looksLikeEmail(footerEmail) ? `mailto:${normalizeEmail(footerEmail)}` : "",
    } : null,
  ].filter(Boolean);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  
  const gapX = 10;
  const widths = footerItems.map((it) => iconR * 2 + 3 + doc.getTextWidth(it.text));
  const total = widths.reduce((a, b) => a + b, 0) + gapX * (footerItems.length - 1);
  let fx = Math.max(M, (pageW - total) / 2);
  
  for (let i = 0; i < footerItems.length; i++) {
    const it = footerItems[i];
    const cx = fx + iconR;
    const cy = footerY - 2;
    const itemW = widths[i];
    
    // Draw icon circle
    doc.setFillColor(it.color[0], it.color[1], it.color[2]);
    doc.circle(cx, cy, iconR, "F");
    
    // Draw text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(it.text, fx + iconR * 2 + 3, footerY);
    
    fx += itemW + gapX;
  }
  
  if (dynamicAddress) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const addrLines = pdfWrap(doc, dynamicAddress, pageW - M * 2).slice(0, 2);
    doc.text(addrLines, pageW / 2, pageH - 10, { align: "center" });
  }
  
  return { footerLineY, contentMaxY: footerLineY - 8 };
}

/* ------------------------------ Collection Card Drawing ------------------------------ */
function drawCollectionProductCard(doc, p, x, y, w, h, { BORDER, TEXT = [15, 23, 42] } = {}) {
  const r = 7;
  // card shell
  fillR(doc, x + 1.0, y + 1.0, w, h, [241, 245, 249], r);
  fillR(doc, x, y, w, h, [255, 255, 255], r);
  strokeR(doc, x, y, w, h, BORDER, r, 0.25);
  
  const pad = 7;
  // IMAGE AREA
  const imgBoxH = Math.max(38, h * 0.40);
  const imgBoxX = x + pad;
  const imgBoxY = y + pad;
  const imgBoxW = w - pad * 2;
  
  // inner image container (light)
  fillR(doc, imgBoxX, imgBoxY, imgBoxW, imgBoxH, [248, 250, 252], 6);
  strokeR(doc, imgBoxX, imgBoxY, imgBoxW, imgBoxH, BORDER, 6, 0.25);
  
  // image draw (contain)
  const imgDataUrl = p?.__cardImgDataUrl || null;
  const imgSize = p?.__cardImgSize || null;
  if (imgDataUrl && typeof imgDataUrl === "string") {
    const isPng = imgDataUrl.startsWith("data:image/png");
    const isJpeg = imgDataUrl.startsWith("data:image/jpeg") || imgDataUrl.startsWith("data:image/jpg");
    const fmt = isPng ? "PNG" : isJpeg ? "JPEG" : null;
    if (fmt) {
      const srcW = imgSize?.w || 0;
      const srcH = imgSize?.h || 0;
      // keep some inset inside container
      const inset = 3.0;
      const boxW = imgBoxW - inset * 2;
      const boxH = imgBoxH - inset * 2;
      const fit = fitContain(srcW, srcH, boxW, boxH);
      try {
        doc.addImage(imgDataUrl, fmt, imgBoxX + inset + fit.dx, imgBoxY + inset + fit.dy, fit.w || boxW, fit.h || boxH);
      } catch {
        // Error adding image - continue without image
      }
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("IMAGE", imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2, { align: "center" });
  }
  
  // fabric code pill (top-left on image)
  const code = cleanStr(p?.fabricCode);
  if (code) {
    pill(doc, imgBoxX + 6, imgBoxY + 6, code, {
      bg: [0, 0, 0],
      fg: [255, 255, 255],
      h: 9.0,
      r: 4.5,
      fontSize: 10.0,
      padX: 5.2,
      bold: true,
    });
  }
  
  // TABLE AREA (ONLY table below image)
  const tableX = x + pad;
  const tableY = imgBoxY + imgBoxH + 8;
  const tableW = w - pad * 2;
  const tableH = y + h - pad - tableY;
  
  if (tableH > 22) {
    drawCardSpecsTable(doc, p, tableX, tableY, tableW, tableH, { BORDER, TEXT });
  }
}

function drawCardSpecsTable(doc, p, x, y, w, h, { BORDER, TEXT } = {}) {
  const r = 4.5;
  // background
  fillR(doc, x, y, w, h, [248, 250, 252], r);
  strokeR(doc, x, y, w, h, BORDER, r, 0.25);
  
  // 2 cols
  const colW = w / 2;
  // row heights must ALWAYS sum to h
  const baseRow = 14.2;
  let r1 = baseRow;
  let r2 = baseRow;
  let r3 = baseRow;
  let r4 = h - (r1 + r2 + r3);
  
  // if not enough space, make all rows equal so nothing spills out
  const minRow = 12.8;
  if (r4 < minRow) {
    const each = h / 4;
    r1 = each;
    r2 = each;
    r3 = each;
    r4 = each;
  }
  
  // grid lines
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.22);
  doc.line(x + colW, y, x + colW, y + h);
  const y1 = y + r1;
  const y2 = y + r1 + r2;
  const y3 = y + r1 + r2 + r3;
  doc.line(x, y1, x + w, y1);
  doc.line(x, y2, x + w, y2);
  doc.line(x, y3, x + w, y3);
  
  // values
  const category = cleanStr(p?.category);
  const design = cleanStr(p?.design);
  const structure = cleanStr(p?.structure);
  const content = joinArr(p?.content);
  const colors = joinArr(p?.color);
  const motif = cleanStr(p?.motif);
  const widthTxt = getWidthText(p);
  const weightTxt = getWeightText(p);
  
  // Helper function for mini spec cells
  function drawMiniSpecCell(doc, x, y, w, h, label, value, { TEXT = [15, 23, 42] } = {}) {
    const pad = 4;
    // label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.0);
    doc.setTextColor(30, 64, 175);
    doc.text(toUpperLabel(label), x + pad, y + 5.2);
    
    const v = cleanStr(value);
    if (!v) return;
    
    // value
    const valueTop = y + 9.8;
    const valueBottom = y + h - 2.8;
    const valueLH = 4.2;
    const valueMaxW = w - pad * 2;
    const maxLines = Math.max(1, Math.floor((valueBottom - valueTop) / valueLH));
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.1);
    doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
    
    if (maxLines <= 1) {
      doc.text(fitOneLine(doc, v, valueMaxW) || v, x + pad, valueTop);
      return;
    }
    
    const lines = pdfWrap(doc, v, valueMaxW).slice(0, maxLines);
    doc.text(lines, x + pad, valueTop);
  }
  
  // row 1
  drawMiniSpecCell(doc, x, y, colW, r1, "Category", category, { TEXT });
  drawMiniSpecCell(doc, x + colW, y, colW, r1, "Width", widthTxt, { TEXT });
  // row 2
  drawMiniSpecCell(doc, x, y1, colW, r2, "Design", design, { TEXT });
  drawMiniSpecCell(doc, x + colW, y1, colW, r2, "Weight", weightTxt, { TEXT });
  // row 3
  drawMiniSpecCell(doc, x, y2, colW, r3, "Structure", structure, { TEXT });
  drawMiniSpecCell(doc, x + colW, y2, colW, r3, "Colors", colors, { TEXT });
  // row 4
  drawMiniSpecCell(doc, x, y3, colW, r4, "Content", content, { TEXT });
  drawMiniSpecCell(doc, x + colW, y3, colW, r4, "Motif", motif, { TEXT });
}

/* ------------------------------ Table Cell Helper ------------------------------ */
function drawCell(doc, x, y0, w, label, value, TEXT) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(30, 64, 175);
  doc.text(toUpperLabel(label), x + 8, y0 + 7.6);

  const v = cleanStr(value);
  if (!v) return;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
  const cx = x + w * 0.65;
  doc.text(v, cx, y0 + 7.6, { align: "center" });
}

/* ------------------------------ Main PDF Generation Function ------------------------------ */
export async function downloadProductPdf(product, options = {}) {
  const {
    productUrl,
    qrDataUrl,
    logoPath = "/logo1.png",
    companyName,
    phone1,
    phone2,
    email,
    addressLine,
    onProgress, // New callback for progress updates
  } = options;

  try {
    // Notify progress
    if (onProgress) onProgress('Initializing PDF generation...');
    
    // ✅ Dynamic import of jsPDF - only loads when user clicks download
    const { jsPDF } = await import("jspdf");
    
    if (onProgress) onProgress('Fetching company information...');
    
    // Fetch company information and collection data
    const collectionId = product?.collectionId || product?.collection?.id || product?.collection?._id || product?.collection;
    
    const [companyInfo, collectionCount, collectionProducts] = await Promise.all([
      fetchCompanyInformation(),
      fetchCollectionProductsCount(collectionId),
      fetchCollectionProductsList(collectionId)
    ]);
    
    if (onProgress) onProgress('Generating PDF...');
    
    // Dynamic fields with fallbacks
    const dynamicCompanyName = cleanStr(companyName) || cleanStr(companyInfo?.legalName) || cleanStr(companyInfo?.name) || "Amrita Global Enterprises";
    const dynamicPhone1 = cleanStr(phone1) || cleanStr(companyInfo?.phone1) || "+91-9925155141";
    const dynamicPhone2 = cleanStr(phone2) || cleanStr(companyInfo?.whatsappNumber) || "+91-9925155141";
    const dynamicEmail = cleanStr(email) || cleanStr(companyInfo?.primaryEmail) || "connect.age@outlook.com";
    const dynamicAddress = cleanStr(addressLine) || buildAddressLineFromCompany(companyInfo) || "404, 4th Floor, Safal Prelude, Opp SPIPA, Ahmedabad, Gujarat, India 380015";

    // Create PDF document
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Color palette
    const BORDER = [226, 232, 240];
    const TEXT = [15, 23, 42];
    const PILL_BLUE = [30, 58, 138];
    const PILL_TEAL = [13, 116, 110];
    const AMBER_BG = [255, 247, 204];
    const GOLD_LINE = [201, 162, 106];
    const GOLD_LINE_DARK = [122, 92, 52];

    // Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, "F");

    // Product data
    const code = cleanStr(product?.fabricCode);
    const title = cleanStr(product?.productTitle || product?.name || product?.title);
    const tagline = cleanStr(product?.productTagline);
    const shortDesc = cleanStr(product?.shortProductDescription || product?.shortDescription);
    const categoryPill = toUpperLabel(product?.category);
    const supplyPill = hyphenToSpace(product?.supplyModel || product?.status);

    // Generate enhanced title if not provided
    const enhancedTitle = title || (() => {
      const parts = [];
      if (product?.design) parts.push(cleanStr(product.design));
      if (product?.color || product?.colors) parts.push(joinArr(product?.color || product?.colors));
      if (product?.content) parts.push(joinArr(product?.content));
      if (product?.structure) parts.push(cleanStr(product.structure));
      if (product?.cm || product?.inch) {
        const width = getWidthText(product);
        if (width) parts.push(`Fabric ${width}`);
      }
      if (product?.gsm) parts.push(`${fmtNum(product.gsm, 0)}gsm`);
      if (product?.supplyModel) parts.push(cleanStr(product.supplyModel));
      
      return parts.length > 0 ? parts.join(' ') : code || 'Product Details';
    })();

    // Generate enhanced tagline if not provided
    const enhancedTagline = tagline || shortDesc || (() => {
      const parts = [];
      if (product?.supplyModel?.toLowerCase().includes('stock')) {
        parts.push('Never-out-of-stock');
      }
      if (product?.content) {
        parts.push(`${joinArr(product.content).toLowerCase()}`);
      }
      if (product?.color || product?.colors) {
        parts.push(`in ${joinArr(product?.color || product?.colors).toLowerCase()}`);
      }
      parts.push('engineered for consistent bulk runs. Trusted textile manufacturing and custom fabric production partner.');
      
      return parts.join(' ');
    })();

    // Load images with improved error handling
    const { dataUrl: imgDataUrl, size: imgSize } = await loadImageWithFallbacks(product, false);

    // Try multiple logo paths with improved loading
    let logoDataUrl = null;
    let logoSize = null;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const logoPaths = [
      "/assets/img/logo/my_logo.png", // Your actual logo (FIRST PRIORITY)
      logoPath,
      "/assets/img/logo/logo.svg",
      "/assets/img/logo/logo-white.svg",
      "/logo1.png",
      "/logo.png",
      "/assets/img/logo/logo.png"
    ];
    
    if (onProgress) onProgress('Generating PDF...');
    for (const path of logoPaths) {
      try {
        const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
        console.log(`Trying logo path: ${fullUrl}`);
        logoDataUrl = await toDataUrl(fullUrl);
        if (logoDataUrl) {
          logoSize = await getDataUrlSize(logoDataUrl);
          console.log(`Successfully loaded logo: ${path}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!logoDataUrl) {
      // Logo failed to load - will show company name only
    }

    // Generate QR code with better error handling
    let finalQrDataUrl = null;
    if (onProgress) onProgress('Generating PDF...');
    try {
      if (qrDataUrl && typeof qrDataUrl === "string") {
        finalQrDataUrl = qrDataUrl;
        console.log('Using provided QR code');
      } else if (productUrl) {
        finalQrDataUrl = await makeQrDataUrl(normalizeUrl(productUrl));
        if (finalQrDataUrl) {
          // QR code generated successfully
        } else {
          // QR code generation failed
        }
      }
    } catch (error) {
      finalQrDataUrl = null;
    }

    if (onProgress) onProgress('Generating PDF...');
    const headerTop = 6.5;
    const M = 14;

    // Draw header
    drawHeader(doc, {
      pageW,
      headerTop,
      logoDataUrl,
      logoSize,
      companyName: dynamicCompanyName,
      GOLD_LINE,
      GOLD_LINE_DARK,
    });

    // Draw footer
    const { contentMaxY } = drawFooter(doc, {
      pageW,
      pageH,
      M,
      BORDER,
      dynamicPhone1,
      dynamicPhone2,
      dynamicEmail,
      dynamicAddress,
    });

    // Hero section
    const heroTop = 27;
    const codeX = M + 2.5;

    if (code) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.6);
      doc.setTextColor(0, 0, 0);
      doc.text(String(code), codeX, heroTop + 7.2);
      
      const codeW = doc.getTextWidth(String(code));
      doc.setDrawColor(GOLD_LINE_DARK[0], GOLD_LINE_DARK[1], GOLD_LINE_DARK[2]);
      doc.setLineWidth(0.4);
      doc.line(codeX, heroTop + 8.9, codeX + Math.min(codeW, 34), heroTop + 8.9);
    }

    // Image card
    const imgX = M;
    const imgY = heroTop + 10;
    const imgW = 62;
    const imgH = 62;

    fillR(doc, imgX + 1.0, imgY + 1.0, imgW, imgH, [241, 245, 249], 2.8);
    fillR(doc, imgX, imgY, imgW, imgH, [255, 255, 255], 2.8);
    strokeR(doc, imgX, imgY, imgW, imgH, BORDER, 2.8, 0.25);

    if (imgDataUrl && typeof imgDataUrl === "string") {
      const isPng = imgDataUrl.startsWith("data:image/png");
      const isJpeg = imgDataUrl.startsWith("data:image/jpeg") || imgDataUrl.startsWith("data:image/jpg");
      const fmt = isPng ? "PNG" : isJpeg ? "JPEG" : null;
      
      if (fmt) {
        try {
          doc.addImage(imgDataUrl, fmt, imgX + 2, imgY + 2, imgW - 4, imgH - 4);
        } catch (error) {
          // Error adding hero image - continue without image
          }
      }
    }

    // ✅ IMPROVED: Better styled options badge (like reference)
    if (collectionCount > 0) {
      const badgeW = 34;
      const badgeH = 7.0;
      const bx = imgX + (imgW - badgeW) / 2; // center bottom
      const by = imgY + imgH - badgeH - 7;
      
      // Purple gradient background
      fillR(doc, bx, by, badgeW, badgeH, [67, 56, 202], 2.4);
      
      // Settings icon (gear)
      const icx = bx + 5;
      const icy = by + badgeH / 2 + 0.25;
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.45);
      doc.rect(icx - 1.25, icy - 1.25, 2.5, 2.5, "S");
      doc.line(icx - 1.25, icy - 1.25, icx, icy - 2.1);
      doc.line(icx + 1.25, icy - 1.25, icx, icy - 2.1);
      doc.line(icx, icy - 2.1, icx + 1.25, icy - 1.25);
      
      // Text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.9);
      doc.setTextColor(255, 255, 255);
      const optionsText = collectionCount === 1 ? "1 Option" : `${fmtNum(collectionCount, 0)} Options`;
      doc.text(optionsText, bx + 8.2, by + badgeH * 0.68);
      } else {
        // No collection count badge needed
      }

    // Right content block
    const rightX = imgX + imgW + 12;
    const rightW = pageW - M - rightX;

    // Pills and ratings
    const pillsY = heroTop + 10;
    let px = rightX;

    if (categoryPill) {
      const p1 = pill(doc, px, pillsY, categoryPill, {
        bg: PILL_BLUE,
        fg: [255, 255, 255],
        h: 7.2,
        r: 3.6,
        fontSize: 7.2,
        padX: 4.2,
        bold: true,
      });
      px += p1.w + 4;
    }

    if (supplyPill) {
      const p2 = pill(doc, px, pillsY, supplyPill, {
        bg: PILL_TEAL,
        fg: [255, 255, 255],
        h: 7.2,
        r: 3.6,
        fontSize: 7.2,
        padX: 4.2,
        bold: true,
      });
      px += p2.w + 4;
    }

    // ✅ IMPROVED: Better star rating design
    const rawRating = product?.ratingValue || product?.rating || product?.ratingPercent || 5;
    if (rawRating !== null && rawRating !== undefined) {
      const ratingPillH = 7.2;
      const ratingPillW = 44;
      fillR(doc, px, pillsY, ratingPillW, ratingPillH, AMBER_BG, 3.6);
      
      const STAR_SIZE = 3.0;
      const STAR_GAP = 0.5;
      const starsW = 5 * STAR_SIZE + 4 * STAR_GAP;
      const yCenter = pillsY + ratingPillH / 2 + 0.2;
      drawStars(doc, px + (ratingPillW - starsW) / 2, yCenter, rawRating, {
        size: STAR_SIZE,
        gap: STAR_GAP,
      });
      } else {
        // No rating available to display
      }

    // Title and tagline
    const titleTopY = pillsY + 16.5;
    let titleSize = 16.0; // Reduced size to fit longer titles

    if (enhancedTitle) {
      doc.setFont("times", "bold");
      doc.setFontSize(titleSize);
      doc.setTextColor(0, 0, 0);
      const titleLines = pdfWrap(doc, enhancedTitle, rightW).slice(0, 3);
      doc.text(titleLines, rightX, titleTopY);
      if (enhancedTagline) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        const tagLines = pdfWrap(doc, enhancedTagline, rightW).slice(0, 2);
        doc.text(tagLines, rightX, titleTopY + (titleLines.length * 6) + 4);
        }
    } else if (code) {
      // If no title, use code as title
      doc.setFont("times", "bold");
      doc.setFontSize(titleSize);
      doc.setTextColor(0, 0, 0);
      doc.text(code, rightX, titleTopY);
      } else {
        // No title or code available
      }

    // Description paragraph
    const paraY = imgY + imgH + 10;
    const descText = shortDesc || enhancedTagline;
    if (descText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.8);
      doc.setTextColor(51, 65, 85);
      const paraW = pageW - M * 2;
      const paraLines = pdfWrap(doc, descText, paraW).slice(0, 2);
      doc.text(paraLines, M, paraY);
    }

    // Specifications table
    const tableX = M;
    const tableY = paraY + (descText ? 10 : 0);
    const tableW = pageW - M * 2;
    const cellW = tableW / 2;
    const rowH = 12.8;
    const finishH = 16.0;
    const tableH = rowH * 4 + finishH;

    fillR(doc, tableX + 1.0, tableY + 1.0, tableW, tableH, [241, 245, 249], 2.8);
    fillR(doc, tableX, tableY, tableW, tableH, [248, 250, 252], 2.8);
    strokeR(doc, tableX, tableY, tableW, tableH, BORDER, 2.8, 0.25);

    // Table grid lines
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.25);
    doc.line(tableX + cellW, tableY, tableX + cellW, tableY + rowH * 4);
    for (let i = 1; i < 4; i++) {
      doc.line(tableX, tableY + rowH * i, tableX + tableW, tableY + rowH * i);
    }
    doc.line(tableX, tableY + rowH * 4, tableX + tableW, tableY + rowH * 4);

    // Fill table cells
    drawCell(doc, tableX, tableY + rowH * 0, cellW, "Content", joinArr(product?.content), TEXT);
    drawCell(doc, tableX + cellW, tableY + rowH * 0, cellW, "Width", getWidthText(product), TEXT);
    drawCell(doc, tableX, tableY + rowH * 1, cellW, "Weight", getWeightText(product), TEXT);
    drawCell(doc, tableX + cellW, tableY + rowH * 1, cellW, "Design", cleanStr(product?.design), TEXT);
    drawCell(doc, tableX, tableY + rowH * 2, cellW, "Structure", cleanStr(product?.structure), TEXT);
    drawCell(doc, tableX + cellW, tableY + rowH * 2, cellW, "Colors", joinArr(product?.color || product?.colors), TEXT);
    drawCell(doc, tableX, tableY + rowH * 3, cellW, "Motif", cleanStr(product?.motif), TEXT);
    
    const moqVal = (() => {
      const moq = isNum(product?.salesMOQ) ? fmtNum(product.salesMOQ, 0) : cleanStr(product?.salesMOQ);
      if (!moq) return "";
      const um = cleanStr(product?.uM);
      return um ? `${moq} ${um}` : `${moq}`;
    })();
    drawCell(doc, tableX + cellW, tableY + rowH * 3, cellW, "Sales MOQ", moqVal, TEXT);

    // Finish row
    const finishY = tableY + rowH * 4;
    const finishLabelW = 24;
    const valueX = tableX + finishLabelW;
    const valueW = tableW - finishLabelW;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(30, 64, 175);
    doc.text("FINISH", tableX + 8, finishY + 8.0);

    const finishText = joinFinish(product?.finish);
    if (finishText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
      const padLeft = 6;
      const maxTextW = valueW - 10;
      const finishLines = pdfWrap(doc, finishText, maxTextW).slice(0, 2);
      doc.text(finishLines, valueX + padLeft, finishY + 8.0);
    }

    // QR Code
    if (finalQrDataUrl) {
      const qrCardW = 34;
      const qrCardH = 42;
      const qrSize = 28;
      const qrX = pageW - M - qrCardW;
      const qrY = Math.min(finishY + finishH + 9, contentMaxY - qrCardH);

      fillR(doc, qrX + 0.8, qrY + 0.8, qrCardW, qrCardH, [241, 245, 249], 2.8);
      fillR(doc, qrX, qrY, qrCardW, qrCardH, [255, 255, 255], 2.8);
      strokeR(doc, qrX, qrY, qrCardW, qrCardH, BORDER, 2.8, 0.25);

      try {
        doc.addImage(finalQrDataUrl, "PNG", qrX + (qrCardW - qrSize) / 2, qrY + 6, qrSize, qrSize);
      } catch (error) {
        // Error adding QR code - continue without QR
        }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.6);
      doc.setTextColor(30, 41, 59);
      doc.text("Scan for details", qrX + qrCardW / 2, qrY + 6 + qrSize + 7.2, { align: "center" });
    }

    // Apparel and Home & Accessories sections
    const sectionsY = finishY + finishH + 8;
    const availableWidth = finalQrDataUrl ? pageW - M - 40 : pageW - M * 2;
    
    if (sectionsY < contentMaxY - 60) {
      // Apparel section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Apparel :", M, sectionsY);
      const apparelItems = [
        "Womenswear: Blouses / tops, Summer dresses, and Tunics / kurta.",
        "Menswear: Casual shirts, Summer short-sleeve shirts, and Kurta / casual ethnic tops.",
        "Unisex: Casual shirts and Scarfs and Stoles (light weight) (non-med).",
        "Kidswear: Shirts / tops, Lightweight dresses / frocks, and Pyjamas / nightwear."
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      
      let currentY = sectionsY + 6;
      apparelItems.forEach((item, index) => {
        if (currentY < contentMaxY - 35) {
          doc.text(`• ${item}`, M + 4, currentY);
          currentY += 5;
        }
      });
      // Home & Accessories section - ALWAYS show if there's space
      if (currentY < contentMaxY - 25) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Home & Accessories :", M, currentY + 4);
        const homeItems = [
          "Accessories: Lightweight scarves / stoles, Pocket squares, and Fabric belts / trims.",
          "Home Textiles: Pillow covers, Lightweight cushion covers, and Decorative table runners.",
          "Uniforms / Workwear: Light service uniforms (indoor)."
        ];

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        
        currentY += 10;
        homeItems.forEach((item, index) => {
          if (currentY < contentMaxY - 5) {
            doc.text(`• ${item}`, M + 4, currentY);
            currentY += 5;
          }
        });
        } else {
          // No items to display
        }
    } else {
      // Section data not available
      }

    // ✅ NEW: Add collection products as 2x2 grid on additional pages
    if (collectionProducts.length > 0) {
      if (onProgress) onProgress('Generating PDF...');
      
      // Preload card images with improved error handling
      const imageLoadPromises = collectionProducts.map(async (prod, index) => {
        try {
          const { dataUrl, size } = await loadImageWithFallbacks(prod, true);
          prod.__cardImgDataUrl = dataUrl;
          prod.__cardImgSize = size;
        } catch (error) {
          prod.__cardImgDataUrl = null;
          prod.__cardImgSize = null;
        }
      });
      
      // Load images in batches to avoid overwhelming the server
      const batchSize = BATCH_SIZE;
      for (let i = 0; i < imageLoadPromises.length; i += batchSize) {
        const batch = imageLoadPromises.slice(i, i + batchSize);
        await Promise.all(batch);
        
        // Update progress - keep showing "Generating PDF..."
        if (onProgress) {
          onProgress('Generating PDF...');
        }
        
        // Small delay between batches to be nice to the server
        if (i + batchSize < imageLoadPromises.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }
      
      if (onProgress) onProgress('Generating PDF...');

      // Grid layout: 2 columns x 2 rows per page (4 products per page)
      // Will generate enough pages to show all collection products (48 for Nokia)
      const startY = 29; // under header line
      const gapX = 7;
      const gapY = 9;
      const cols = 2;
      const contentMaxY2 = pageH - 32 - 8;
      const availH = contentMaxY2 - startY;
      const rows = 2;
      const cardH = Math.max(96, (availH - gapY) / rows);
      const cardW = (pageW - M * 2 - gapX) / cols;
      const cardsPerPage = cols * rows; // 4 products per page
      const totalPages = Math.ceil(collectionProducts.length / cardsPerPage);
      
      for (let pageStart = 0; pageStart < collectionProducts.length; pageStart += cardsPerPage) {
        const currentPage = Math.floor(pageStart / cardsPerPage) + 1;
        const productsOnThisPage = Math.min(cardsPerPage, collectionProducts.length - pageStart);
        doc.addPage();

        // header (same)
        drawHeader(doc, {
          pageW,
          headerTop,
          logoDataUrl,
          logoSize,
          companyName: dynamicCompanyName,
          GOLD_LINE,
          GOLD_LINE_DARK,
        });

        // body: cards only
        const slice = collectionProducts.slice(pageStart, pageStart + cardsPerPage);
        for (let i = 0; i < slice.length; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const x = M + col * (cardW + gapX);
          const y = startY + row * (cardH + gapY);
          drawCollectionProductCard(doc, slice[i], x, y, cardW, cardH, { BORDER });
        }

        // footer (same)
        drawFooter(doc, {
          pageW,
          pageH,
          M,
          BORDER,
          dynamicPhone1,
          dynamicPhone2,
          dynamicEmail,
          dynamicAddress,
        });
      }
    }

    // Save PDF with error handling
    if (onProgress) onProgress('Generating PDF...');
    
    try {
      const fileName = code ? `${code}.pdf` : "product-sample.pdf";
      doc.save(fileName);
      
      if (onProgress) onProgress('PDF downloaded successfully!');
      
      return { success: true, fileName };
    } catch (saveError) {
      console.error('PDF save error:', saveError);
      throw new Error(`Failed to save PDF: ${saveError.message}`);
    }
    
  } catch (error) {
    console.error('PDF generation error:', error);
    
    // Enhance error messages for better user experience
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error('Network error occurred. Please check your internet connection and try again.');
    } else if (error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
      throw new Error('Image loading blocked by browser security. Please try again or contact support.');
    } else if (error.message?.includes('jsPDF') || error.message?.includes('PDF')) {
      throw new Error('PDF generation failed. Please try again.');
    } else {
      // Re-throw with original message for debugging
      throw error;
    }
  }
}