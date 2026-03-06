/* ---------------------------------------------------------------------- */
/*  details-tab-nav.jsx – Description / FAQ                                */
/* ---------------------------------------------------------------------- */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useGetSingleProductQuery } from '@/redux/features/productApi';
import { useGetWebsiteFaqsQuery } from '@/redux/features/websiteFaqApi';

/* ───── helpers ───── */
const nonEmpty = (v) => {
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && (typeof v === 'number' || String(v).trim() !== '');
};
const pick = (...xs) => xs.find(nonEmpty);
const stripHtml = (html) => String(html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/* ---------- FAQ renderer ---------- */
function FaqBlock({ items = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="faq-loading">
        <div className="loading-spinner"></div>
        <p>Loading FAQs...</p>
        <style jsx>{`
          .faq-loading {
            text-align: center;
            padding: 40px 20px;
            border-radius: 12px;
            border: 1px dashed var(--tp-grey-2);
            background: var(--tp-grey-1);
          }
          .loading-spinner {
            width: 24px;
            height: 24px;
            border: 2px solid var(--tp-grey-2);
            border-top: 2px solid var(--tp-theme-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .faq-loading p {
            margin: 0;
            font-size: 14px;
            color: var(--tp-text-2);
            font-family: var(--tp-ff-roboto);
          }
        `}</style>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="no-faqs">
        <p>No FAQs available at the moment.</p>
        <style jsx>{`
          .no-faqs {
            text-align: center;
            padding: 40px 20px;
            border-radius: 12px;
            border: 1px dashed var(--tp-grey-2);
            background: var(--tp-grey-1);
          }
          .no-faqs p {
            margin: 0;
            font-size: 14px;
            color: var(--tp-text-2);
            font-family: var(--tp-ff-roboto);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="faq-container">
      {items.map((it, idx) => (
        <details key={it.key || idx} className="faq-item">
          <summary className="faq-question">
            <span className="question-text">
              {it.questionIsHtml ? (
                <span dangerouslySetInnerHTML={{ __html: it.question }} />
              ) : (
                it.question
              )}
            </span>
            <span className="faq-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 3.5V12.5M3.5 8H12.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </summary>

          <div className="faq-answer">
            {it.answerIsHtml ? (
              <div dangerouslySetInnerHTML={{ __html: it.answer }} />
            ) : (
              <p>{it.answer}</p>
            )}
          </div>
        </details>
      ))}

      <style jsx>{`
        .faq-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item {
          border: 1px solid var(--tp-grey-2);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
          background: var(--tp-common-white);
        }

        .faq-item:hover {
          border-color: var(--tp-theme-primary);
          box-shadow: 0 4px 12px rgba(44, 76, 151, 0.08);
        }

        .faq-item[open] {
          border-color: var(--tp-theme-primary);
          box-shadow: 0 6px 16px rgba(44, 76, 151, 0.12);
        }

        .faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 18px;
          cursor: pointer;
          font-family: var(--tp-ff-jost);
          font-size: 15px;
          font-weight: 700;
          color: var(--tp-text-1);
          list-style: none;
        }

        .faq-question::-webkit-details-marker {
          display: none;
        }

        .question-text {
          flex: 1;
          padding-right: 12px;
        }

        .faq-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          border-radius: 8px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .faq-item[open] .faq-icon {
          background: var(--tp-theme-secondary);
          transform: rotate(45deg);
        }

        .faq-answer {
          padding: 0 18px 18px 18px;
          font-family: var(--tp-ff-roboto);
          font-size: 14px;
          line-height: 1.7;
          color: var(--tp-text-2);
        }

        .faq-answer p {
          margin: 0;
        }

        @media (max-width: 768px) {
          .faq-question {
            padding: 16px;
            font-size: 14px;
          }
          .faq-answer {
            padding: 0 16px 16px 16px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
export default function DetailsTabNav({ product = {} }) {
  const { description, productdescription, slug, _id } = product;

  /* ─── fallback fetch if product prop missing fields ─── */
  const { data: singleResp } = useGetSingleProductQuery(_id, { skip: !_id });
  const singleById = singleResp?.data || singleResp?.product || singleResp;

  /* ─── fetch website FAQs ─── */
  const { data: websiteFaqsResp, isLoading: websiteFaqsLoading } = useGetWebsiteFaqsQuery();

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

    if (!singleById && slug) fetchBySlug();
    return () => {
      cancel = true;
    };
  }, [slug, singleById, API_BASE, API_KEY]);

  const full = singleById || singleBySlug || {};

  // ✅ description (fallback chain)
  const fullDescription =
    pick(
      product?.fullProductDescription,
      full?.fullProductDescription,
      product?.description,
      product?.productdescription,
      description,
      productdescription
    ) || '';

  /* ---------------- FAQ data (product + website) ---------------- */
  const productFaqs = useMemo(() => {
    const src = full && Object.keys(full).length ? full : product;
    const items = [];

    for (let i = 1; i <= 6; i++) {
      const q = src?.[`productQ${i}`] || src?.[`productquestion${i}`];
      const a = src?.[`productA${i}`] || src?.[`productanswer${i}`];
      if (!nonEmpty(q) || !nonEmpty(a)) continue;

      const qStr = String(q);
      const aStr = String(a);

      items.push({
        key: `p-${i}`,
        question: qStr,
        answer: aStr,
        questionIsHtml: /<[a-z][\s\S]*>/i.test(qStr),
        answerIsHtml: /<[a-z][\s\S]*>/i.test(aStr),
      });
    }
    return items;
  }, [product, full]);

  /* ─── website FAQs processing ─── */
  const websiteFaqs = useMemo(() => {
    if (websiteFaqsLoading || !websiteFaqsResp) return [];
    
    const faqs = Array.isArray(websiteFaqsResp) ? websiteFaqsResp : [websiteFaqsResp];
    const items = [];

    faqs.forEach((faq, faqIndex) => {
      for (let i = 1; i <= 4; i++) {
        const q = faq?.[`question${i}`];
        const a = faq?.[`answer${i}`];
        if (!nonEmpty(q) || !nonEmpty(a)) continue;

        const qStr = String(q);
        const aStr = String(a);

        items.push({
          key: `w-${faqIndex}-${i}`,
          question: qStr,
          answer: aStr,
          questionIsHtml: /<[a-z][\s\S]*>/i.test(qStr),
          answerIsHtml: /<[a-z][\s\S]*>/i.test(aStr),
        });
      }
    });
    return items;
  }, [websiteFaqsResp, websiteFaqsLoading]);

  // Merge website FAQs first, then product FAQs
  const mergedFaqs = useMemo(() => [...websiteFaqs, ...productFaqs], [websiteFaqs, productFaqs]);

  return (
    <div className="product-details-modern">
      <div className="hero-section">
        <div className="container-fluid">
          <div className="row">
            {/* Left Column - Description */}
            <div className="col-lg-8 col-md-12">
              <div className="left-grid">
                <div className="grid-section description-section">
                  <div className="panel-header">
                    <span className="badge">Product Overview</span>
                    <h2 className="panel-title">Description</h2>
                  </div>

                  <div className="description-body">
                    {/<[a-z][\s\S]*>/i.test(fullDescription) ? (
                      <div
                        className="rich-content"
                        dangerouslySetInnerHTML={{ __html: fullDescription }}
                      />
                    ) : (
                      <p className="simple-content">
                        {fullDescription || 'No description available for this product.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - FAQ */}
            <div className="col-lg-4 col-md-12">
              <div className="right-grid">
                <div className="grid-section faq-section">
                  <div className="panel-header">
                    <span className="badge badge-support">Support</span>
                    <h2 className="panel-title">FAQ</h2>
                  </div>

                  <div className="faq-body">
                    <FaqBlock items={mergedFaqs} isLoading={websiteFaqsLoading} />
                  </div>
                </div>
              </div>
            </div>
            {/* end row */}
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-details-modern {
          margin-top: 40px;
        }

        .hero-section {
          padding: 32px 0;
        }

        .left-grid,
        .right-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
        }

        .grid-section {
          background: var(--tp-common-white);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(15, 34, 53, 0.06);
          border: 1px solid var(--tp-grey-2);
          transition: all 0.2s ease;
        }

        .grid-section:hover {
          box-shadow: 0 4px 16px rgba(15, 34, 53, 0.08);
          border-color: var(--tp-grey-3);
        }

        .description-section {
          min-height: 320px;
        }

        .faq-section {
          min-height: 320px;
        }

        .panel-header {
          margin-bottom: 18px;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          border-radius: 999px;
          margin-bottom: 8px;
          font-family: var(--tp-ff-jost);
          letter-spacing: 0.4px;
        }

        .badge-support {
          background: var(--tp-theme-secondary);
        }

        .panel-title {
          font-family: var(--tp-ff-jost);
          font-size: 22px;
          font-weight: 800;
          color: var(--tp-text-1);
          margin: 0;
        }

        .description-body {
          overflow-y: auto;
          max-height: 520px;
        }

        .rich-content,
        .simple-content {
          font-family: var(--tp-ff-roboto);
          font-size: 15px;
          line-height: 1.7;
          color: var(--tp-text-2);
          margin: 0;
        }

        .faq-body {
          overflow-y: auto;
          max-height: 520px;
        }

        @media (max-width: 992px) {
          .left-grid,
          .right-grid {
            gap: 16px;
          }
          .grid-section {
            padding: 20px;
          }
          .description-section,
          .faq-section {
            min-height: auto;
          }
          .description-body,
          .faq-body {
            max-height: 360px;
          }
        }

        @media (max-width: 480px) {
          .grid-section {
            padding: 16px;
          }
          .panel-title {
            font-size: 20px;
          }
          .rich-content,
          .simple-content {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
