/**
 * Sitemap Management Utilities
 * Provides functions for dynamic sitemap generation and management
 */

export class SitemapManager {
  constructor(baseUrl, apiBaseUrl) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://amrita-fashions.com';
    this.apiBaseUrl = apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';
    
    // Ensure baseUrl doesn't end with slash
    this.baseUrl = this.baseUrl.replace(/\/$/, '');
  }

  /**
   * Get all static routes from the app directory
   * Only includes active pages that should be indexed
   * ✅ CLEANED: Removed unused shop variants and blog-grid
   */
  getStaticRoutes() {
    const staticRoutes = [
      { path: '/', priority: 1.0, changeFreq: 'daily' },
      { path: '/fabric', priority: 0.9, changeFreq: 'daily' }, // Main shop page
      { path: '/capabilities', priority: 0.8, changeFreq: 'monthly' }, // Capabilities page
      { path: '/blog', priority: 0.8, changeFreq: 'weekly' }, // Main blog page
      { path: '/contact', priority: 0.7, changeFreq: 'monthly' },
      { path: '/about', priority: 0.6, changeFreq: 'monthly' },
      // ❌ REMOVED: /shop-category, /shop-right-sidebar, /shop-hidden-sidebar, /blog-grid (not in use)
      // Excluded from sitemap: /cart, /wishlist, /login, /profile, /search, /register, /forgot, /compare
    ];

    return staticRoutes.map(route => ({
      url: `${this.baseUrl}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFreq,
      priority: route.priority,
    }));
  }

  /**
   * Fetch dynamic product pages
   */
  async getProductPages() {
    try {
      let apiUrl = this.apiBaseUrl;
      if (!apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.replace(/\/$/, '') + '/api';
      }
      
      const response = await fetch(`${apiUrl}/product/?limit=200`, {
        next: { revalidate: 300 },
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      if (!data.success || !data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data
        .filter(product => product.productslug || product.slug)
        .map(product => ({
          url: `${this.baseUrl}/fabric/${product.productslug || product.slug}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));

    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch dynamic blog pages from API
   * ✅ UPDATED: Fetch from API instead of static data, only use blog-details (not blog-details-2)
   */
  async getBlogPages() {
    try {
      // Fetch blogs from API
      let apiUrl = this.apiBaseUrl;
      if (!apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.replace(/\/$/, '') + '/api';
      }
      
      const blogPath = process.env.NEXT_PUBLIC_API_BLOG_PATH || '/blog';
      const response = await fetch(`${apiUrl}${blogPath}`, {
        next: { revalidate: 300 },
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      if (!data.success || !data.data || !Array.isArray(data.data)) {
        return [];
      }

      // ✅ Only use /blog-details/[slug] (removed blog-details-2)
      return data.data
        .filter(blog => blog.slug || blog._id || blog.id)
        .map(blog => {
          // Extract slug from URL if it's a full URL, otherwise use as-is
          let slug = blog.slug || blog._id || blog.id;
          if (slug && slug.includes('http')) {
            const urlParts = slug.split('/');
            slug = urlParts[urlParts.length - 1] || blog._id || blog.id;
          }
          
          return {
            url: `${this.baseUrl}/blog-details/${slug}`,
            lastModified: blog.updatedAt ? new Date(blog.updatedAt) : (blog.createdAt ? new Date(blog.createdAt) : new Date()),
            changeFrequency: 'monthly',
            priority: 0.6,
          };
        });

    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch category pages
   */
  async getCategoryPages() {
    try {
      let apiUrl = this.apiBaseUrl;
      if (!apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.replace(/\/$/, '') + '/api';
      }
      
      const response = await fetch(`${apiUrl}/category/view`, {
        next: { revalidate: 300 },
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data
        .filter(category => category.slug || category.name)
        .map(category => ({
          url: `${this.baseUrl}/shop-category?category=${encodeURIComponent(category.slug || category.name)}`,
          lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        }));

    } catch (error) {
      return [];
    }
  }

  /**
   * Generate complete sitemap
   */
  async generateSitemap() {
    const [staticPages, productPages, blogPages, categoryPages] = await Promise.all([
      this.getStaticRoutes(),
      this.getProductPages(),
      this.getBlogPages(),
      this.getCategoryPages(),
    ]);

    const allPages = [
      ...staticPages,
      ...productPages,
      ...blogPages,
      ...categoryPages,
    ];

    // Remove duplicates
    const uniquePages = this.removeDuplicates(allPages);

    // Sort by priority and date
    uniquePages.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.lastModified) - new Date(a.lastModified);
    });

    return uniquePages;
  }

  /**
   * Remove duplicate URLs
   */
  removeDuplicates(pages) {
    const seen = new Set();
    return pages.filter(page => {
      if (seen.has(page.url)) {
        return false;
      }
      seen.add(page.url);
      return true;
    });
  }

  /**
   * Get sitemap statistics
   */
  getStats(pages) {
    return {
      total: pages.length,
      static: pages.filter(p => this.isStaticPage(p.url)).length,
      products: pages.filter(p => p.url.includes('/fabric/')).length,
      blogs: pages.filter(p => p.url.includes('/blog-details')).length,
      categories: pages.filter(p => p.url.includes('category=')).length,
    };
  }

  /**
   * Check if a URL is a static page
   */
  isStaticPage(url) {
    const path = url.replace(this.baseUrl, '');
    const staticPaths = ['/', '/fabric', '/capabilities', '/blog', '/contact', '/about'];
    
    return staticPaths.includes(path) || 
           path.startsWith('/fabric-') || 
           path.includes('/blog') ||
           path.includes('/blog-details') ;
  }
}

export default SitemapManager;