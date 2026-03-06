import SitemapPageClient from './SitemapPageClient';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

export const metadata = {
  title: 'Sitemap',
  description: 'Complete sitemap of all pages on Espo Shofy website. Find all products, blog posts, and important pages.',
  keywords: 'sitemap, website map, navigation, pages, products, blog',
  robots: 'index, follow',

  alternates: {
    canonical: `${baseUrl}/sitemap`,
  },
};

export default function SitemapPage() {
  return <SitemapPageClient />;
}
