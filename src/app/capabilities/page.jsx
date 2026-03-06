import React from 'react';
import Wrapper from '@/layout/wrapper';
import HeaderTwo from '@/layout/headers/header-2';
import Footer from '@/layout/footers/footer';
import CompactUniversalBreadcrumb from '@/components/breadcrumb/compact-universal-breadcrumb';
import { BreadcrumbJsonLd } from '@/utils/breadcrumbStructuredData';
import CapabilitiesClient from './CapabilitiesClient';
import { getPageSeoMetadata, PAGE_NAMES, fetchTopicPageByName } from '@/utils/topicPageSeoIntegration';
import { generateMetadata as generateSEOMetadata } from '@/utils/seo';
import { generateCapabilitiesPageStructuredData } from '@/utils/capabilitiesPageStructuredData';

// Revalidate every 60 seconds
export const revalidate = 60;

/* -----------------------------
  Metadata (Dynamic SEO from Topic Page API)
----------------------------- */
export async function generateMetadata() {
  // Fetch SEO data from topic page API
  const topicMetadata = await getPageSeoMetadata(PAGE_NAMES.CAPABILITIES, {
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
    path: "/capabilities",
    canonicalOverride: canonicalFromApi, // Use canonical from API
    ogImage: "/assets/img/logo/logo.svg",
    robots: "index, follow"
  });
}

const CapabilitiesPage = async () => {
  // Fetch topic page data for structured data
  const topicPageData = await fetchTopicPageByName(PAGE_NAMES.CAPABILITIES);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Capabilities' }
  ];

  // Breadcrumb structured data
  const breadcrumbStructuredData = [
    { name: 'Home', url: '/' },
    { name: 'Capabilities', url: '/capabilities' }
  ];

  // Generate Capabilities WebPage JSON-LD
  const capabilitiesPageJsonLd = generateCapabilitiesPageStructuredData(topicPageData);

  return (
    <>
      {/* Breadcrumb JSON-LD */}
      <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />
      
      {/* Capabilities WebPage JSON-LD - Server-side rendered */}
      {capabilitiesPageJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(capabilitiesPageJsonLd) }}
        />
      )}
      
      <Wrapper>
        {/* SEO component removed - using generateMetadata instead */}
        <HeaderTwo style_2={true} />
      <CompactUniversalBreadcrumb items={breadcrumbItems} />
      <CapabilitiesClient />
      <Footer primary_style={true} />
      </Wrapper>
    </>
  );
};

export default CapabilitiesPage;