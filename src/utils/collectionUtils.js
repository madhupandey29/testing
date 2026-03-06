// Collection utilities for matching products with collection media
'use client';

import { useState } from 'react';

// Cache for collection data to avoid repeated API calls
let collectionsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all collections from the API
 */
export const fetchCollections = async () => {
  try {
    // Check if we have valid cached data
    if (collectionsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return collectionsCache;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/collection`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      // Cache the collections
      collectionsCache = data.data;
      cacheTimestamp = Date.now();
      return data.data;
    }
    
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Get collection data by ID
 */
export const getCollectionById = async (collectionId) => {
  if (!collectionId) return null;
  
  const collections = await fetchCollections();
  return collections.find(collection => 
    collection.id === collectionId || 
    collection._id === collectionId
  ) || null;
};

/**
 * Extract collection ID from product
 */
export const getProductCollectionId = (product) => {
  if (!product) return null;
  
  // Try different possible collection ID fields
  return product.collectionId || 
         product.collection?.id || 
         product.collection_id || 
         null;
};

/**
 * Get collection media (image and video) for a product
 * First tries to use collection data from product response, falls back to API call
 */
export const getCollectionMediaForProduct = async (product) => {
  if (!product) {
    return {
      image: null,
      video: null,
      collectionName: null,
      altText: null,
      videoAltText: null
    };
  }

  // First, try to get collection data directly from product response
  if (product.collection) {
    return {
      image: product.collection.collectionImage1CloudUrlWeb || product.collection.collectionImage1CloudUrl || null,
      video: product.collection.collectionvideoURL || null,
      collectionName: product.collection.name || null,
      altText: product.collection.altTextCollectionImage1 || null,
      videoAltText: product.collection.collectionaltTextVideo || null
    };
  }

  // Fallback: try to fetch collection by ID if not included in product
  const collectionId = getProductCollectionId(product);
  
  if (!collectionId) {
    return {
      image: null,
      video: null,
      collectionName: null,
      altText: null,
      videoAltText: null
    };
  }
  
  const collection = await getCollectionById(collectionId);
  
  if (!collection) {
    return {
      image: null,
      video: null,
      collectionName: null,
      altText: null,
      videoAltText: null
    };
  }
  
  return {
    image: collection.collectionImage1CloudUrlWeb || collection.collectionImage1CloudUrl || null,
    video: collection.collectionvideoURL || null,
    collectionName: collection.name || null,
    altText: collection.altTextCollectionImage1 || null,
    videoAltText: collection.collectionaltTextVideo || null
  };
};

/**
 * Hook to get collection media for multiple products
 */
export const useCollectionMedia = () => {
  const [collectionsMap, setCollectionsMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  
  const getMediaForProducts = async (products) => {
    if (!products || products.length === 0) return;
    
    setLoading(true);
    
    try {
      const collections = await fetchCollections();
      const newMap = new Map();
      
      // Create a map of collection ID to collection data
      collections.forEach(collection => {
        newMap.set(collection.id, {
          image: collection.collectionImage1CloudUrlWeb || collection.collectionImage1CloudUrl || null,
          video: collection.collectionvideoURL || null,
          collectionName: collection.name || null,
          altText: collection.altTextCollectionImage1 || null,
          videoAltText: collection.collectionaltTextVideo || null
        });
      });
      
      setCollectionsMap(newMap);
    } catch (error) {
      // Silently ignore collection fetch errors - collections are optional enhancement
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getMediaForProduct = (product) => {
    const collectionId = getProductCollectionId(product);
    return collectionsMap.get(collectionId) || {
      image: null,
      video: null,
      collectionName: null,
      altText: null,
      videoAltText: null
    };
  };
  
  return {
    getMediaForProducts,
    getMediaForProduct,
    loading
  };
};