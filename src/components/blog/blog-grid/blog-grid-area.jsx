'use client';
import React, { useEffect, useState } from 'react';
import ModernBlogCard from './modern-blog-card';
import styles from './ModernBlog.module.scss';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/,'');
const BLOG_PATH = process.env.NEXT_PUBLIC_API_BLOG_PATH || '/blog';

const fetchBlogs = async () => {
  const res = await fetch(`${API_BASE}${BLOG_PATH}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load blogs');
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
};

const BlogGridArea = ({ tagname = null }) => {
  const selectedTag = tagname; // Use prop instead of URL param
  
  console.log('BlogGridArea - Selected Tag:', selectedTag);
  
  const [allBlogs, setAllBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Fetch all blogs
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const data = await fetchBlogs();
        if (!alive) return;
        setAllBlogs(data);
      } catch (e) {
        if (alive) setErr(e?.message || 'Error loading blogs');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Filter blogs when tag changes or blogs are loaded
  useEffect(() => {
    console.log('Filtering - Selected Tag:', selectedTag);
    console.log('Filtering - All Blogs:', allBlogs.length);
    
    if (!selectedTag) {
      // No tag selected, show all blogs
      setFilteredBlogs(allBlogs);
      console.log('Filtering - Showing all blogs');
    } else {
      // Filter blogs by selected tag (case-insensitive)
      const filtered = allBlogs.filter(blog => {
        if (!blog?.tags || !Array.isArray(blog.tags)) return false;
        const hasTag = blog.tags.some(tag => 
          tag.toLowerCase() === selectedTag.toLowerCase()
        );
        if (hasTag) {
          console.log('Blog matched:', blog.title, 'Tags:', blog.tags);
        }
        return hasTag;
      });
      console.log('Filtering - Filtered blogs:', filtered.length);
      setFilteredBlogs(filtered);
    }
  }, [selectedTag, allBlogs]);

  if (loading) {
    return (
      <section className={`${styles.modernBlogArea} py-5`}>
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className={`mt-3 ${styles.loadingText}`}>Loading latest articles...</p>
          </div>
        </div>
      </section>
    );
  }

  if (err) {
    return (
      <section className={`${styles.modernBlogArea} py-5`}>
        <div className="container">
          <div className="text-center py-5">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Oops! Something went wrong</h4>
              <p>{err}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.modernBlogArea} py-5`}>
      <div className="container">
        {/* Show selected tag filter */}
        {selectedTag && (
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0">
                Showing blogs tagged with: <span className="badge bg-primary">{selectedTag}</span>
              </h5>
              <a href="/blog" className="btn btn-sm btn-outline-secondary">
                Clear Filter
              </a>
            </div>
          </div>
        )}

        {/* Modern Blog Grid - Show filtered blogs */}
        <div className={styles.modernBlogGrid}>
          {filteredBlogs.map((blog, idx) => (
            <ModernBlogCard 
              key={blog._id || blog.id || idx} 
              blog={blog} 
              index={idx}
            />
          ))}
        </div>

        {/* Show message if no blogs found */}
        {filteredBlogs.length === 0 && !loading && !err && (
          <div className="text-center py-5">
            {selectedTag ? (
              <>
                <p className="text-muted">No blog posts found with tag &quot;{selectedTag}&quot;.</p>
                <a href="/blog" className="btn btn-primary mt-3">
                  View All Blogs
                </a>
              </>
            ) : (
              <p className="text-muted">No blog posts found.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogGridArea;
