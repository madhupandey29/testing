'use client';
import React from 'react';
import SectionTitle from './section-title';
import BlogGridArea from './blog-grid-area';

// Wrapper component
const BlogContentWrapper = ({ tagname = null }) => {
  console.log('BlogContentWrapper - Received tagname:', tagname);
  
  return (
    <>
      <SectionTitle />
      <BlogGridArea tagname={tagname} />
    </>
  );
};

export default BlogContentWrapper;
