'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getCollectionMediaForProduct } from '@/utils/collectionUtils';

const CollectionMedia = ({ product, className = '' }) => {
  const [collectionMedia, setCollectionMedia] = useState({
    image: null,
    video: null,
    collectionName: null,
    altText: null,
    videoAltText: null
  });
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const loadCollectionMedia = async () => {
      if (!product) {
        setLoading(false);
        return;
      }

      try {
        const media = await getCollectionMediaForProduct(product);
        setCollectionMedia(media);
      } catch (error) {
        // Silently fail - collection media is optional enhancement
        console.error('Failed to load collection media:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollectionMedia();
  }, [product]);

  if (loading) {
    return (
      <div className={`collection-media loading ${className}`}>
        <div className="media-placeholder">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!collectionMedia.image && !collectionMedia.video) {
    return null;
  }

  return (
    <div className={`collection-media ${className}`}>
      <div className="collection-header">
        <h4 className="collection-title">
          {collectionMedia.collectionName || 'Collection Media'}
        </h4>
        {collectionMedia.image && collectionMedia.video && (
          <div className="media-toggle">
            <button
              type="button"
              className={`toggle-btn ${!showVideo ? 'active' : ''}`}
              onClick={() => setShowVideo(false)}
              aria-label="Show collection image"
            >
              Image
            </button>
            <button
              type="button"
              className={`toggle-btn ${showVideo ? 'active' : ''}`}
              onClick={() => setShowVideo(true)}
              aria-label="Show collection video"
            >
              Video
            </button>
          </div>
        )}
      </div>

      <div className="media-container">
        {collectionMedia.image && (!collectionMedia.video || !showVideo) && (
          <div className="collection-image">
            <Image
              src={collectionMedia.image}
              alt={collectionMedia.altText || `${collectionMedia.collectionName} collection image`}
              width={400}
              height={300}
              className="collection-img"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {collectionMedia.video && (showVideo || !collectionMedia.image) && (
          <div className="collection-video">
            <iframe
              src={getEmbedUrl(collectionMedia.video)}
              title={collectionMedia.videoAltText || `${collectionMedia.collectionName} collection video`}
              width="400"
              height="300"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .collection-media {
          margin-top: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .collection-media.loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100px;
        }

        .media-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 80px;
          background: #f1f3f4;
          border-radius: 4px;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e9ecef;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .collection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .collection-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .media-toggle {
          display: flex;
          gap: 4px;
        }

        .toggle-btn {
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid #ddd;
          background: white;
          color: #666;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }

        .toggle-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .media-container {
          position: relative;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        .collection-image,
        .collection-video {
          width: 100%;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .collection-img {
          width: 100%;
          height: auto;
          display: block;
        }

        .collection-video iframe {
          width: 100%;
          height: 225px;
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .collection-media {
            padding: 12px;
            margin-top: 12px;
          }

          .collection-title {
            font-size: 13px;
          }

          .toggle-btn {
            padding: 3px 6px;
            font-size: 11px;
          }

          .collection-video iframe {
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to convert YouTube URL to embed URL
const getEmbedUrl = (url) => {
  if (!url) return '';
  
  // Handle YouTube URLs including Shorts
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/;
  const match = url.match(youtubeRegex);
  
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  
  // Return original URL if it's already an embed URL or other video service
  return url;
};

export default CollectionMedia;