'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiHome, FiFileText, FiTrendingUp
} from 'react-icons/fi';
import { 
  FaSitemap
} from 'react-icons/fa';
import Wrapper from '@/layout/wrapper';
import HeaderTwo from '@/layout/headers/header-2';
import Footer from '@/layout/footers/footer';
import styles from './sitemap.module.scss';

const SitemapPageClient = () => {
  const [sitemapData, setSitemapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    fetchSitemapData();
  }, []);

  const fetchSitemapData = async () => {
    try {
      setLoading(true);
      
      // Fetch sitemap data from your sitemap manager
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      
      // Import the SitemapManager dynamically
      const { SitemapManager } = await import('@/utils/sitemap-manager');
      const sitemapManager = new SitemapManager(baseUrl, apiBaseUrl);
      
      const data = await sitemapManager.generateSitemap();
      
      setSitemapData(data);
    } catch (error) {
      // Log error for debugging and use fallback data
      console.error('Failed to fetch sitemap data:', error);
      // Enhanced fallback data with more realistic examples
      const fallbackOrigin = process.env.NEXT_PUBLIC_SITE_URL;
      const fallbackData = [
        { 
          url: fallbackOrigin + '/', 
          priority: 1.0, 
          changeFrequency: 'daily', 
          lastModified: new Date(),
          title: 'Home Page',
          description: 'Main landing page showcasing our textile products and services'
        },
        { 
          url: fallbackOrigin + '/fabric', 
          priority: 0.9, 
          changeFrequency: 'daily', 
          lastModified: new Date(),
          title: 'Fabric Collection',
          description: 'Browse our complete collection of textile products'
        },
        { 
          url: fallbackOrigin + '/about', 
          priority: 0.8, 
          changeFrequency: 'monthly', 
          lastModified: new Date(),
          title: 'About Us',
          description: 'Learn about our company history and values'
        },
        { 
          url: fallbackOrigin + '/capabilities', 
          priority: 0.8, 
          changeFrequency: 'monthly', 
          lastModified: new Date(),
          title: 'Our Capabilities',
          description: 'Discover our manufacturing capabilities and processes'
        },
        { 
          url: fallbackOrigin + '/blog', 
          priority: 0.7, 
          changeFrequency: 'weekly', 
          lastModified: new Date(),
          title: 'Blog',
          description: 'Latest news and insights from the textile industry'
        },
        { 
          url: fallbackOrigin + '/contact', 
          priority: 0.7, 
          changeFrequency: 'monthly', 
          lastModified: new Date(),
          title: 'Contact Us',
          description: 'Get in touch with our team'
        },
        { 
          url: fallbackOrigin + '/fabric/cotton-fabric', 
          priority: 0.8, 
          changeFrequency: 'weekly', 
          lastModified: new Date(),
          title: 'Cotton Fabric',
          description: 'Premium cotton fabric collection'
        },
        { 
          url: fallbackOrigin + '/fabric/silk-fabric', 
          priority: 0.8, 
          changeFrequency: 'weekly', 
          lastModified: new Date(),
          title: 'Silk Fabric',
          description: 'Luxurious silk fabric varieties'
        },
        { 
          url: fallbackOrigin + '/fabric/polyester-fabric', 
          priority: 0.8, 
          changeFrequency: 'weekly', 
          lastModified: new Date(),
          title: 'Polyester Fabric',
          description: 'Durable polyester fabric options'
        },
        { 
          url: fallbackOrigin + '/blog-details/textile-trends-2024', 
          priority: 0.6, 
          changeFrequency: 'monthly', 
          lastModified: new Date(),
          title: 'Textile Trends 2024',
          description: 'Latest trends in the textile industry'
        },
        { 
          url: fallbackOrigin + '/blog-details/sustainable-manufacturing', 
          priority: 0.6, 
          changeFrequency: 'monthly', 
          lastModified: new Date(),
          title: 'Sustainable Manufacturing',
          description: 'Our commitment to sustainable practices'
        },
        { 
          url: fallbackOrigin + '/shop-category', 
          priority: 0.7, 
          changeFrequency: 'daily', 
          lastModified: new Date(),
          title: 'Shop by Category',
          description: 'Browse products by category'
        },
        { 
          url: fallbackOrigin + '/cart', 
          priority: 0.5, 
          changeFrequency: 'daily', 
          lastModified: new Date(),
          title: 'Shopping Cart',
          description: 'Review your selected items'
        },
        { 
          url: fallbackOrigin + '/wishlist', 
          priority: 0.5, 
          changeFrequency: 'daily', 
          lastModified: new Date(),
          title: 'Wishlist',
          description: 'Save your favorite products'
        },
        { 
          url: fallbackOrigin + '/login', 
          priority: 0.4, 
          changeFrequency: 'monthly', 
          lastModified: new Date(),
          title: 'Login',
          description: 'Access your account'
        },
        { 
          url: fallbackOrigin + '/register', 
          priority: 0.4, 
          changeFrequency: 'monthly', 
          lastModified: new Date(),
          title: 'Register',
          description: 'Create a new account'
        }
      ];
      
      setSitemapData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const getPageCategory = (url) => {
    if (url === '/' || url.endsWith('/')) return 'home';
    if (url.includes('/about')) return 'about';
    if (url.includes('/contact')) return 'contact';
    if (url.includes('/capabilities')) return 'capabilities';
    if (url.includes('/fabric/') || url.includes('/product/')) return 'products';
    if (url.includes('/blog')) return 'blog';
    if (url.includes('/cart') || url.includes('/wishlist') || url.includes('/checkout')) return 'products';
    return 'products';
  };

  const organizePagesBySection = (pages) => {
    const sections = {
      home: {
        title: 'Home',
        pages: [],
        mainUrl: '/'
      },
      about: {
        title: 'About',
        pages: [],
        mainUrl: '/about'
      },
      contact: {
        title: 'Contact',
        pages: [],
        mainUrl: '/contact'
      },
      capabilities: {
        title: 'Capabilities',
        pages: [],
        mainUrl: '/capabilities'
      },
      products: {
        title: 'Products',
        pages: [],
        mainUrl: '/fabric'
      },
      blog: {
        title: 'Blog',
        pages: [],
        mainUrl: '/blog'
      }
    };

    // Track URLs to avoid duplicates
    const seenUrls = new Set();

    pages.forEach(page => {
      const category = getPageCategory(page.url);
      const cleanUrl = page.url.replace(process.env.NEXT_PUBLIC_SITE_URL || '', '') || '/';
      const pageTitle = page.title || getPageTitle(page.url);
      
      // Skip duplicates
      if (seenUrls.has(cleanUrl)) {
        return;
      }
      seenUrls.add(cleanUrl);
      
      // Skip main section URLs - they will be shown as section headers only
      const mainUrls = ['/', '/about', '/contact', '/capabilities', '/fabric', '/blog'];
      if (mainUrls.includes(cleanUrl)) {
        return;
      }
      
      // Skip entries that have the same title as their section (duplicates)
      if (category === 'about' && (pageTitle === 'About' || pageTitle === 'About Us')) {
        return;
      }
      if (category === 'contact' && (pageTitle === 'Contact' || pageTitle === 'Contact Us')) {
        return;
      }
      if (category === 'capabilities' && (pageTitle === 'Capabilities' || pageTitle === 'Our Capabilities')) {
        return;
      }
      if (category === 'products' && (pageTitle === 'Fabric' || pageTitle === 'Fabric Collection')) {
        return;
      }
      if (category === 'blog' && (pageTitle === 'Blog')) {
        return;
      }
      
      if (sections[category]) {
        sections[category].pages.push(page);
      }
    });

    return sections;
  };

  const getSectionMainUrl = (sectionKey) => {
    const sectionUrls = {
      home: '/',
      about: '/about',
      contact: '/contact',
      capabilities: '/capabilities',
      products: '/fabric',
      blog: '/blog'
    };
    return sectionUrls[sectionKey] || '/';
  };

  const copyToClipboard = async (text, buttonElement) => {
    try {
      await navigator.clipboard.writeText(text);
      const originalText = buttonElement.textContent;
      buttonElement.textContent = '✓';
      buttonElement.style.background = '#34a853';
      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.style.background = '';
      }, 1000);
    } catch (err) {
      // Silently fail - clipboard API may not be available
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getPageTitle = (url) => {
    const fallbackOrigin = process.env.NEXT_PUBLIC_SITE_URL;
    const path = url.replace(process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin, '');
    
    if (path.includes('/fabric/')) {
      const slug = path.split('/fabric/')[1];
      // Remove "Fabric/" prefix and format the title
      return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    if (path.includes('/blog-details/')) {
      const slug = path.split('/blog-details/')[1];
      // Remove "Blog Details/" prefix and format the title
      return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return path.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Home';
  };

  const getFileSize = (pages) => {
    const baseSize = pages.length * 2.5;
    return baseSize > 1000 ? `${(baseSize / 1000).toFixed(1)} MB` : `${baseSize} KB`;
  };

  const filteredData = sitemapData;
  const organizedSections = organizePagesBySection(filteredData);

  if (loading) {
    return (
      <Wrapper>
        <HeaderTwo style_2 />
        <div className={styles.sitemapContainer}>
          <div className="container mx-auto px-4">
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading sitemap data...</p>
            </div>
          </div>
        </div>
        <Footer primary_style />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <HeaderTwo style_2 />
      
      <div className={styles.sitemapContainer}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className="container">
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <FaSitemap className={styles.badgeIcon} />
                Interactive Site Map
              </div>
              <h1 className={styles.heroTitle}>
                Website <span className={styles.gradientText}>Sitemap</span>
              </h1>
              <p className={styles.heroDesc}>
                Complete overview of all pages and sections on our website.
              </p>
            </div>
          </div>
        </div>

        <div className="container-fluid px-4">
          {/* Simple Column Layout like Shopify */}
          <div className={styles.sitemapGrid}>
            {Object.entries(organizedSections).map(([sectionKey, section]) => {
              const filteredPages = section.pages || [];
              
              // Always show section even if no sub-pages
              return (
                <div key={sectionKey} className={styles.sitemapColumn}>
                  <Link 
                    href={section.mainUrl || getSectionMainUrl(sectionKey)} 
                    className={styles.columnTitleLink}
                  >
                    <h3 className={styles.columnTitle}>{section.title}</h3>
                  </Link>
                  {filteredPages.length > 0 && (
                    <ul className={styles.linksList}>
                      {sectionKey === 'products' ? (
                        <>
                          {filteredPages.slice(0, showAllProducts ? filteredPages.length : 5).map((page, index) => (
                            <li key={index} className={styles.linkItem}>
                              <Link
                                href={page.url.replace(process.env.NEXT_PUBLIC_SITE_URL, '') || '/'}
                                className={styles.sitemapLink}
                              >
                                {(() => {
                                  let title = page.title || getPageTitle(page.url);
                                  // Remove "Fabric/" prefix from product titles
                                  if (title.startsWith('Fabric/')) {
                                    title = title.replace('Fabric/', '');
                                  }
                                  // Remove "Blog Details/" prefix from blog titles
                                  if (title.startsWith('Blog Details/')) {
                                    title = title.replace('Blog Details/', '');
                                  }
                                  return title;
                                })()}
                              </Link>
                            </li>
                          ))}
                          {filteredPages.length > 5 && (
                            <li className={styles.linkItem}>
                              <button 
                                onClick={() => setShowAllProducts(!showAllProducts)}
                                className={styles.showMoreBtn}
                              >
                                {showAllProducts ? 'Show Less' : `Show More (${filteredPages.length - 5} more)`}
                              </button>
                            </li>
                          )}
                        </>
                      ) : (
                        // Show all links for all other sections including Blog
                        filteredPages.map((page, index) => (
                          <li key={index} className={styles.linkItem}>
                            <Link
                              href={page.url.replace(process.env.NEXT_PUBLIC_SITE_URL, '') || '/'}
                              className={styles.sitemapLink}
                            >
                              {(() => {
                                let title = page.title || getPageTitle(page.url);
                                // Remove "Fabric/" prefix from product titles
                                if (title.startsWith('Fabric/')) {
                                  title = title.replace('Fabric/', '');
                                }
                                // Remove "Blog Details/" prefix from blog titles
                                if (title.startsWith('Blog Details/')) {
                                  title = title.replace('Blog Details/', '');
                                }
                                return title;
                              })()}
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className={styles.footerActions}>
            <div className={styles.actionGroup}>
              <Link
                href={`${process.env.NEXT_PUBLIC_SITE_URL}sitemap.xml`}
                target="_blank"
                className={styles.actionButton}
              >
                <FiFileText />
                XML Sitemap
              </Link>
              
              <button
                onClick={fetchSitemapData}
                className={styles.actionButton}
              >
                <FiTrendingUp />
                Refresh Data
              </button>

              <Link
                href="/"
                className={styles.actionButton}
              >
                <FiHome />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer primary_style />
    </Wrapper>
  );
};

export default SitemapPageClient;