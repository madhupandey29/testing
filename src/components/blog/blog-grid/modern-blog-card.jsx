'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ModernBlog.module.scss';

// Safe date formatting - Show actual dates like reference
const formatDate = (blog) => {
  try {
    // Use publishedAt first, then createdAt, then modifiedAt as fallback
    const dateStr = blog?.publishedAt || blog?.createdAt || blog?.modifiedAt;
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    
    // Show formatted date like "5 December, 2025"
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    });
  } catch {
    return '';
  }
};

// Strip HTML tags for clean text
const stripHtml = (v = '') =>
  String(v || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// Normalize image data with validation
const normalizeImg = (v) => {
  if (!v) return { src: '' };
  if (typeof v === 'string') {
    // Validate string URLs
    if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')) {
      return { src: v };
    }
    return { src: '' }; // Invalid URL
  }
  if (typeof v === 'object') {
    const src = v.url || v.secure_url || v.src || v.path || '';
    // Validate object URLs
    if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'))) {
      return {
        src: src,
        width: v.width,
        height: v.height,
        alt: v.alt,
        title: v.title,
      };
    }
    return { src: '' }; // Invalid URL
  }
  return { src: '' };
};

const ModernBlogCard = ({ blog, index = 0 }) => {
  const id = blog?.id || blog?._id;
  
  // Extract slug from URL if it's a full URL, otherwise use as-is
  let slug = blog?.slug || id;
  if (slug && slug.includes('http')) {
    // Extract the last part of the URL as slug
    const urlParts = slug.split('/');
    slug = urlParts[urlParts.length - 1] || id;
  }
  
  // Fallback to ID if slug is empty
  slug = slug || id;

  const rawTitle = blog?.title || '';
  const plainTitle = stripHtml(rawTitle) || 'Blog Post';

  const img1 = normalizeImg(blog?.blogimage1);
  const img2 = normalizeImg(blog?.blogimage2);
  const chosen = img1.src ? img1 : img2.src ? img2 : null;

  const fallbackSrc = '/assets/img/blog/blog-big-2.jpg';
  const src = chosen?.src || fallbackSrc;

  const date = formatDate(blog); // Pass the whole blog object

  // Get excerpt from available content with better priority
  const excerpt = stripHtml(
    blog?.excerpt || 
    blog?.description ||
    blog?.paragraph1 || 
    blog?.paragraph2 || 
    blog?.paragraph3 || 
    'Discover insights and knowledge in this comprehensive article...'
  ).substring(0, 140) + '...';

  // Category display
  const category = blog?.category || 'Blog';

  // First 8 cards are usually above the fold in a 4-card grid
  const isAboveFold = index < 8;

  return (
    <article className={styles.modernBlogCard}>
      <div className={styles.cardImage}>
        <Link href={`/blog-details/${slug}`}>
          <Image
            src={src}
            alt={plainTitle}
            width={400}
            height={220}
            className={styles.cardImg}
            priority={isAboveFold}
            loading={isAboveFold ? 'eager' : 'lazy'}
          />
        </Link>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>
          <Link href={`/blog-details/${slug}`}>
            {plainTitle}
          </Link>
        </h3>

        <p className={styles.cardExcerpt}>
          {excerpt}
        </p>

        <div className={styles.cardFooter}>
          <span className={styles.cardDate}>{date}</span>
          <Link href={`/blog-details/${slug}`} className={styles.cardReadMore}>
            Read More
            <i className="far fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ModernBlogCard;