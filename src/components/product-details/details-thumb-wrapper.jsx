'use client';

import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { CgPlayButtonO } from 'react-icons/cg';

/* ---------------- helpers ---------------- */
const isRemote = (url) => !!url && /^https?:\/\//i.test(url);
const isCloudinaryUrl = (url) => !!url && /res\.cloudinary\.com/i.test(url);
const isDataUrl = (url) => !!url && /^data:/i.test(url);

// Extract YouTube video ID and generate thumbnail URL
const getYouTubeThumbnail = (url) => {
  if (!url) return null;

  // Add protocol if missing
  let processedUrl = url;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (!url.startsWith('http')) {
      processedUrl = `https://${url}`;
    }
  }

  let videoId = null;

  if (processedUrl.includes('youtu.be/')) {
    videoId = processedUrl.split('youtu.be/')[1]?.split('?')[0];
  } else if (processedUrl.includes('youtube.com/watch?v=')) {
    videoId = processedUrl.split('v=')[1]?.split('&')[0];
  } else if (processedUrl.includes('youtube.com/embed/')) {
    videoId = processedUrl.split('embed/')[1]?.split('?')[0];
  }

  if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return null;
};

const processImageUrl = (url) => {
  if (!url) return null;
  
  if (isRemote(url) || isDataUrl(url)) {
    return url;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;

  // ✅ keep slashes, encode each segment safely
  const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
  const finalUrl = `${cleanBaseUrl}/uploads/${encodedPath}`;
  
  return finalUrl;
};

const processVideoUrl = (url) => {
  if (!url) return null;
  
  // Handle YouTube URLs that might be missing protocol
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  }
  
  // Handle other remote URLs
  if (isRemote(url)) return url;
  
  // Handle local video files
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
  return `${cleanBaseUrl}/uploads/${encodedPath}`;
};

