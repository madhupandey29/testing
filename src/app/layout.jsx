import './globals.scss';
import '../styles/carousel-mobile-fix.css';
import '../styles/security-protection.css';
import '../styles/safe-responsive-fixes.css';
import Providers from '@/components/provider';
import ErrorBoundary from '@/components/ErrorBoundary';
import Script from 'next/script';
import { Inter, Poppins } from 'next/font/google';

// Optimize Google Fonts with next/font (self-hosted, no render blocking)
// Reduced font weights for better performance (only keep commonly used weights)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Removed: 300, 500, 800
  display: 'swap',
  variable: '--font-inter',
  preload: true,
   adjustFontFallback: false,
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Removed: 500, 800
  display: 'swap',
  variable: '--font-poppins',
  preload: true,
   adjustFontFallback: false,
});

// Separate viewport export (required for Next.js 14+)
export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
};

// Favicon and app metadata
export const metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#5bbad5' },
    ],
  },
  manifest: '/manifest.webmanifest',
};

const stripTrailingSlash = (s = '') => String(s || '').replace(/\/+$/, '');

// ✅ Fetch SiteSettings and pick record where name === "eCatalogue"
async function getEcatalogueSiteSettings() {
  try {
    const apiBaseUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL);
    if (!apiBaseUrl) return null;

    const res = await fetch(`${apiBaseUrl}/sitesettings`, {
      next: { revalidate: 300 }, // 5 min cache
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];

    const target = list.find((x) => String(x?.name || '').toLowerCase() === 'ecatalogue');
    return target || null;
  } catch (e) {
    console.error('Failed to fetch sitesettings for analytics:', e);
    return null;
  }
}

export default async function RootLayout({ children }) {
  // Server-side data fetching for structured data
  let companyInfo = null;
  let siteSettings = null;

  // ✅ NEW: used ONLY for GA + Clarity IDs
  const ecatalogueSettings = await getEcatalogueSiteSettings();

  try {
    // Fetch company information
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const companyFilter = process.env.NEXT_PUBLIC_COMPANY_FILTER;

    if (apiBaseUrl && companyFilter) {
      const response = await fetch(`${stripTrailingSlash(apiBaseUrl)}/companyinformation`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const targetCompany = data.data.find((company) => company.name === companyFilter);
          if (targetCompany) {
            companyInfo = targetCompany;
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch company info for structured data:', error);
  }

  // Generate structured data
  let corporationJsonLd = null;
  let websiteJsonLd = null;

  if (companyInfo) {
    try {
      const { generateCorporationStructuredData } = await import('@/utils/corporationStructuredData');
      const { generateWebsiteStructuredData } = await import('@/utils/websiteStructuredData');

      corporationJsonLd = generateCorporationStructuredData(companyInfo, siteSettings);
      websiteJsonLd = generateWebsiteStructuredData(companyInfo, siteSettings);
    } catch (error) {
      console.error('Failed to generate structured data:', error);
    }
  }

  const defaultSeoSettings = {
    gtmId: process.env.NEXT_PUBLIC_GTM_ID,
  };

  // =========================================================
  // ✅ ONLY CHANGE: Analytics IDs now prefer SiteSettings
  // =========================================================
  const gaId = ecatalogueSettings?.gaMeasurementId || process.env.NEXT_PUBLIC_GA_ID;
  const clarityId = ecatalogueSettings?.clarityId || process.env.NEXT_PUBLIC_CLARITY_ID;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable}`}
      data-env={process.env.NODE_ENV === 'production' ? 'production' : 'development'}
    >
      <head>
        {/* Google Analytics */}
        {gaId && (
          <>
            {/* ✅ beforeInteractive so it appears in View Page Source */}
            <Script strategy="beforeInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <Script
              id="ga-script"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', { anonymize_ip: true, send_page_view: true });
                `,
              }}
            />
          </>
        )}

        {/* Microsoft Clarity */}
        {clarityId && (
          <Script
            id="clarity-script"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityId}");
              `,
            }}
          />
        )}

        {/* Google Tag Manager */}
        {defaultSeoSettings?.gtmId && (
          <>
            {/* GTM ID: {defaultSeoSettings.gtmId} */}
            <Script
              id="gtm-script"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${defaultSeoSettings.gtmId}');
                `,
              }}
            />
          </>
        )}

        {/* ============================================ */}
        {/* JSON-LD STRUCTURED DATA                     */}
        {/* ============================================ */}

        {/* Corporation JSON-LD - Global for all pages */}
        {corporationJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(corporationJsonLd) }} />
        )}

        {/* WebSite JSON-LD with SearchAction - Global for all pages */}
        {websiteJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        )}
      </head>

      <body>
        {/* Simplified Chunk Load Error Handler Script */}
        <Script
          id="chunk-error-handler"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Simplified Chunk Load Error Handler
              (function() {
                let retryCount = 0;
                const MAX_RETRIES = 1;

                function handleChunkError(error) {
                  // Only handle actual chunk loading errors, not CSS/JS confusion
                  const isChunkError = error?.name === 'ChunkLoadError' || 
                                      (error?.message?.includes('Loading chunk') && 
                                       !error?.message?.includes('.css'));

                  if (!isChunkError || retryCount >= MAX_RETRIES) return false;

                  retryCount++;
                  console.warn('Chunk load error detected, reloading page...');

                  setTimeout(function() {
                    window.location.reload();
                  }, 500);

                  return true;
                }

                // Only handle unhandled promise rejections for chunk errors
                window.addEventListener('unhandledrejection', function(event) {
                  if (handleChunkError(event.reason)) {
                    event.preventDefault();
                  }
                });

                // Reset retry count on navigation
                window.addEventListener('beforeunload', function() {
                  retryCount = 0;
                });
              })();
            `,
          }}
        />

        {/* Google Tag Manager (noscript) from default SEO settings */}
        {defaultSeoSettings?.gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${defaultSeoSettings.gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
