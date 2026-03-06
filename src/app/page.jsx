// app/page.jsx
import HomePageTwoClient from "./HomePageTwoClient";
import { getPageSeoMetadata, PAGE_NAMES } from "@/utils/topicPageSeoIntegration";
import { generateMetadata as generateSEOMetadata, getOptimizedLogoUrl } from "@/utils/seo";

// Revalidate every 60 seconds
export const revalidate = 60;

export async function generateMetadata() {
  const logoUrl = getOptimizedLogoUrl();
  
  // Fetch SEO data from topic page API
  const topicMetadata = await getPageSeoMetadata(PAGE_NAMES.HOME, {
    title: null,
    description: null,
    keywords: null,
  });

  // Extract canonical URL from the metadata object
  const canonicalFromApi = topicMetadata.alternates?.canonical || null;

  // Merge with existing SEO metadata structure
  return generateSEOMetadata({
    title: topicMetadata.title,
    description: topicMetadata.description,
    keywords: topicMetadata.keywords,
    path: "/",
    canonicalOverride: canonicalFromApi, // Use canonical from API
    ogImage: "/assets/img/logo/logo.svg",
    ogLogo: logoUrl,
    robots: "index, follow"
  });
}

export default function Page() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.amrita-fashions.com").replace(/\/+$/, "");
  
  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/#home`,
    "url": `${siteUrl}/`,
    "name": "Home",
    "isPartOf": { "@id": `${siteUrl}/#website` },
    "about": { "@id": `${siteUrl}/#org` },
    "inLanguage": "en",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HomePageTwoClient />
    </>
  );
}
