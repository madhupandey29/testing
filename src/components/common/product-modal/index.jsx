'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactModal from 'react-modal';
import { useRouter } from 'next/navigation';

import { handleModalClose } from '@/redux/features/productModalSlice';
import DetailsThumbWrapper from '@/components/product-details/details-thumb-wrapper';
import DetailsWrapper from '@/components/product-details/details-wrapper';
import { initialOrderQuantity } from '@/redux/features/cartSlice';

if (typeof window !== 'undefined') {
  ReactModal.setAppElement('body');
}

/* helpers */
const toUrl = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return toUrl(v[0]);
  if (typeof v === 'object') return toUrl(v.secure_url || v.url || v.path || v.key);
  return '';
};
const idOf = (v) => (v && typeof v === 'object' ? v._id : v);

/** Wide modal to show all thumbnails without scroll */
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    width: 'min(1300px, 98vw)',
    height: 'min(700px, 95vh)',
    padding: '16px 20px 18px',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 99999999,
  }
};

// Mobile-specific modal styles
const mobileStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    width: '92vw',
    maxWidth: '92vw',
    maxHeight: '92vh',
    padding: '10px 12px 12px',
    borderRadius: '8px',
    overflow: 'auto', // Allow scrolling on mobile
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 99999999,
  }
};

