import Wrapper       from '@/layout/wrapper';
import HeaderTwo     from '@/layout/headers/header-2';
import Footer        from '@/layout/footers/footer';
import ProductClient from './ProductDetailsClient';
import { generateMetadata as generateSEOMetadata } from '@/utils/seo';
import { generateProductStructuredData } from '@/utils/productStructuredData';
import { BreadcrumbJsonLd } from '@/utils/breadcrumbStructuredData';
import { FaqJsonLd } from '@/utils/faqStructuredData';
import { CollectionItemListJsonLd } from '@/utils/collectionItemListStructuredData';
import ProductStructuredDataHeadClient from '@/components/seo/ProductStructuredDataHead.client';

// ─── ISR: revalidate every 10 minutes ──────────────────────────────────────
// Pages are served from static cache and regenerated in the background
// after 600s have elapsed since the last build/revalidation.
export const revalidate = 600;

// ─── Tells Next.js to return 404 for any slug NOT found in generateStaticParams
// instead of rendering a fallback on-demand. Set to false if you want
// on-demand rendering for slugs that appear after the last build.
export const dynamicParams = true; // true = ISR on-demand for new slugs

/* ─── helpers ────────────────────────────────────────────────────────────── */
const pick = (...v) => v.find(x => x !== undefined && x !== null && String(x).trim() !== '');
const stripTrailingSlash = (s = '') => String(s || '').replace(/\/+$/, '');
const stripHtml = (html = '') =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const API_BASE = stripTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL || '');

/* ─── Shared product fetcher ─────────────────────────────────────────────── */
async function getAllProducts() {
  try {
    const res = await fetch(`${API_BASE}/product?limit=500`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const j = await res.json();

    if (j?.success && Array.isArray(j.data)) return j.data;
    if (Array.isArray(j?.products)) return j.products;
    if (Array.isArray(j)) return j;
    return [];
  } catch {
    return [];
  }
}

async function getProductBySlug(slug) {
  try {
    const cleanSlug = slug ? slug.replace(/#$/, '') : slug;
    const products = await getAllProducts();
    if (!products.length) return null;

    return products.find(p =>
      p?.productslug === cleanSlug ||
      p?.aiTempOutput  === cleanSlug ||
      p?.fabricCode    === cleanSlug ||
      p?.id            === cleanSlug
    ) || null;
  } catch {
    return null;
  }
}

/* ─── generateStaticParams ───────────────────────────────────────────────────
   Pre-builds every product page at build time so the FIRST visitor always
   gets a fully-rendered, CDN-cached HTML page with zero extra latency.
   New products added after build are handled by on-demand ISR (dynamicParams = true).
────────────────────────────────────────────────────────────────────────────── */
export async function generateStaticParams() {
  try {
    const products = await getAllProducts();
    const slugs = [];

    for (const product of products) {
      const slug =
        product?.productslug ||
        product?.aiTempOutput ||
        product?.fabricCode ||
        product?.id;

      if (slug && typeof slug === 'string') {
        slugs.push({ slug });
      }
    }

    return slugs;
  } catch {
    // If the API is unreachable at build time, fall back to zero pre-built pages.
    // All pages will still be generated on-demand via ISR.
    return [];
  }
}

/* ─── Website FAQs ────────────────────────────────────────────────────────── */
async function getWebsiteFaqs() {
  try {
    const res = await fetch(`${API_BASE}/websitefaq`, { next: { revalidate } });
    if (!res.ok) return [];
    const j = await res.json();
    if (j?.success && j?.data) return Array.isArray(j.data) ? j.data : [j.data];
    if (Array.isArray(j)) return j;
    return j?.data || [];
  } catch {
    return [];
  }
}

/* ─── Collection Products ─────────────────────────────────────────────────── */
async function getCollectionProducts(collectionId) {
  if (!collectionId || String(collectionId).trim() === '') return [];
  try {
    const products = await getAllProducts();
    return products.filter(p =>
      p.collectionId   === collectionId ||
      p.collection     === collectionId ||
      p.collection_id  === collectionId
    );
  } catch {
    return [];
  }
}

/* ─── Metadata ────────────────────────────────────────────────────────────── */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const fallbackTitle = String(slug || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const title       = pick(product?.productTitle, product?.name, fallbackTitle);
  const description = stripHtml(pick(product?.shortProductDescription, product?.description, ''))
    || 'View detailed information about our premium fabric products.';

  const productKeywords = product?.keywords || [];
  const keywordsString  = Array.isArray(productKeywords)
    ? productKeywords.join(', ')
    : productKeywords || 'fabric, textile, premium quality, materials';

  const ogImageUrl = pick(product?.image1CloudUrlWeb, product?.image1, product?.img, product?.image, '');
  const robotsTag  = product ? 'index, follow' : 'noindex, nofollow';

  return generateSEOMetadata({
    title: `${title}`,
    description,
    keywords: keywordsString,
    path: `/fabric/${slug}`,
    ogImage: ogImageUrl,
    robots: robotsTag,
  });
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function Page({ params }) {
  const { slug } = await params;

  try {
    const [product, websiteFaqs] = await Promise.all([
      getProductBySlug(slug),
      getWebsiteFaqs(),
    ]);

    const collectionId = product?.collectionId || product?.collection?.id || product?.collection?._id || product?.collection || null;
    const collectionProducts = collectionId ? await getCollectionProducts(collectionId) : [];

    const productStructuredData = generateProductStructuredData(product);
    const productTitle          = pick(product?.productTitle, product?.name, 'Product Details');

    const breadcrumbStructuredData = [
      { name: 'Home',   url: '/' },
      { name: 'Fabric', url: '/fabric' },
      { name: productTitle, url: `/fabric/${slug}` },
    ];

    return (
      <>
        <ProductStructuredDataHeadClient productStructuredData={productStructuredData} />
        <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />
        <FaqJsonLd product={product} websiteFaqs={websiteFaqs} />
        <CollectionItemListJsonLd
          products={collectionProducts}
          currentProduct={product}
          collectionData={product?.collection}
        />
        <Wrapper>
          <HeaderTwo style_2 />
          <ProductClient slug={slug} initialProduct={product} />
          <Footer primary_style />
        </Wrapper>
      </>
    );
  } catch (error) {
    console.error('Error in fabric page:', error);
    return (
      <Wrapper>
        <HeaderTwo style_2 />
        <ProductClient slug={slug} />
        <Footer primary_style />
      </Wrapper>
    );
  }
}
