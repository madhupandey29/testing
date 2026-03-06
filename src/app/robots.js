export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/fabric',
          '/fabric/*',
          '/capabilities',
          '/blog',
          '/blog-details/*',
          '/contact',
          '/about',
          '/shop-category',
          '/shop-right-sidebar',
          '/shop-hidden-sidebar',
          '/search',
          '/_next/static/*',
          '/_next/image',
        ],
        disallow: [
          '/api/*',
          '/admin/*',
          '/checkout',
          '/cart',
          '/wishlist',
          '/login',
          '/register',
          '/forgot',
          '/profile',
          '/compare',
          '/order/*',
          '/email-verify/*',
          '/forget-password/*',
          '/test-*',
          '/debug-*',
          '/redirect-*',
        ],
      },
    ],
    sitemap: `${baseUrl}sitemap.xml`,
    host: baseUrl,
  };
}
