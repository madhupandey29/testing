#!/usr/bin/env node

/**
 * Script to test and generate sitemap locally
 * Usage: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

// Mock Next.js environment
process.env.NODE_ENV = 'production';

// Load environment variables manually
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    }
}

async function generateSitemap() {
  try {
    // Load environment variables
    loadEnvFile();
    
    // Import the sitemap function
    const sitemapModule = await import('../src/app/sitemap.js');
    const sitemap = sitemapModule.default;
    
    // Generate sitemap data
    const sitemapData = await sitemap();
    
    // Group by type
    const stats = {
      static: sitemapData.filter(item => {
        const path = item.url.split('/').pop() || '/';
        return ['/', 'shop', 'blog', 'cart', 'wishlist', 'login', 'contact', 'register', 'checkout', 'compare', 'search', 'profile', 'coupon', 'forgot'].includes(path) ||
               item.url.includes('/fabric-') ||
               item.url.includes('/blog');
      }).length,
      products: sitemapData.filter(item => item.url.includes('/fabric/')).length,
      blogs: sitemapData.filter(item => item.url.includes('/blog-details')).length,
      categories: sitemapData.filter(item => item.url.includes('category=')).length,
    };
    
    // Convert to XML format
    const xmlContent = generateSitemapXML(sitemapData);
    
    // Write to file
    const outputPath = path.join(process.cwd(), 'public', 'sitemap-preview.xml');
    fs.writeFileSync(outputPath, xmlContent, 'utf8');
    
    // Show sample URLs
    sitemapData.slice(0, 10).forEach((item, index) => {
      });
    
    if (sitemapData.length > 10) {
      }
    
  } catch (error) {
    process.exit(1);
  }
}

function generateSitemapXML(sitemapData) {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  const xmlFooter = `</urlset>`;
  
  const xmlUrls = sitemapData.map(item => {
    const lastmod = item.lastModified ? new Date(item.lastModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    return `  <url>
    <loc>${escapeXml(item.url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${item.changeFrequency || 'weekly'}</changefreq>
    <priority>${item.priority || 0.5}</priority>
  </url>`;
  }).join('\n');
  
  return `${xmlHeader}\n${xmlUrls}\n${xmlFooter}`;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Run the script
generateSitemap();