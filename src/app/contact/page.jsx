import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import ContactBreadcrumb from "@/components/breadcrumb/contact-breadcrumb";
import ContactArea from "@/components/contact/contact-area";
import ContactMap from "@/components/contact/contact-map";
import Footer from "@/layout/footers/footer";
import { generateMetadata as generateSEOMetadata, getOptimizedLogoUrl } from "@/utils/seo";
import { BreadcrumbJsonLd } from "@/utils/breadcrumbStructuredData";
import { getPageSeoMetadata, PAGE_NAMES, fetchTopicPageByName } from "@/utils/topicPageSeoIntegration";
import { generateContactPageStructuredData } from "@/utils/contactPageStructuredData";

// Revalidate every 60 seconds
export const revalidate = 60;

/* -----------------------------
  Metadata (Dynamic SEO from Topic Page API)
----------------------------- */
export async function generateMetadata() {
  const logoUrl = getOptimizedLogoUrl();
  
  // Fetch SEO data from topic page API
  const topicMetadata = await getPageSeoMetadata(PAGE_NAMES.CONTACT, {
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
    path: "/contact",
    canonicalOverride: canonicalFromApi, // Use canonical from API
    ogImage: "/assets/img/logo/logo.svg",
    ogLogo: logoUrl,
    robots: "index, follow"
  });
}

export default async function ContactPage() {
  // Fetch topic page data for structured data
  const topicPageData = await fetchTopicPageByName(PAGE_NAMES.CONTACT);

  // Breadcrumb structured data
  const breadcrumbStructuredData = [
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' }
  ];

  // Generate ContactPage JSON-LD
  const contactPageJsonLd = generateContactPageStructuredData(topicPageData);

  return (
    <>
      {/* Breadcrumb JSON-LD */}
      <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />
      
      {/* ContactPage JSON-LD - Server-side rendered */}
      {contactPageJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageJsonLd) }}
        />
      )}
      
      <Wrapper>
       <HeaderTwo style_2={true} />
      {/* SEO-Optimized H1 for Contact Page */}
      <h1
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        Contact eCatalogue - Premium Fabric Supplier & Textile Experts
      </h1>
      <ContactBreadcrumb />
      <ContactArea />
      <ContactMap />
      <Footer primary_style={true} />
      </Wrapper>
    </>
  );
}
