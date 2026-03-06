'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLong, ArrowRightLongPrev } from '@/svg';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const BLOG_PATH = process.env.NEXT_PUBLIC_API_BLOG_PATH || '/blog';

const PostboxDetailsNav = ({ currentId }) => {
  const [blogs, setBlogs] = useState([]);
  const [err, setErr] = useState('');

  // fetch all blogs once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}${BLOG_PATH}`, { cache: 'no-store' });
        const json = await res.json();
        if (!alive) return;
        setBlogs(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        setErr(e?.message || 'Failed to load blogs');
      }
    })();
    return () => { alive = false; };
  }, []);

  // compute previous and next blog based on creation date
  const { prev, next } = useMemo(() => {
    if (!Array.isArray(blogs) || blogs.length === 0) return { prev: null, next: null };

    const sorted = [...blogs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const idx = sorted.findIndex((b) => (b.id || b._id) === currentId);
    if (idx === -1) return { prev: null, next: null };

    const prevBlog = idx > 0 ? sorted[idx - 1] : null;
    const nextBlog = idx < sorted.length - 1 ? sorted[idx + 1] : null;
    
    return { 
      prev: prevBlog, 
      next: nextBlog 
    };
  }, [blogs, currentId]);

  if (err) return null;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: '2rem',
      padding: '2rem 0',
      borderTop: '1px solid #e9ecef',
      marginTop: '2rem'
    }}>

      {/* ---------- Previous Post ---------- */}
      <div style={{ flex: 1 }}>
        {prev && (
          <Link 
            href={prev.slug || `/blog-details/${prev.id || prev._id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#666',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#0989ff';
              e.target.style.backgroundColor = '#f8f9ff';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowRightLongPrev />
            <div>
              <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.3rem' }}>
                Previous Post
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: '500',
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '200px'
              }}>
                {prev.title?.replace(/<[^>]*>/g, '').substring(0, 40) || 'Previous Post'}...
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* ---------- Next Post ---------- */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {next && (
          <Link 
            href={next.slug || `/blog-details/${next.id || next._id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#666',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#0989ff';
              e.target.style.backgroundColor = '#f8f9ff';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.3rem' }}>
                Next Post
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: '500',
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '200px'
              }}>
                {next.title?.replace(/<[^>]*>/g, '').substring(0, 40) || 'Next Post'}...
              </div>
            </div>
            <ArrowRightLong />
          </Link>
        )}
      </div>

    </div>
  );
};

export default PostboxDetailsNav;
