'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import signature from '@assets/img/blog/signature/signature.png';
import { useGetAuthorsQuery, useGetBlogsQuery } from '@/redux/api/apiSlice';
import { getTopTags } from '@/utils/blogTags';

const BlogSidebar = () => {
  const { data: apiResponse, isLoading } = useGetAuthorsQuery();
  
  // Fetch all blogs to extract popular tags
  const { data: allBlogs = [], isLoading: blogsLoading } = useGetBlogsQuery();
  
  // Extract popular tags from all blogs
  const popularTags = getTopTags(allBlogs, 8);

  // Extract authors from API response
  const authors = apiResponse?.success && apiResponse?.data ? apiResponse.data : [];

  // Get the first author
  const author = authors?.[0];

  return (
    <>
      <div className="tp-sidebar-wrapper tp-sidebar-ml--24">
        {/* About */}
        <div className="tp-sidebar-widget mb-35">
          <h3 className="tp-sidebar-widget-title">About Me</h3>
          <div className="tp-sidebar-widget-content">
            <div className="tp-sidebar-about">
              <div className="tp-sidebar-about-thumb mb-25">
                <a href="#" className="tp-profile-avatar tp-profile-avatar--oval">
                  <Image
                    src={author?.authorimage || "/assets/img/blog/founder1.jpg"} // fallback image
                    alt={author?.name || "Author"}
                    fill
                    sizes="200px"
                    className="tp-profile-avatar__img"
                  />
                </a>
              </div>

              <div className="tp-sidebar-about-content">
                {isLoading ? (
                  <div style={{ textAlign: "center", color: "#666" }}>
                    Loading author information...
                  </div>
                ) : (
                  // Show RAW API data - NO FALLBACKS
                  <>
                    <h3 className="tp-sidebar-about-title">
                      <a href="#">{author?.name || 'No name from API'}</a>
                    </h3>
                    <span className="tp-sidebar-about-designation">
                      {author?.designation || 'No designation from API'}
                    </span>
                    <p>
                      {author?.description || 'No description from API'}
                    </p>
                  </>
                )}
                <div className="tp-sidebar-about-signature">
                  <Image src={signature} alt="signature" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Tags */}
        <div className="tp-sidebar-widget mb-35">
          <h3 className="tp-sidebar-widget-title">Popular Tags</h3>
          <div className="tp-sidebar-widget-content tagcloud">
            {blogsLoading ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '10px' }}>
                Loading tags...
              </div>
            ) : popularTags.length > 0 ? (
              popularTags.map((tag, index) => (
                <Link 
                  key={index} 
                  href={`/blog/tag/${encodeURIComponent(tag.toLowerCase())}`}
                >
                  {tag}
                </Link>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '10px' }}>
                No tags available
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogSidebar;