const uniqueByUrl = (arr) => {
  const seen = new Set();
  return (arr || []).filter((it) => {
    if (!it?.img) return false;
    const key = `${it?.type}|${it?.img}|${it?.video || ''}|${it?.source || 'unknown'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const NO_IMG = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900'>
  <rect width='100%' height='100%' fill='%23f5f5f5'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='Arial' font-size='28' fill='%23999'>No image available</text>
</svg>`;

/* ---------------- component ---------------- */
const DetailsThumbWrapper = ({
  img, image1, image2, image3,
  video, videoThumbnail,
  videourl,

  // ✅ Alt text props from API
  altTextImage1,
  altTextImage2,
  altTextImage3,
  altTextVideo,

  imageURLs,
  apiImages,
  groupCodeData, // Using collection data instead of groupcode

  handleImageActive,
  activeImg,

  imgWidth = 416,
  imgHeight = 480,

  videoId = false,
  status,
  isModalView = false, // New prop for modal layout
}) => {
  // Debug logging to see what data we're receiving
  console.log('🔍 DetailsThumbWrapper Debug:', {
    img, image1, image2, image3,
    videourl, video,
    altTextImage1, altTextImage2, altTextImage3, altTextVideo,
    apiImages: apiImages ? 'present' : 'missing',
    groupCodeData: groupCodeData ? 'present' : 'missing',
    isModalView,
    groupCodeDataKeys: groupCodeData ? Object.keys(groupCodeData) : []
  });
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const productName = apiImages?.name || 'Product';

  /* ---------- Build thumbs (Product API) ---------- */
  const primaryThumbs = useMemo(() => {
    const list = [];
    const productData = apiImages || {};

    console.log('🔍 Building primaryThumbs with:', {
      image1, image2, image3,
      videourl, video,
      productData: productData ? Object.keys(productData) : 'empty'
    });

    const isImageUrl = (field) => {
      if (!field || typeof field !== 'string') return false;
      const t = field.trim();
      if (!t) return false;
      return (
        t.startsWith('http') ||
        t.startsWith('/') ||
        /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(t)
      );
    };

    // ✅ Map images with their corresponding alt text (avoid duplicates)
    const imageFieldsWithAlt = [
      { 
        url: image1 || productData.image1, 
        alt: altTextImage1 || `${productName} image 1`,
        index: 1 
      },
      { 
        url: image2 || productData.image2, 
        alt: altTextImage2 || `${productName} image 2`,
        index: 2 
      },
      { 
        url: image3 || productData.image3, 
        alt: altTextImage3 || `${productName} image 3`,
        index: 3 
      },
      { 
        url: productData.image4, 
        alt: `${productName} image 4`,
        index: 4 
      },
      { 
        url: productData.image5, 
        alt: `${productName} image 5`,
        index: 5 
      },
      { 
        url: productData.image6, 
        alt: `${productName} image 6`,
        index: 6 
      },
    ].filter(item => isImageUrl(item.url));

    imageFieldsWithAlt.forEach((imageItem) => {
      const imgUrl = processImageUrl(imageItem.url);
      if (imgUrl) {
        const mediaItem = { 
          type: 'image', 
          img: imgUrl, 
          alt: imageItem.alt,
          source: 'product', 
          index: imageItem.index 
        };

        list.push(mediaItem);
      }
    });

    // video (product) with alt text
    const productVideoUrl = [
      videourl,
      video,
      productData.videourl,
      productData.video,
      productData.videoUrl,
    ].find((v) => typeof v === 'string' && v.trim() !== '');

    if (productVideoUrl) {
      const videoUrl = processVideoUrl(productVideoUrl);

      const poster =
        processImageUrl(videoThumbnail || productData.videoThumbnail) ||
        getYouTubeThumbnail(productVideoUrl) ||
        (imageFieldsWithAlt.length ? processImageUrl(imageFieldsWithAlt[0].url) : null) ||
        '/assets/img/product/default-product-img.jpg';

      if (videoUrl) {
        list.push({ 
          type: 'video', 
          img: poster, 
          video: videoUrl, 
          alt: altTextVideo || `${productName} product video`,
          source: 'product' 
        });
      }
    }

    return list;
  }, [img, image1, image2, image3, videourl, video, videoThumbnail, apiImages, altTextImage1, altTextImage2, altTextImage3, altTextVideo, productName]);

  /* ---------- Collection media (using collection data passed as groupCodeData) ---------- */
  const collectionMedia = useMemo(() => {
    if (!groupCodeData) return [];

    const media = [];

    // Collection image - using the new API structure and remove trailing hash
    const collectionImageField = [
      (groupCodeData.collectionImage1CloudUrlWeb && typeof groupCodeData.collectionImage1CloudUrlWeb === 'string' ? groupCodeData.collectionImage1CloudUrlWeb.replace(/#$/, '') : groupCodeData.collectionImage1CloudUrlWeb),
      (groupCodeData.collectionimage1CloudUrl && typeof groupCodeData.collectionimage1CloudUrl === 'string' ? groupCodeData.collectionimage1CloudUrl.replace(/#$/, '') : groupCodeData.collectionimage1CloudUrl),
      groupCodeData.collectionImage1,
      groupCodeData.img, // fallback for old structure
      groupCodeData.image,
    ].find((v) => typeof v === 'string' && v.trim() !== '' && v !== 'null');

    if (collectionImageField) {
      const collectionImageUrl = processImageUrl(collectionImageField);
      if (collectionImageUrl) {
        const altText = groupCodeData.altTextCollectionImage1 || `${groupCodeData.name || 'Collection'} image`;

        media.push({ 
          type: 'image', 
          img: collectionImageUrl, 
          alt: altText,
          source: 'collection',
          fallbackUrls: groupCodeData.collectionImage1Id ? [
            `https://res.cloudinary.com/age-fabric/image/upload/${groupCodeData.collectionImage1Id}.jpg`,
            `https://res.cloudinary.com/age-fabric/image/upload/collections/${groupCodeData.collectionImage1Id}.jpg`,
          ] : []
        });
      }
    }

    // Collection video - using the new API structure
    const collectionVideoUrl = [
      groupCodeData.collectionvideoURL,
      groupCodeData.collectionVideo,
      groupCodeData.videourl, // fallback for old structure
      groupCodeData.video,
    ].find((v) => typeof v === 'string' && v.trim() !== '');

    if (collectionVideoUrl) {
      const videoUrl = processVideoUrl(collectionVideoUrl);
      const poster =
        getYouTubeThumbnail(collectionVideoUrl) ||
        (media[0]?.img) || // Use collection image if available
        (primaryThumbs?.[0]?.img || null) ||
        '/assets/img/product/default-product-img.jpg';

      if (videoUrl) {
        media.push({ 
          type: 'video', 
          img: poster, 
          video: videoUrl, 
          alt: groupCodeData.collectionaltTextVideo || `${groupCodeData.name || 'Collection'} video`,
          source: 'collection' 
        });
      }
    }

    return media;
  }, [groupCodeData, primaryThumbs]);

  /* ---------- Final list ---------- */
  const processedImageURLs = useMemo(() => {
    // Put collection media AFTER product media (5th position)
    const finalMedia = [...primaryThumbs, ...collectionMedia];
    const uniqueMedia = uniqueByUrl(finalMedia);

    console.log('🔍 Final processedImageURLs:', {
      primaryThumbsCount: primaryThumbs.length,
      collectionMediaCount: collectionMedia.length,
      finalMediaCount: finalMedia.length,
      uniqueMediaCount: uniqueMedia.length,
      uniqueMedia: uniqueMedia.map(item => ({
        type: item.type,
        hasImg: !!item.img,
        hasVideo: !!item.video,
        source: item.source
      }))
    });

    return uniqueMedia;
  }, [primaryThumbs, collectionMedia, altTextImage1, altTextImage2, altTextImage3, altTextVideo, productName]);

  /* ---------- Main image ---------- */
  const mainImageUrl = useMemo(() => {
    if (activeImg) return processImageUrl(activeImg);
    if (image1) return processImageUrl(image1);
    if (img) return processImageUrl(img);
    const first = processedImageURLs.find((x) => x?.type === 'image');
    return first?.img || null;
  }, [image1, img, activeImg, processedImageURLs]);

  const [mainSrc, setMainSrc] = useState(mainImageUrl);

  useEffect(() => {
    if (mainImageUrl && mainImageUrl !== mainSrc) {
      setMainSrc(mainImageUrl);
      setIsVideoActive(false);
      setCurrentVideoUrl(null);
      
      // 🔧 FIX: Synchronize currentSlide with the actual displayed image
      const matchingIndex = processedImageURLs.findIndex(item => 
        item.type === 'image' && item.img === mainImageUrl
      );
      if (matchingIndex !== -1 && matchingIndex !== currentSlide) {
        setCurrentSlide(matchingIndex);
      }
      
      if (typeof handleImageActive === 'function') {
        handleImageActive({ img: mainImageUrl, type: 'image' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainImageUrl, processedImageURLs]);

  // Force video positioning after video becomes active - AGGRESSIVE APPROACH
  useEffect(() => {
    if (isVideoActive && currentVideoUrl) {
      const forceVideoPosition = () => {
        const videoElements = document.querySelectorAll('.pdw-main-inner video, .pdw-main-inner iframe');
        videoElements.forEach(video => {
          video.style.setProperty('position', 'absolute', 'important');
          video.style.setProperty('top', '0', 'important');
          video.style.setProperty('left', '0', 'important');
          video.style.setProperty('width', '100%', 'important');
          video.style.setProperty('height', '100%', 'important');
          video.style.setProperty('object-fit', 'cover', 'important');
          video.style.setProperty('object-position', 'center', 'important');
          video.style.setProperty('z-index', '1', 'important');
          video.style.setProperty('transform', 'none', 'important');
        });
      };

      // Run immediately
      forceVideoPosition();
      
      // Run after a short delay
      const timer1 = setTimeout(forceVideoPosition, 100);
      
      // Run after a longer delay to catch any late-loading videos
      const timer2 = setTimeout(forceVideoPosition, 500);
      
      // Run periodically to ensure positioning stays correct
      const interval = setInterval(forceVideoPosition, 1000);
      
      // Add ResizeObserver to handle container size changes
      let resizeObserver;
      const container = document.querySelector('.pdw-main-inner');
      if (container && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          forceVideoPosition();
        });
        resizeObserver.observe(container);
      }
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearInterval(interval);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }
  }, [isVideoActive, currentVideoUrl]);

  const onThumbClick = (item, index) => {
    setCurrentSlide(index);
    if (item.type === 'video') {
      setIsVideoActive(true);
      setCurrentVideoUrl(item.video || videoId || null);
    } else {
      setIsVideoActive(false);
      setCurrentVideoUrl(null);
      setMainSrc(item.img);
      if (typeof handleImageActive === 'function') handleImageActive({ img: item.img, type: 'image' });
    }
  };

  const nextSlide = () => {
    if (!processedImageURLs?.length) return;
    const nextIndex = (currentSlide + 1) % processedImageURLs.length;
    onThumbClick(processedImageURLs[nextIndex], nextIndex);
  };

  const prevSlide = () => {
    if (!processedImageURLs?.length) return;
    const prevIndex = currentSlide === 0 ? processedImageURLs.length - 1 : currentSlide - 1;
    onThumbClick(processedImageURLs[prevIndex], prevIndex);
  };

  /* ---------------- Simple click to view full image ---------------- */
  const handleImageClick = () => {
    // Only allow modal on desktop (screen width > 768px)
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return; // Don't open modal on mobile
    }
    
    if (!isVideoActive && mainSrc) {
      setModalImageSrc(mainSrc);
      setShowImageModal(true);
    }
  };

  const handleVideoClick = () => {
    // Only allow modal on desktop (screen width > 768px)
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return; // Don't open modal on mobile
    }
    
    if (isVideoActive && currentVideoUrl) {
      setModalImageSrc(null);
      setShowImageModal(true);
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageSrc(null);
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showImageModal) return;

      if (e.key === 'Escape') closeImageModal();
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevModalImage();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextModalImage();
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showImageModal, modalImageSrc, currentVideoUrl]);

  const nextModalImage = () => {
    const allItems = processedImageURLs;
    if (allItems.length <= 1) return;

    let currentIndex = -1;
    if (modalImageSrc) currentIndex = allItems.findIndex((i) => i.type === 'image' && i.img === modalImageSrc);
    else if (currentVideoUrl) currentIndex = allItems.findIndex((i) => i.type === 'video' && i.video === currentVideoUrl);

    const nextIndex = (currentIndex + 1) % allItems.length;
    const nextItem = allItems[nextIndex];

    if (nextItem.type === 'video') {
      setCurrentVideoUrl(nextItem.video);
      setModalImageSrc(null);
    } else {
      setModalImageSrc(nextItem.img);
      setCurrentVideoUrl(null);
    }
  };

  const prevModalImage = () => {
    const allItems = processedImageURLs;
    if (allItems.length <= 1) return;

    let currentIndex = -1;
    if (modalImageSrc) currentIndex = allItems.findIndex((i) => i.type === 'image' && i.img === modalImageSrc);
    else if (currentVideoUrl) currentIndex = allItems.findIndex((i) => i.type === 'video' && i.video === currentVideoUrl);

    const prevIndex = currentIndex === 0 ? allItems.length - 1 : currentIndex - 1;
    const prevItem = allItems[prevIndex];

    if (prevItem.type === 'video') {
      setCurrentVideoUrl(prevItem.video);
      setModalImageSrc(null);
    } else {
      setModalImageSrc(prevItem.img);
      setCurrentVideoUrl(null);
    }
  };

  const mainUnoptimized = Boolean(mainSrc && (isCloudinaryUrl(mainSrc) || isDataUrl(mainSrc)));

  const onMainImageError = () => {
    if (mainSrc !== NO_IMG) setMainSrc(NO_IMG);
  };

  return (
    <div className={`pdw-wrapper ${isModalView ? 'pdw-modal-view' : ''}`}>
      {/* Desktop Thumbs */}
      <nav className="pdw-thumbs pdw-desktop-only">
        <div className="pdw-thumbs-inner">
          {processedImageURLs?.map((item, i) => {
            // ✅ Use alt text from API data
            const altText = item.alt || (
              item.type === 'video'
                ? `${productName} video thumbnail`
                : `${productName} image ${i + 1}`
            );

            return item.type === 'video' ? (
              <button
                key={`v-${i}`}
                className={`pdw-thumb ${i === currentSlide ? 'is-active' : ''}`}
                onClick={() => onThumbClick(item, i)}
                type="button"
                aria-label={`Play video: ${altText}`}
                title={`Play video: ${altText}`}
              >
                <Image
                  src={item.img || '/assets/img/product/default-product-img.jpg'}
                  alt={altText}
                  width={80}
                  height={80}
                  className="pdw-thumb-img"
                  style={{ objectFit: 'cover' }}
                  unoptimized={Boolean(item.img && (isCloudinaryUrl(item.img) || isDataUrl(item.img)))}
                  loading="lazy"
                />
                <span className="pdw-thumb-play" aria-hidden>
                  <CgPlayButtonO />
                </span>
              </button>
            ) : (
              <button
                key={`i-${i}`}
                className={`pdw-thumb ${i === currentSlide ? 'is-active' : ''}`}
                onClick={() => onThumbClick(item, i)}
                type="button"
                title={`View image: ${altText}`}
              >
                <Image
                  src={item.img || '/assets/img/product/default-product-img.jpg'}
                  alt={altText}
                  width={80}
                  height={80}
                  className="pdw-thumb-img"
                  style={{ objectFit: 'cover' }}
                  unoptimized={Boolean(item.img && (isCloudinaryUrl(item.img) || isDataUrl(item.img)))}
                  loading="lazy"
                  onError={(e) => {
                    // If this is a collection image with fallback URLs, try them
                    if (item.source === 'collection' && item.fallbackUrls && item.fallbackUrls.length > 0) {
                      const currentSrc = e.currentTarget.src;
                      const currentIndex = item.fallbackUrls.findIndex(url => url === currentSrc);
                      const nextIndex = currentIndex + 1;
                      
                      if (nextIndex < item.fallbackUrls.length) {
                        e.currentTarget.src = item.fallbackUrls[nextIndex];
                        return;
                      }
                    }
                    // Final fallback
                    e.currentTarget.src = '/assets/img/product/default-product-img.jpg';
                  }}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main viewer - click to enlarge */}
      <div className="pdw-main">
        {/* Mobile Navigation Arrows */}
        <button className="pdw-nav-arrow pdw-nav-prev pdw-mobile-only" onClick={prevSlide} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <button className="pdw-nav-arrow pdw-nav-next pdw-mobile-only" onClick={nextSlide} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>

        <div
          className="pdw-main-inner"
          onClick={isVideoActive ? handleVideoClick : handleImageClick}
          style={{ cursor: 'pointer' }}
        >
          {isVideoActive && (currentVideoUrl || videoId) ? (
            currentVideoUrl && currentVideoUrl.includes('youtu') ? (
              <iframe
                src={(() => {
                  let embedUrl = currentVideoUrl;
                  if (embedUrl.includes('youtu.be/')) {
                    const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
                    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                  } else if (embedUrl.includes('watch?v=')) {
                    const videoId = embedUrl.split('v=')[1]?.split('&')[0];
                    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                  } else if (!embedUrl.includes('/embed/')) {
                    // If it's already an embed URL, use as is
                    // Otherwise try to extract video ID from any YouTube URL format
                    const match = embedUrl.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
                    if (match) {
                      embedUrl = `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                    }
                  } else if (embedUrl.includes('/embed/') && !embedUrl.includes('?')) {
                    // Convert to nocookie and add parameters
                    embedUrl = embedUrl.replace('youtube.com', 'youtube-nocookie.com');
                    embedUrl += `?rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                  } else if (embedUrl.includes('/embed/') && embedUrl.includes('?')) {
                    // Convert to nocookie and add parameters
                    embedUrl = embedUrl.replace('youtube.com', 'youtube-nocookie.com');
                    embedUrl += `&rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                  }
                  return embedUrl;
                })()}
                className="pdw-video"
                style={{ 
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%', 
                  height: '100%', 
                  border: 'none',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  zIndex: '1'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
                title={(() => {
                  // Find the current video item and use its alt text
                  const videoItem = processedImageURLs.find(item => 
                    item.type === 'video' && item.video === (currentVideoUrl || videoId)
                  );
                  return videoItem?.alt || altTextVideo || `${productName} video`;
                })()}
              />
            ) : (
              <video
                src={currentVideoUrl || videoId}
                controls
                autoPlay
                className="pdw-video"
                style={{ 
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  objectPosition: 'center',
                  zIndex: '1'
                }}
              />
            )
          ) : (
            // ✅ FIX: Next/Image with width+height -> SEO tool won’t show “HTML - x -”
            <Image
              src={mainSrc || NO_IMG}
              alt={(() => {

                // 🔧 DIRECT METHOD: Check if mainSrc matches any known image and use corresponding alt text
                if (mainSrc && altTextImage1) {
                  // Try to match mainSrc with processed image1 URL
                  const image1Processed = processImageUrl(image1);
                  if (image1Processed && mainSrc === image1Processed) {
                    return altTextImage1;
                  }
                }
                
                if (mainSrc && altTextImage2) {
                  // Try to match mainSrc with processed image2 URL
                  const image2Processed = processImageUrl(image2);
                  if (image2Processed && mainSrc === image2Processed) {
                    return altTextImage2;
                  }
                }
                
                if (mainSrc && altTextImage3) {
                  // Try to match mainSrc with processed image3 URL
                  const image3Processed = processImageUrl(image3);
                  if (image3Processed && mainSrc === image3Processed) {
                    return altTextImage3;
                  }
                }
                
                // Method 1: Use current slide index to get the correct alt text
                const currentItem = processedImageURLs?.[currentSlide];
                if (currentItem && currentItem.type === 'image' && currentItem.alt) {
                  return currentItem.alt;
                }
                
                // Method 2: Find the item that matches the current mainSrc
                const matchingItem = processedImageURLs?.find(item => 
                  item.type === 'image' && item.img === mainSrc
                );
                if (matchingItem && matchingItem.alt) {
                  return matchingItem.alt;
                }
                
                // Method 3: Use first available alt text from props
                const firstAvailableAlt = altTextImage1 || altTextImage2 || altTextImage3;
                if (firstAvailableAlt) {
                  return firstAvailableAlt;
                }
                
                // Method 4: Final fallback
                const fallbackAlt = `${productName} main image`;
                return fallbackAlt;
              })()}
              width={imgWidth}
              height={imgHeight}
              sizes={`(max-width: 768px) 100vw, ${imgWidth}px`}
              className="pdw-main-img"
              style={{ objectFit: 'contain' }}
              unoptimized={mainUnoptimized}
              onError={onMainImageError}
              priority
            />
          )}

          {/* Click to enlarge hint */}
          {!isVideoActive && mainSrc && (
            <div className="pdw-enlarge-hint">
              <span>🔍 Click to enlarge</span>
            </div>
          )}

          {/* Alt text display */}
          <div className="pdw-alt-text-display">
            {isVideoActive && currentVideoUrl ? (
              <p className="pdw-alt-text">
                {(() => {
                  // Use current slide index for video
                  const currentItem = processedImageURLs[currentSlide];
                  if (currentItem && currentItem.type === 'video') {
                    return currentItem.alt || `${productName} video`;
                  }
                  return altTextVideo || `${productName} video`;
                })()}
              </p>
            ) : (
              <p className="pdw-alt-text">
                {(() => {
                  // Use current slide index for image
                  const currentItem = processedImageURLs[currentSlide];
                  if (currentItem && currentItem.type === 'image') {
                    return currentItem.alt || `${productName} image ${currentSlide + 1}`;
                  }
                  return altTextImage1 || `${productName} main image`;
                })()}
              </p>
            )}
          </div>

          <div className="tp-product-badge">
            {status === 'out-of-stock' && <span className="product-hot">out-stock</span>}
          </div>
        </div>
      </div>

      {/* Mobile Thumbnail Dots */}
      <div className="pdw-mobile-dots pdw-mobile-only">
        {processedImageURLs?.map((item, i) => {
          // ✅ Use alt text from API data
          const altText = item.alt || (
            item.type === 'video'
              ? `${productName} video thumbnail`
              : `${productName} image ${i + 1}`
          );

          return (
            <button
              key={`dot-${i}`}
              className={`pdw-dot ${i === currentSlide ? 'is-active' : ''}`}
              onClick={() => onThumbClick(item, i)}
              type="button"
              title={altText}
            >
              <Image
                src={item.img || '/assets/img/product/default-product-img.jpg'}
                alt={altText}
                width={60}
                height={60}
                className="pdw-dot-img"
                style={{ objectFit: 'contain' }}
                unoptimized={Boolean(item.img && (isCloudinaryUrl(item.img) || isDataUrl(item.img)))}
                loading="lazy"
              />
              {item.type === 'video' && (
                <span className="pdw-dot-play">
                  <CgPlayButtonO />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Media Modal */}
      {showImageModal && (
        <div className="pdw-modal-overlay" onClick={closeImageModal}>
          <div className="pdw-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="pdw-modal-close" onClick={closeImageModal} type="button">
              ×
            </button>

            {processedImageURLs.length > 1 && (
              <button className="pdw-modal-nav pdw-modal-prev" onClick={prevModalImage} type="button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
            )}

            {processedImageURLs.length > 1 && (
              <button className="pdw-modal-nav pdw-modal-next" onClick={nextModalImage} type="button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            )}

            <div className="pdw-modal-media-container">
              {modalImageSrc ? (
                <img 
                  src={modalImageSrc} 
                  alt={(() => {
                    // Find the modal image item and use its alt text
                    const modalItem = processedImageURLs.find(item => 
                      item.type === 'image' && item.img === modalImageSrc
                    );
                    return modalItem?.alt || `${productName} full size image`;
                  })()} 
                  className="pdw-modal-image" 
                />
              ) : currentVideoUrl ? (
                currentVideoUrl.includes('youtu') ? (
                  <iframe
                    src={(() => {
                      let embedUrl = currentVideoUrl;
                      if (embedUrl.includes('youtu.be/')) {
                        const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
                        embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                      } else if (embedUrl.includes('watch?v=')) {
                        const videoId = embedUrl.split('v=')[1]?.split('&')[0];
                        embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                      } else if (!embedUrl.includes('/embed/')) {
                        const match = embedUrl.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
                        if (match) {
                          embedUrl = `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                        }
                      } else if (embedUrl.includes('/embed/') && !embedUrl.includes('?')) {
                        // Convert to nocookie and add parameters
                        embedUrl = embedUrl.replace('youtube.com', 'youtube-nocookie.com');
                        embedUrl += `?rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                      } else if (embedUrl.includes('/embed/') && embedUrl.includes('?')) {
                        // Convert to nocookie and add parameters
                        embedUrl = embedUrl.replace('youtube.com', 'youtube-nocookie.com');
                        embedUrl += `&rel=0&modestbranding=1&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                      }
                      return embedUrl;
                    })()}
                    className="pdw-modal-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
                    title={(() => {
                      // Find the current video item and use its alt text
                      const videoItem = processedImageURLs.find(item => 
                        item.type === 'video' && item.video === currentVideoUrl
                      );
                      return videoItem?.alt || `${productName} video`;
                    })()}
                  />
                ) : (
                  <video src={currentVideoUrl} controls autoPlay className="pdw-modal-video" />
                )
              ) : null}
            </div>

            {processedImageURLs.length > 1 && (
              <div className="pdw-modal-counter">
                {(() => {
                  let currentIndex = -1;
                  if (modalImageSrc) {
                    currentIndex = processedImageURLs.findIndex(
                      (item) => item.type === 'image' && item.img === modalImageSrc
                    );
                  } else if (currentVideoUrl) {
                    currentIndex = processedImageURLs.findIndex(
                      (item) => item.type === 'video' && item.video === currentVideoUrl
                    );
                  }
                  return currentIndex >= 0 ? `${currentIndex + 1} / ${processedImageURLs.length}` : '1 / 1';
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- styles ---------- */}
      <style jsx>{`
        .pdw-wrapper {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 25px;
          align-items: start;
          max-width: 100%;
        }
        
        /* Modal view: horizontal thumbnails above main image */
        .pdw-wrapper.pdw-modal-view {
          display: block;
          max-width: 100%;
        }
        
        .pdw-modal-view .pdw-thumbs {
          width: 100% !important;
          margin-bottom: 15px;
        }
        
        .pdw-modal-view .pdw-thumbs-inner {
          display: flex !important;
          flex-direction: row !important;
          gap: 10px !important;
          justify-content: center !important;
          overflow: visible !important;
          max-height: none !important;
          padding: 0 !important;
        }
        
        .pdw-modal-view .pdw-thumb {
          width: 75px !important;
          height: 75px !important;
          flex: 0 0 auto !important;
        }
        
        .pdw-modal-view .pdw-main {
          width: 100% !important;
          margin: 0 auto !important;
        }

        /* Desktop Thumbnails */
        .pdw-thumbs { width: 100px; }
        .pdw-thumbs-inner {
          display: flex; flex-direction: column; gap: 15px;
          max-height: 600px;
          overflow-y: auto; overflow-x: hidden; padding-right: 6px;
          scrollbar-width: thin;
        }

        .pdw-thumb {
          position: relative; width: 90px; height: 90px;
          padding: 0; border: 0; box-sizing: border-box;
          border-radius: 12px; overflow: hidden; background: #fff; cursor: pointer;
          transition: transform .12s ease, box-shadow .16s ease;
          flex: 0 0 auto; display: grid; place-items: center;
          border: 2px solid transparent;
        }
        .pdw-thumb:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 20px rgba(0,0,0,.12); 
          border-color: rgba(44, 76, 151, 0.3);
        }
        .pdw-thumb.is-active { 
          box-shadow: 0 8px 20px rgba(44, 76, 151, 0.25);
          border-color: #2C4C97;
          transform: translateY(-1px);
        }

        .pdw-thumb-img { width: 100%; height: 100%; object-fit: contain; display: block; border-radius: inherit; }

        .pdw-thumb-play {
          position: absolute; inset: 0; display: grid; place-items: center;
          color: #fff; font-size: 34px;
          background: linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.05));
          pointer-events: none;
        }

        /* Main Image Container */
        .pdw-main {
          width: 100%;
          max-width: 600px;
          aspect-ratio: 1;
          border-radius: 16px; 
          overflow: hidden;
          background: #fff; 
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 30px rgba(0,0,0,.08);
          position: relative; 
          margin-bottom: 60px;
        }
        .pdw-main-inner { 
          width: 100%; 
          height: 100%; 
          position: relative; 
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease; 
          border-radius: 12px; 
          overflow: hidden;
        }
        
        /* Ensure video elements fill the flex container properly */
        .pdw-main-inner > * {
          flex-shrink: 0;
        }
        
        /* When video is active, ensure container is positioned for absolute children */
        .pdw-main-inner:has(video),
        .pdw-main-inner:has(iframe) {
          position: relative !important;
        }
        .pdw-main-inner:hover { transform: scale(1.02); }
        /* Force video positioning on all screen sizes with MAXIMUM SPECIFICITY */
        body .pdw-wrapper .pdw-main .pdw-main-inner video,
        body .pdw-wrapper .pdw-main .pdw-main-inner iframe,
        .pdw-video { 
          background: #000 !important; 
          width: 100% !important; 
          height: 100% !important; 
          object-fit: cover !important;
          object-position: center !important;
          border-radius: 12px !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 1 !important;
          transform: none !important;
        }
        
        /* Override global video height: auto rule with MAXIMUM SPECIFICITY */
        body .pdw-wrapper .pdw-main .pdw-main-inner .pdw-video,
        .pdw-main-inner .pdw-video {
          height: 100% !important;
          width: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        
        /* Ensure iframe videos maintain their container size with MAXIMUM SPECIFICITY */
        body .pdw-wrapper .pdw-main .pdw-main-inner iframe.pdw-video,
        .pdw-main-inner iframe.pdw-video {
          width: 100% !important;
          height: 100% !important;
          min-height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
        
        /* Force video elements to fill container on all screen sizes */
        body .pdw-wrapper .pdw-main .pdw-main-inner video,
        body .pdw-wrapper .pdw-main .pdw-main-inner iframe,
        .pdw-main-inner video,
        .pdw-main-inner iframe {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          object-position: center !important;
          z-index: 1 !important;
          transform: none !important;
        }

        /* ✅ ensure Next/Image fills container */
        .pdw-main :global(.pdw-main-img) {
          width: 100% !important;
          height: 100% !important;
        }

        /* Navigation Arrows (Mobile Only) */
        .pdw-nav-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,.95); border: none; border-radius: 50%;
          width: 50px; height: 50px; cursor: pointer; z-index: 10; display: none;
          box-shadow: 0 4px 16px rgba(0,0,0,.2);
          transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center;
          color: #333;
        }
        .pdw-nav-prev { left: 15px; }
        .pdw-nav-next { right: 15px; }

        /* Mobile Thumbnail Dots */
        .pdw-mobile-dots {
          display: none; justify-content: flex-start; gap: 8px; margin-top: 15px;
          padding: 0 20px; overflow-x: auto; padding-bottom: 5px;
          scrollbar-width: thin;
        }
        .pdw-dot {
          position: relative; width: 60px; height: 60px; flex-shrink: 0;
          padding: 0; border: 2px solid transparent; border-radius: 8px;
          overflow: hidden; background: #fff; cursor: pointer;
          transition: all 0.2s ease;
        }
        .pdw-dot.is-active { border-color: #3b82f6; }
        .pdw-dot-img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .pdw-dot-play {
          position: absolute; inset: 0; display: grid; place-items: center;
          color: #fff; font-size: 20px;
          background: linear-gradient(to top, rgba(0,0,0,.6), rgba(0,0,0,.1));
          pointer-events: none;
        }

        .pdw-enlarge-hint {
          position: absolute; bottom: 10px; right: 10px;
          background: rgba(0,0,0,.7); color: white; padding: 4px 8px;
          border-radius: 6px; font-size: 12px; opacity: 0;
          transition: opacity 0.2s ease; pointer-events: none;
        }
        .pdw-main-inner:hover .pdw-enlarge-hint { opacity: 1; }

        /* Alt text display */
        .pdw-alt-text-display {
          position: absolute; bottom: -45px; left: 0; right: 0;
          background: rgba(255,255,255,.95); border: 1px solid #e5e7eb;
          border-radius: 8px; padding: 8px 12px; margin: 0 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,.1);
        }
        .pdw-alt-text {
          margin: 0; font-size: 13px; line-height: 1.4; color: #374151;
          font-weight: 500; text-align: center;
        }
        
        /* Desktop-only hover effect for clickable images */
        @media (min-width: 769px) {
          .pdw-main-inner:hover { 
            transform: scale(1.02); 
            cursor: pointer;
          }
          
          /* Force video positioning on desktop */
          .pdw-main-inner video,
          .pdw-main-inner iframe {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            border-radius: 12px !important;
          }
          
          .pdw-main-inner::after {
            content: '🔍 Click to enlarge';
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,.8);
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
          }
          .pdw-main-inner:hover::after {
            opacity: 1;
          }
        }

        .tp-product-badge { position: absolute; left: 10px; top: 10px; }
        .product-hot { display: inline-block; background: #ef4444; color: #fff; font-size: 12px; padding: 4px 8px; border-radius: 6px; }

        .pdw-desktop-only { display: block; }
        .pdw-mobile-only { display: none; }

        /* Modal Styles - Enhanced z-index and positioning */
        .pdw-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,.85); display: flex; align-items: center; justify-content: center;
          z-index: 999999; padding: 20px; cursor: pointer;
        }
        .pdw-modal-content {
          position: relative; 
          width: 90vw; height: 80vh;
          max-width: 1200px; max-height: 800px;
          background: white; border-radius: 12px; overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,.4); cursor: default;
          display: flex; align-items: center; justify-content: center;
        }
        .pdw-modal-close {
          position: absolute; top: 15px; right: 15px; z-index: 1000000;
          background: rgba(0,0,0,.8); color: white; border: none;
          width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
          font-size: 24px; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        
        .pdw-modal-close:hover {
          background: rgba(0,0,0,.9);
          transform: scale(1.1);
        }

        .pdw-modal-nav {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 1000000;
          background: rgba(0,0,0,.8); color: white; border: none;
          width: 50px; height: 50px; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        
        .pdw-modal-nav:hover {
          background: rgba(0,0,0,.9);
          transform: translateY(-50%) scale(1.1);
        }
        
        .pdw-modal-prev { left: 20px; }
        .pdw-modal-next { right: 20px; }

        .pdw-modal-counter {
          position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,.8); color: white; padding: 8px 16px;
          border-radius: 20px; font-size: 14px; font-weight: 500;
          z-index: 1000000;
        }

        .pdw-modal-media-container {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: #f8f9fa;
        }

        .pdw-modal-image {
          max-width: 100%; max-height: 100%;
          object-fit: contain; object-position: center;
          display: block;
        }

        .pdw-modal-video {
          width: 100%; 
          height: 100%;
          max-width: 100%; 
          max-height: 100%;
          object-fit: contain;
          object-position: center;
          border: none;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .pdw-wrapper { 
            display: block; 
            max-width: 100%; 
            margin: 0 auto; 
            padding: 0 15px; 
          }
          .pdw-desktop-only { display: none; }
          .pdw-mobile-only { display: block; }

          .pdw-main {
            width: 100%;
            height: clamp(320px, 75vw, 480px);
            max-width: 100%;
            margin: 0 auto 80px auto;
            border-radius: 16px;
            box-shadow: 0 8px 25px rgba(0,0,0,.12);
          }
          
          /* Force video positioning on mobile */
          .pdw-main-inner video,
          .pdw-main-inner iframe {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            border-radius: 16px !important;
          }

          .pdw-nav-arrow { 
            display: flex !important; 
            width: 44px; 
            height: 44px;
            background: rgba(255,255,255,.98);
            box-shadow: 0 4px 20px rgba(0,0,0,.15);
          }
          .pdw-nav-prev { left: 12px; }
          .pdw-nav-next { right: 12px; }
          
          .pdw-mobile-dots { display: flex; }
          .pdw-enlarge-hint { display: none; }
          
          /* Enhanced alt text display on mobile */
          .pdw-alt-text-display {
            bottom: -65px; 
            margin: 0 8px;
            padding: 12px 15px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,.12);
          }
          .pdw-alt-text {
            font-size: 13px;
            line-height: 1.4;
            font-weight: 500;
          }
          
          /* Enable modal on mobile with proper sizing */
          .pdw-modal-overlay { 
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 10px !important;
          }
          
          .pdw-modal-content {
            width: 95vw !important;
            height: 70vh !important;
            max-width: 600px !important;
            max-height: 500px !important;
          }
          
          /* Enable pointer cursor on mobile since modal will open */
          .pdw-main-inner { cursor: pointer !important; }
          .pdw-main-inner:hover { transform: scale(1.01) !important; }
        }

        @media (max-width: 480px) {
          .pdw-wrapper { padding: 0 10px; }
          .pdw-main { 
            height: clamp(300px, 70vw, 380px); 
            margin-bottom: 75px;
            border-radius: 14px;
          }
          
          /* Force video positioning on very small screens */
          .pdw-main-inner video,
          .pdw-main-inner iframe {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            border-radius: 14px !important;
          }
          
          .pdw-nav-arrow { 
            width: 40px; 
            height: 40px; 
            background: rgba(255,255,255,.95);
          }
          .pdw-nav-prev { left: 10px; }
          .pdw-nav-next { right: 10px; }
          
          .pdw-dot { width: 50px; height: 50px; border-radius: 6px; }
          .pdw-alt-text-display {
            bottom: -60px;
            padding: 10px 12px;
            margin: 0 6px;
            border-radius: 10px;
          }
          .pdw-alt-text {
            font-size: 12px;
            line-height: 1.3;
          }
        }
      `}</style>
    </div>
  );
};

export default DetailsThumbWrapper;