export default function ProductModal() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { productItem, isModalOpen, nonce } = useSelector((s) => s.productModal);
  
  // Mobile detection hook
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect to product page on mobile when modal opens
  useEffect(() => {
    if (isModalOpen && isMobile && productItem?.slug) {
      dispatch(handleModalClose());
      router.push(`/fabric/${productItem.slug}`);
    }
  }, [isModalOpen, isMobile, productItem?.slug, dispatch, router]);

  const normalized = useMemo(() => {
    const p = productItem || {};
    
    return {
      ...p,
      title: p.title || p.name || '',
      category: p.category || p.newCategoryId,
      structureId: p.structureId || idOf(p.substructure) || idOf(p.structure),
      contentId: p.contentId || idOf(p.content),
      finishId: p.finishId || idOf(p.subfinish) || idOf(p.finish),
      gsm: p.gsm ?? p.GSM,
      width: p.width ?? p.widthCm ?? p.Width,
      slug: p.slug || p._id,
    };
  }, [productItem]);

  const imageURLs = useMemo(() => {
    if (!productItem) return [];
    const items = [
      productItem?.img && { img: toUrl(productItem.img), type: 'image' },
      productItem?.image1 && { img: toUrl(productItem.image1), type: 'image' },
      productItem?.image2 && { img: toUrl(productItem.image2), type: 'image' },
    ].filter(Boolean);
    if (productItem?.video) items.push({ img: productItem?.videoThumbnail || '/assets/img/product/-video-thumb.png', type: 'video', video: toUrl(productItem.video) });
    return items;
  }, [productItem]);

  const mainImg = productItem?.img || imageURLs[0]?.img || '';
  const [activeImg, setActiveImg] = useState(mainImg);
  useEffect(() => {
    setActiveImg(mainImg);
    if (productItem) dispatch(initialOrderQuantity());
  }, [mainImg, productItem, dispatch]);

  const handleImageActive = (item) => setActiveImg(item.img);

  if (!normalized || !isModalOpen || isMobile) return null;

  const modalKey = `${normalized._id || normalized.slug || 'item'}-${nonce ?? 0}`;

  const goToDetails = (e) => {
    e?.preventDefault?.();
    dispatch(handleModalClose());
    router.push(`/fabric/${normalized.slug}`);
  };

  return (
    <ReactModal
      key={modalKey}
      isOpen
      onRequestClose={() => dispatch(handleModalClose())}
      style={isMobile ? mobileStyles : customStyles}
      shouldCloseOnOverlayClick
      bodyOpenClassName="ReactModal__Body--open"
      contentLabel="Product Modal"
    >
      {/* top bar with close button in corner */}
      <div className="pm-topbar" role="toolbar" aria-label="Quick view actions">
        <button
          type="button"
          className="tp-btn tp-btn-blue"
          onClick={goToDetails}
          aria-label="View fabric details"
        >
          View Details
        </button>
        <button
          onClick={() => dispatch(handleModalClose())}
          type="button"
          className="tp-product-modal-close-btn pm-close-btn"
          aria-label="Close quick view"
          title="Close"
        >
          ×
        </button>
      </div>

      {/* body grid */}
      <div className="pm-body" key={`content-${modalKey}`}>
        <div className="pm-media">
          <DetailsThumbWrapper
            key={`thumbs-${modalKey}`}
            activeImg={productItem?.img || activeImg}
            handleImageActive={handleImageActive}
            /* pass full product object for all image fields */
            apiImages={productItem}
            /* pass collection data as groupCodeData for compatibility */
            groupCodeData={productItem?.collection}
            /* explicit media props from backend */
            img={productItem?.img}
            image1={productItem?.image1}
            image2={productItem?.image2}
            image3={productItem?.image3}
            video={productItem?.video}
            videourl={productItem?.videourl}
            videoThumbnail={productItem?.videoThumbnail}
            /* keep extras merged after the primaries */
            imageURLs={imageURLs}
            /* larger viewer for modal to show all thumbnails */
            imgWidth={450}
            imgHeight={400}
            zoomPaneWidth={0}
            /* keep thumbs scrollable by giving them height */
            zoomPaneHeight={400}
            status={normalized?.status}
            /* keep videoId fallback for safety */
            videoId={productItem?.video}
            /* modal mode to show horizontal thumbnails */
            isModalView={true}
          />
        </div>

        <div className="pm-details">
          <DetailsWrapper
            key={`details-${modalKey}`}
            productItem={normalized}
            handleImageActive={handleImageActive}
            activeImg={activeImg}
          />
        </div>
      </div>

      {/* classy/clean look */}
      <style jsx>{`
        .pm-topbar{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom:4px; /* Even smaller margin */
          position: relative;
        }
        
        /* Close button positioned in top-right corner */
        .pm-close-btn {
          position: absolute !important;
          top: -12px;
          right: -12px;
          width: 36px !important;
          height: 36px !important;
          border-radius: 50% !important;
          background: #1e3a8a !important; /* Navy blue background */
          color: white !important; /* White icon */
          border: 2px solid white !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 20px !important; /* Larger font for visibility */
          font-weight: bold !important; /* Bold for better visibility */
          cursor: pointer !important;
          z-index: 1000 !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 8px rgba(30, 58, 138, 0.3) !important;
        }
        
        .pm-close-btn:hover {
          background: #1e40af !important; /* Darker navy on hover */
          transform: scale(1.1) !important;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4) !important;
        }
        
        /* Ensure the × symbol is visible */
        .pm-close-btn i {
          color: white !important;
          font-size: 20px !important;
          font-weight: bold !important;
        }

        .pm-body{
          display:grid;
          grid-template-columns: 1fr 1fr; /* Equal columns for media and details */
          gap:10px; /* Slightly smaller gap */
          height: calc(700px - 35px); /* A bit more height for content */
          overflow: hidden; /* No scroll bars */
        }

        .pm-media{
          display:flex;
          align-items:flex-start;
          justify-content:center;
          min-width:0;
          height:100%;
          overflow:hidden;
          background:#fff;
        }
        
        /* Force horizontal thumbnail layout in modal */
        .pm-media :global(.pdw-wrapper) {
          display: block !important;
          width: 100% !important;
        }
        
        .pm-media :global(.pdw-thumbs) {
          width: 100% !important;
          margin-bottom: 12px !important;
        }
        
        .pm-media :global(.pdw-thumbs-inner) {
          display: flex !important;
          flex-direction: row !important;
          gap: 8px !important;
          justify-content: flex-start !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          max-height: none !important;
          padding: 0 !important;
          scrollbar-width: thin !important;
        }
        
        .pm-media :global(.pdw-thumb) {
          width: 70px !important;
          height: 70px !important;
          flex: 0 0 auto !important;
        }
        
        .pm-media :global(.pdw-main) {
          width: 100% !important;
          max-width: 450px !important;
          margin: 0 auto !important;
        }

        .pm-details{
          min-width:0;
          height:100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 1px 3px 1px 1px; /* Even more minimal padding */
        }

        /* Typography & spacing - just slightly more compact */
        :global(.tp-product-details h1),
        :global(.tp-product-details h2){
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.1;
          margin: 0 0 3px 0; /* Slightly smaller margin */
          font-size: 1.2rem;
          max-width: 42ch;
        }

        :global(.tp-product-details .subheading),
        :global(.tp-product-details h5){
          font-weight: 600;
          letter-spacing: .01em;
          margin: 0 0 1px 0; /* Smaller margin */
          color: #111827;
          font-size: 0.8rem;
        }

        /* Two-column spec block - slightly more compact */
        :global(.tp-product-details .tp-product-details-meta){
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px 6px; /* Slightly smaller gaps */
          margin: 1px 0 3px; /* Smaller margins */
        }
        :global(.tp-product-details .tp-product-details-meta p){
          display:flex;
          justify-content: space-between;
          gap: 3px; /* Smaller gap */
          margin: 0;
          padding: 1px 0; /* Minimal padding */
          border-bottom: 1px dashed rgba(17,24,39,.08);
          font-size: 11px;
          line-height: 1.1;
        }
        :global(.tp-product-details .tp-product-details-meta p:last-child){
          border-bottom: none;
        }
        :global(.tp-product-details .tp-product-details-meta strong){
          color:#374151; font-weight:600;
        }
        :global(.tp-product-details .tp-product-details-meta span){
          color:#111827; font-weight:600;
        }

        /* Ratings row - minimal */
        :global(.tp-product-details .tp-product-details-rating){
          margin: 1px 0 1px; /* Minimal margins */
        }

        /* CTA row: ensure buttons are fully visible */
        :global(.tp-product-details .tp-product-details-action){
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px; /* Slightly smaller gap */
          margin-top: 3px; /* Smaller margin */
          margin-bottom: 1px; /* Minimal bottom margin */
        }
        :global(.tp-product-details .tp-product-details-action .tp-btn){
          height: 32px;
          border-radius: 5px;
          font-weight: 600;
          font-size: 11px;
          padding: 4px 8px;
        }

        /* Keep wishlist/heart floating block aligned */
        :global(.tp-product-details .tp-product-details-wishlist){
          margin-left: 3px; /* Smaller margin */
        }

        /* Responsiveness */
        @media (max-width: 1100px){
          .pm-body{ 
            grid-template-columns: 1fr;
            gap: 16px;
            height: auto;
            max-height: calc(95vh - 70px);
            overflow-y: auto;
          }
          
          .pm-media {
            order: 1;
          }
          
          .pm-details {
            order: 2;
            height: auto;
            max-height: 400px;
          }
          
          /* Keep horizontal thumbnails on smaller screens */
          .pm-media :global(.pdw-thumbs-inner) {
            justify-content: flex-start !important;
            overflow-x: auto !important;
            padding-bottom: 4px !important;
          }
          
          .pm-media :global(.pdw-thumb) {
            width: 60px !important;
            height: 60px !important;
          }
        }
        
        @media (max-width: 768px){
          .pm-body{
            gap: 8px;
            padding: 0 2px;
          }
          
          .pm-media :global(.pdw-main) {
            max-width: 100% !important;
          }
          
          .pm-media :global(.pdw-thumb) {
            width: 50px !important;
            height: 50px !important;
          }
          
          .pm-details {
            padding: 1px 3px 1px 1px; /* Ultra compact on mobile */
          }
          
          :global(.tp-product-details h1),
          :global(.tp-product-details h2){
            font-size: 1.1rem; /* Smaller on mobile */
            margin: 0 0 3px 0;
          }
          
          :global(.tp-product-details .tp-product-details-meta){
            grid-template-columns: 1fr;
            gap: 1px 6px; /* Ultra compact */
          }
          :global(.tp-product-details .tp-product-details-action){
            grid-template-columns: 1fr;
            gap: 4px; /* Minimal gap */
            margin-top: 3px;
          }
          :global(.tp-product-details .tp-product-details-action .tp-btn){
            height: 30px; /* Smaller on mobile */
            font-size: 10px;
            padding: 3px 6px;
          }
        }
        
        @media (max-width: 600px){
          .pm-topbar{
            gap: 8px;
            margin-bottom: 10px;
          }
          
          :global(.tp-btn){
            font-size: 12px !important;
            padding: 8px 14px !important;
          }
          
          .pm-media :global(.pdw-thumb) {
            width: 50px !important;
            height: 50px !important;
          }
        }
      `}</style>
    </ReactModal>
  );
}
