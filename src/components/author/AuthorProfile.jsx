'use client';

import React from 'react';
import { useGetAuthorsQuery } from '@/redux/api/apiSlice';
import Image from 'next/image';

const AuthorProfile = ({ authorId = null, showSignature = true, className = '' }) => {
  const { data, isLoading, error } = useGetAuthorsQuery();

  if (isLoading) {
    return (
      <div className={`author-profile-loading ${className}`}>
        <div className="author-skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-name"></div>
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-description"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`author-profile-error ${className}`}>
        <p>Unable to load author information</p>
      </div>
    );
  }

  // Get the first author or specific author by ID
  let author = null;
  if (data && Array.isArray(data) && data.length > 0) {
    if (authorId) {
      author = data.find(a => a.id === authorId || a._id === authorId);
    }
    if (!author) {
      author = data[0]; // Use first author as default
    }
  }

  if (!author) {
    return (
      <div className={`author-profile-empty ${className}`}>
        <p>No author information available</p>
      </div>
    );
  }

  // Extract author data - no fallbacks, only use API data
  const authorName = author.name;
  const authorDesignation = author.designation;
  const authorDescription = author.description;
  const authorImageRaw = author.authorimage || author.image || null;
  const authorLinkedin = author.authorLinkedinURL || null;
  const authorAltText = author.altimage;

  // Validate author image URL
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  const authorImage = isValidImageUrl(authorImageRaw) ? authorImageRaw : null;

  return (
    <div className={`author-profile ${className}`}>
      <div className="author-content">
        {/* Author Avatar */}
        <div className="author-avatar">
          {authorImage ? (
            <Image
              src={authorImage}
              alt={authorAltText || authorName || 'Author'}
              width={120}
              height={120}
              className="author-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="author-initials" style={{ display: authorImage ? 'none' : 'flex' }}>
            {authorName ? authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AU'}
          </div>
        </div>

        {/* Author Info */}
        <div className="author-info">
          {authorName && <h2 className="author-name">{authorName}</h2>}
          {authorDesignation && <p className="author-title">{authorDesignation}</p>}
          {authorDescription && (
            <div className="author-description">
              <p>{authorDescription}</p>
            </div>
          )}
          
          {/* LinkedIn Link */}
          {authorLinkedin && (
            <div className="author-social">
              <a 
                href={authorLinkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="linkedin-link"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Connect on LinkedIn
              </a>
            </div>
          )}
          
          {showSignature && authorName && (
            <div className="author-signature">
              <span className="signature-text">{authorName}</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .author-profile {
          background: #ffffff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          max-width: 600px;
          margin: 0 auto;
        }

        .author-content {
          text-align: center;
        }

        .author-avatar {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 24px;
        }

        .author-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #f8fafc;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .author-initials {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 2px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .author-name {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }

        .author-title {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 24px 0;
          font-weight: 500;
          line-height: 1.4;
        }

        .author-description {
          margin-bottom: 32px;
        }

        .author-description p {
          font-size: 16px;
          line-height: 1.7;
          color: #475569;
          margin: 0;
          text-align: left;
        }

        .author-social {
          margin: 20px 0;
        }

        .linkedin-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #0077b5;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .linkedin-link:hover {
          background: #005885;
          color: white;
          text-decoration: none;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 119, 181, 0.3);
        }

        .author-signature {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .signature-text {
          font-family: 'Brush Script MT', cursive;
          font-size: 28px;
          color: #64748b;
          font-style: italic;
        }

        /* Loading States */
        .author-profile-loading {
          background: #ffffff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          max-width: 600px;
          margin: 0 auto;
        }

        .author-skeleton {
          text-align: center;
        }

        .skeleton-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          margin: 0 auto 24px;
        }

        .skeleton-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-line {
          height: 20px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-name {
          height: 32px;
          width: 60%;
          margin: 0 auto;
        }

        .skeleton-title {
          width: 80%;
          margin: 0 auto;
        }

        .skeleton-description {
          width: 100%;
          height: 60px;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        /* Error States */
        .author-profile-error,
        .author-profile-empty {
          background: #ffffff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .author-profile-error p,
        .author-profile-empty p {
          color: #64748b;
          font-size: 16px;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .author-profile {
            padding: 24px;
            margin: 0 16px;
          }

          .author-name {
            font-size: 24px;
          }

          .author-title {
            font-size: 14px;
          }

          .author-description p {
            font-size: 14px;
          }

          .author-avatar {
            width: 100px;
            height: 100px;
          }

          .author-image,
          .author-initials {
            width: 100px;
            height: 100px;
          }

          .author-initials {
            font-size: 28px;
          }
        }

        @media (max-width: 480px) {
          .author-profile {
            padding: 20px;
          }

          .author-name {
            font-size: 20px;
          }

          .author-avatar {
            width: 80px;
            height: 80px;
          }

          .author-image,
          .author-initials {
            width: 80px;
            height: 80px;
          }

          .author-initials {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthorProfile;