import Head from 'next/head';

const SEO = ({ pageTitle, description, keywords, ogImage, canonicalUrl }) => {
  const defaultTitle = "Premium Fabric Manufacturer | Quality Textiles";
  const defaultDescription = "Leading fabric manufacturer specializing in premium quality textiles for fashion, home décor, and industrial applications. Certified quality, global delivery.";
  const defaultKeywords = "fabric manufacturer, textile company, premium fabrics, cotton fabrics, polyester blends, quality textiles";
  const defaultOgImage = "/assets/img/logo/logo.svg";

  const title = pageTitle || defaultTitle;
  const desc = description || defaultDescription;
  const keys = keywords || defaultKeywords;
  const ogImg = ogImage || defaultOgImage;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content={keys} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImg} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImg} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
};

export default SEO;