/* eslint-env jest */
import { generateProductStructuredData } from '../productStructuredData';

describe('generateProductStructuredData', () => {
  const mockProduct = {
    productTitle: 'Nokia-601 Red Cotton Poplin 146cm 125gsm Mercerized Fabric',
    image1CloudUrl: 'https://res.cloudinary.com/age-fabric/image/upload/v1769258644/epxegcord4h3fo74tm5j.jpg',
    shortProductDescription: 'Vibrant red cotton poplin with premium finishes, ideal for apparel and uniforms.',
    ratingValue: 4,
    ratingCount: 120
  };

  it('should generate correct structured data with all fields', () => {
    const result = generateProductStructuredData(mockProduct);

    expect(result).toEqual({
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "Nokia-601 Red Cotton Poplin 146cm 125gsm Mercerized Fabric",
      "image": "https://res.cloudinary.com/age-fabric/image/upload/v1769258644/epxegcord4h3fo74tm5j.jpg",
      "description": "Vibrant red cotton poplin with premium finishes, ideal for apparel and uniforms.",
      "brand": {
        "@type": "Brand",
        "name": "AGE"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4",
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": "120"
      }
    });
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalProduct = {
      productTitle: 'Test Product'
    };

    const result = generateProductStructuredData(minimalProduct);

    expect(result).toEqual({
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "Test Product",
      "image": "",
      "description": "",
      "brand": {
        "@type": "Brand",
        "name": "AGE"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4",
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": "0"
      }
    });
  });

  it('should return null for null product', () => {
    const result = generateProductStructuredData(null);
    expect(result).toBeNull();
  });

  it('should use fallback name field if productTitle is missing', () => {
    const product = {
      name: 'Fallback Product Name',
      shortProductDescription: 'Test description'
    };

    const result = generateProductStructuredData(product);
    expect(result.name).toBe('Fallback Product Name');
  });
});