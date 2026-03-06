'use client';

import React from 'react';
import ProductDetailsArea from '@/components/product-details/product-details-area';
import ProductDetailsLoader from '@/components/loader/prd-details-loader';
import ErrorMsg from '@/components/common/error-msg';
import { useGetSingleNewProductQuery } from '@/redux/features/newProductApi';

function mapBackendProductToFrontend(p) {
  if (!p) return null;

  let mainImg = (p.image1CloudUrlWeb && typeof p.image1CloudUrlWeb === 'string' ? p.image1CloudUrlWeb.replace(/#$/, '') : p.image1CloudUrlWeb) || p.img || p.image || '';
  let img1 = (p.image1CloudUrlWeb && typeof p.image1CloudUrlWeb === 'string' ? p.image1CloudUrlWeb.replace(/#$/, '') : p.image1CloudUrlWeb) || p.image1 || '';
  let img2 = (p.image2CloudUrlWeb && typeof p.image2CloudUrlWeb === 'string' ? p.image2CloudUrlWeb.replace(/#$/, '') : p.image2CloudUrlWeb) || p.image2 || '';
  let img3 = (p.image3CloudUrlWeb && typeof p.image3CloudUrlWeb === 'string' ? p.image3CloudUrlWeb.replace(/#$/, '') : p.image3CloudUrlWeb) || p.image3 || '';
  const videoUrl = p.videoURL || p.videourl || p.video || '';
  const poster = p.videoThumbnail || '';

  const images = [
    mainImg && { type: 'image', img: mainImg },
    img1 && { type: 'image', img: img1 },
    img2 && { type: 'image', img: img2 },
    img3 && { type: 'image', img: img3 },
  ].filter(Boolean);

  if (videoUrl || poster) {
    images.push({ type: 'video', img: poster || mainImg || img1 || img2 || img3, video: videoUrl });
  }

  const mappedProduct = {
    _id: p.id || p._id,
    slug: p.productslug || p.slug,
    name: p.name,
    productTitle: p.productTitle,
    productTagline: p.productTagline || '',
    shortProductDescription: p.shortProductDescription || '',
    fullProductDescription: p.fullProductDescription || p.description || '',
    img: mainImg,
    image1: img1,
    image2: img2,
    image3: img3,
    video: videoUrl,
    videourl: videoUrl,
    videoThumbnail: poster,
    color: p.color || p.colors || [],
    colors: p.colors || p.color || [],
    motif: p.motif || p.motifsize || null,
    motifId: (p.motif && p.motif._id) || p.motif || p.motifsize || null,
    imageURLs: images,
    videoId: videoUrl,
    
    altTextImage1: p.altTextImage1 || null,
    altTextImage2: p.altTextImage2 || null,
    altTextImage3: p.altTextImage3 || null,
    altTextVideo: p.altTextVideo || null,
    
    price: p.salesPrice || p.price,
    description: p.fullProductDescription || p.description || p.productdescription || '',
    shortDescription: p.shortProductDescription || '',
    status: p.status || 'in-stock',
    sku: p.sku || p.fabricCode,
    category: p.category || '',
    categoryId: p.category?._id || '',
    structure: p.structure || '',
    structureId: p.structure?._id || p.structure || '',
    content: p.content || [],
    contentId: p.content?._id || p.content || '',
    finish: p.finish || [],
    finishId: p.finish?._id || p.finish || '',
    design: p.design || '',
    designId: p.design?._id || p.design || '',
    motifsizeId: p.motif?._id || p.motif || '',
    suitableforId: p.subsuitable?._id || p.subsuitable || '',
    vendorId: p.vendor?._id || p.vendor || '',
    collectionId: p.collectionId || p.collection?.id || '',
    collection: p.collection || null,
    gsm: p.gsm,
    oz: p.ozs || p.oz,
    cm: p.cm,
    inch: p.inch,
    productIdentifier: p.productIdentifier || p.fabricCode,
    fabricCode: p.fabricCode, // Preserve original fabricCode field
    vendorFabricCode: p.vendorFabricCode, // Preserve vendor fabric code
    width: p.cm
      ? `${p.cm} cm`
      : p.inch
        ? `${p.inch} inch`
        : 'N/A',
    tags: p.tags || p.merchTags || [],
    offerDate: p.offerDate || { endDate: null },
    additionalInformation: p.additionalInformation || [],
    highlights: p.highlights || [],
    productQ1: p.productQ1,
    productA1: p.productA1,
    productQ2: p.productQ2,
    productA2: p.productA2,
    productQ3: p.productQ3,
    productA3: p.productA3,
    productQ4: p.productQ4,
    productA4: p.productA4,
    productQ5: p.productQ5,
    productA5: p.productA5,
    productQ6: p.productQ6,
    productA6: p.productA6,
    ratingCount: p.ratingCount,
    ratingValue: p.ratingValue,
    keywords: p.keywords || [],
    supplyModel: p.supplyModel,
    salesMOQ: p.salesMOQ,
    uM: p.uM,
    suitability: p.suitability || [],
    aiTempOutput: p.aiTempOutput || '',
    subsuitable: p.subsuitable || [],
  };

  return mappedProduct;
}

export default function ProductDetailsClient({ productId }) {
  console.log('ProductDetailsClient rendered with productId:', productId);
  
  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetSingleNewProductQuery(productId);

  console.log('Query state:', { 
    hasData: !!data?.data, 
    isLoading, 
    isError, 
    errorStatus: error?.status,
    errorMessage: error?.message 
  });

  if (isLoading) {
    return <ProductDetailsLoader />;
  }
  
  if (isError) {
    console.error('Product query error:', error);
    return <ErrorMsg msg={`Error loading product: ${error?.status || 'Unknown error'}`} />;
  }
  
  if (!data?.data) {
    console.log('No product data found for ID:', productId);
    return <ErrorMsg msg="No product found!" />;
  }

  const product = mapBackendProductToFrontend(data.data);

  if (!product) {
    return <ErrorMsg msg="Product data could not be processed" />;
  }

  console.log('Product loaded successfully:', product.name || product.productTitle);
  return <ProductDetailsArea product={product} />;
}