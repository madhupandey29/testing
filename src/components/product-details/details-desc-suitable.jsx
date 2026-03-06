/* ---------------------------------------------------------------------- */
/*  details-suitable-keywords.jsx – Suitable For + Popular Search Keywords */
/* ---------------------------------------------------------------------- */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useGetSingleProductQuery } from '@/redux/features/productApi';

/* ───── helpers ───── */
const nonEmpty = (v) => {
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && (typeof v === 'number' || String(v).trim() !== '');
};
const pick = (...xs) => xs.find(nonEmpty);

const toNameArray = (raw) => {
  const src = raw ?? [];
  if (Array.isArray(src)) {
    return src
      .map((item) => {
        if (item == null) return '';
        if (typeof item === 'string' || typeof item === 'number') return String(item);
        return item.name ?? item.label ?? item.value ?? item.colorName ?? item.colour ?? '';
      })
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  if (typeof src === 'object') {
    const v = src.name ?? src.label ?? src.value ?? src.colorName ?? src.colour;
    return v ? [String(v).trim()] : [];
  }
  const s = String(src || '').trim();
  return s ? [s] : [];
};

const pushUniq = (arr, value) => {
  const v = String(value || '').trim();
  if (!v) return;
  if (!arr.includes(v)) arr.push(v);
};

/* ---------- parse suitability line formats ---------- */
function parseSuitabilityLine(line) {
  const s = String(line || '').trim();
  if (!s) return null;

  // "Menswear | T-Shirts | 92%"
  if (s.includes('|')) {
    const parts = s.split('|').map((x) => x.trim()).filter(Boolean);
    const category = parts[0] || '';
    const item = parts[1] || '';
    return category && item ? { category, item } : null;
  }

  // "Menswear: T-Shirts"
  const m1 = s.match(/^([^:]+):\s*(.+)$/);
  if (m1) {
    const category = m1[1].trim();
    const item = m1[2].trim();
    return category && item ? { category, item } : null;
  }

  // "Menswear - T-Shirts"
  const m2 = s.match(/^([^-]+)-\s*(.+)$/);
  if (m2) {
    const category = m2[1].trim();
    const item = m2[2].trim();
    return category && item ? { category, item } : null;
  }

  return null;
}

/* ---------- parse aiTempOutput table-ish output (keeps encountered order) ---------- */
function parseSuitabilityEntriesFromAiOutput(aiTempOutput) {
  if (!aiTempOutput || typeof aiTempOutput !== 'string') return [];

  try {
    const lines = aiTempOutput.split('\n').filter((l) => l.trim());
    const order = [];
    const bucket = {};

    for (const line of lines) {
      if (
        line.includes('Suitablefor') ||
        line.includes('---') ||
        line.includes('Product') ||
        line.includes('Confidence')
      ) {
        continue;
      }

      // | Category | Item | Confidence |
      const match = line.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
      if (!match) continue;

      const category = match[1].trim();
      const item = match[2].trim();
      if (!category || !item) continue;

      if (!bucket[category]) {
        bucket[category] = [];
        order.push(category);
      }
      pushUniq(bucket[category], item);
    }

    return order
      .map((cat) => [cat, bucket[cat] || []])
      .filter(([, items]) => items.length);
  } catch {
    return [];
  }
}

/* ---------- normalize suitability to ENTRIES (array) while keeping dynamic order ---------- */
function normalizeSuitabilityToEntries(rawSuitability, aiTempOutput) {
  // If already object: keep API JSON order
  if (rawSuitability && typeof rawSuitability === 'object' && !Array.isArray(rawSuitability)) {
    const entries = [];
    for (const [cat, rawItems] of Object.entries(rawSuitability)) {
      const items = Array.isArray(rawItems) ? rawItems : [rawItems];

      const out = [];
      for (const it of items) {
        const s = it == null ? '' : String(it).trim();
        if (!s) continue;

        // if item itself is "Cat | Item | 92%" -> parse it
        const parsed = parseSuitabilityLine(s);
        if (parsed?.category && parsed?.item) {
          // This line embeds its own category; respect it dynamically
          // (still ordered by first time we see it)
          // We'll add into an entries-bucket below.
          // So just handle after loop using a map.
          out.push({ __parsed: true, ...parsed });
        } else {
          pushUniq(out, s);
        }
      }

      // If parsed lines exist, we need to merge them dynamically by encountered order.
      const parsedLines = out.filter((x) => x && typeof x === 'object' && x.__parsed);
      const plainItems = out.filter((x) => typeof x === 'string');

      // Start with the object key category itself if it has plain items
      if (cat && plainItems.length) entries.push([String(cat).trim(), plainItems]);

      // Merge parsed ones preserving first-seen order (within this category block)
      if (parsedLines.length) {
        const order = [];
        const bucket = {};

        for (const p of parsedLines) {
          const c = String(p.category).trim();
          const item = String(p.item).trim();
          if (!c || !item) continue;

          if (!bucket[c]) {
            bucket[c] = [];
            order.push(c);
          }
          pushUniq(bucket[c], item);
        }

        for (const c of order) {
          entries.push([c, bucket[c]]);
        }
      }
    }

    // Merge duplicates while keeping first-seen category order
    const seen = {};
    const finalOrder = [];
    for (const [cat, items] of entries) {
      const c = String(cat || '').trim();
      if (!c) continue;
      if (!seen[c]) {
        seen[c] = [];
        finalOrder.push(c);
      }
      for (const it of items || []) pushUniq(seen[c], it);
    }

    return finalOrder.map((c) => [c, seen[c]]).filter(([, items]) => items.length);
  }

  // If array: maybe structured "Cat | Item | 92%" OR just items
  if (Array.isArray(rawSuitability) && rawSuitability.length) {
    const lines = rawSuitability
      .map((x) => (x == null ? '' : String(x).trim()))
      .filter(Boolean);

    const hasStructured = lines.some((x) => x.includes('|') || x.includes(':') || x.includes('-'));

    if (hasStructured) {
      const order = [];
      const bucket = {};
      const general = [];

      for (const line of lines) {
        const parsed = parseSuitabilityLine(line);
        if (parsed?.category && parsed?.item) {
          if (!bucket[parsed.category]) {
            bucket[parsed.category] = [];
            order.push(parsed.category);
          }
          pushUniq(bucket[parsed.category], parsed.item);
        } else {
          pushUniq(general, line);
        }
      }

      const out = order.map((c) => [c, bucket[c]]).filter(([, items]) => items.length);
      if (general.length) out.push(['General', general]); // still dynamic (only if present)
      return out;
    }

    // plain array -> General only
    return [['General', lines]];
  }

  // If string single line
  if (typeof rawSuitability === 'string' && rawSuitability.trim()) {
    const parsed = parseSuitabilityLine(rawSuitability);
    if (parsed?.category && parsed?.item) return [[parsed.category, [parsed.item]]];
    return [['General', [rawSuitability.trim()]]];
  }

  // fallback to aiTempOutput
  const fromAi = parseSuitabilityEntriesFromAiOutput(aiTempOutput);
  return fromAi;
}

/* ---------- Suitable For UI (like your 1st screenshot) ---------- */
function SuitableForColumns({ entries }) {
  if (!entries?.length) return <span className="muted">Not available</span>;

  return (
    <div className="sf-wrap">
      {entries.map(([category, items]) => (
        <div key={category} className="sf-col">
          <div className="sf-title">{category}</div>
          <ul className="sf-list">
            {(items || []).map((item) => (
              <li key={`${category}-${item}`} className="sf-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <style jsx>{`
        .muted {
          font-family: var(--tp-ff-roboto);
          font-size: 14px;
          color: var(--tp-text-2);
        }

        /* simple headings + bullets, like your 1st screenshot */
        .sf-wrap {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 28px;
          width: 100%;
        }

        .sf-title {
          font-family: var(--tp-ff-jost);
          font-size: 16px;
          font-weight: 900;
          color: var(--tp-text-1);
          margin-bottom: 10px;
        }

        .sf-list {
          margin: 0;
          padding-left: 18px;
        }

        .sf-item {
          font-family: var(--tp-ff-roboto);
          font-size: 14px;
          color: var(--tp-text-2);
          line-height: 1.75;
          margin: 4px 0;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        @media (max-width: 992px) {
          .sf-wrap {
            grid-template-columns: 1fr;
            gap: 18px;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  MAIN COMPONENT                                                         */
/* ---------------------------------------------------------------------- */
export default function DetailsSuitableKeywords({
  product = {},
  sectionClassName = 'grid-section',
}) {
  const { _id, slug } = product;

  const needFetch =
    !nonEmpty(product?.keywords) || !nonEmpty(product?.suitability) || !nonEmpty(product?.aiTempOutput);

  const { data: singleResp } = useGetSingleProductQuery(_id, { skip: !_id || !needFetch });
  const singleById = singleResp?.data || singleResp?.product || singleResp;

  const [singleBySlug, setSingleBySlug] = useState(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  useEffect(() => {
    let cancel = false;
    async function fetchBySlug() {
      if (!slug || !API_BASE) return;
      try {
        const res = await fetch(`${API_BASE}/product/fieldname/productslug/${slug}`, {
          headers: { 'x-api-key': API_KEY || '', 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancel) setSingleBySlug(json?.data || null);
      } catch {
        if (!cancel) setSingleBySlug(null);
      }
    }
    if (!singleById && needFetch && slug) fetchBySlug();
    return () => {
      cancel = true;
    };
  }, [slug, API_BASE, API_KEY, needFetch, singleById]);

  const src =
    singleById && Object.keys(singleById).length
      ? singleById
      : singleBySlug && Object.keys(singleBySlug).length
      ? singleBySlug
      : product;

  /* ----- Suitable For (DYNAMIC) ----- */
  const rawSuitability = pick(product?.suitability, src?.suitability);
  const aiTempOutput = pick(product?.aiTempOutput, src?.aiTempOutput);

  const suitabilityEntries = useMemo(
    () => normalizeSuitabilityToEntries(rawSuitability, aiTempOutput),
    [rawSuitability, aiTempOutput]
  );

  /* ----- Keywords ----- */
  const keywordList = useMemo(
    () => toNameArray(pick(product?.keywords, src?.keywords)).slice(0, 24),
    [product?.keywords, src?.keywords]
  );

  return (
    <div className={`suit-kw-section ${sectionClassName}`} style={{ marginTop: 60, marginBottom: 60 }}>
      <div className="section-head">
        <span className="head-badge">PRODUCT INFO</span>
        <h2 className="head-title">Suitable For & Popular Searches</h2>
        <p className="head-sub">Quick suitability + the common search terms buyers use for this fabric.</p>
      </div>

      <div className="grid">
        {/* Suitable For */}
        <div className="card">
          <div className="card-head">
            <div className="pill">Suitable For</div>
          </div>
          <div className="card-body">
            <SuitableForColumns entries={suitabilityEntries} />
          </div>
        </div>

        {/* Popular Search Keywords */}
        <div className="card">
          <div className="card-head">
            <div className="pill pill-gold">Popular Search Keywords</div>
            <div className="count">{keywordList.length}</div>
          </div>
          <div className="card-body">
            {keywordList.length ? (
              <div className="chips" aria-label="Popular search keywords">
                {keywordList.map((k, idx) => (
                  <span key={`${k}-${idx}`} className="chip" title={k}>
                    {k}
                  </span>
                ))}
              </div>
            ) : (
              <div className="empty">No keywords available.</div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .suit-kw-section {
          width: 100%;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          padding: 0 16px;
        }

        .section-head {
          text-align: center;
          margin-bottom: 28px;
        }

        .head-badge {
          display: inline-block;
          font-family: var(--tp-ff-jost);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: var(--tp-text-1);
          border: 1px solid var(--tp-grey-2);
          background: var(--tp-grey-1);
          padding: 6px 12px;
          border-radius: 999px;
          margin-bottom: 10px;
        }

        .head-title {
          margin: 0 0 8px;
          font-family: var(--tp-ff-jost);
          font-size: 30px;
          font-weight: 900;
          color: var(--tp-text-1);
          line-height: 1.15;
        }

        .head-sub {
          margin: 0;
          font-family: var(--tp-ff-roboto);
          font-size: 15px;
          color: var(--tp-text-2);
          line-height: 1.6;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }

        .card {
          background: var(--tp-common-white);
          border: 1px solid var(--tp-grey-2);
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(15, 34, 53, 0.06);
          overflow: hidden;
        }

        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 18px 12px;
          border-bottom: 1px solid var(--tp-grey-2);
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--tp-ff-jost);
          font-size: 13px;
          font-weight: 900;
          color: var(--tp-common-white);
          background: var(--tp-theme-primary);
          padding: 8px 12px;
          border-radius: 999px;
        }

        .pill-gold {
          background: var(--tp-theme-secondary);
          color: var(--tp-text-1);
        }

        .count {
          font-family: var(--tp-ff-jost);
          font-weight: 900;
          font-size: 13px;
          color: var(--tp-theme-primary);
          background: rgba(44, 76, 151, 0.1);
          padding: 6px 10px;
          border-radius: 999px;
        }

        .card-body {
          padding: 18px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--tp-grey-2);
          background: var(--tp-common-white);
          font-family: var(--tp-ff-roboto);
          font-size: 13px;
          font-weight: 600;
          color: var(--tp-text-1);
          line-height: 1;
          max-width: 100%;
        }

        .chip:hover {
          border-color: var(--tp-theme-primary);
          box-shadow: 0 2px 10px rgba(44, 76, 151, 0.12);
          transform: translateY(-1px);
        }

        .empty {
          font-family: var(--tp-ff-roboto);
          font-size: 14px;
          color: var(--tp-text-2);
          background: var(--tp-grey-1);
          border: 1px dashed var(--tp-grey-2);
          padding: 16px;
          border-radius: 12px;
          text-align: center;
        }

        @media (max-width: 992px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .head-title {
            font-size: 24px;
          }
          .card-body {
            padding: 14px;
          }
          .chip {
            font-size: 12px;
            padding: 7px 10px;
          }
        }
      `}</style>
    </div>
  );
}
