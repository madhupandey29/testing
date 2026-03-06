'use client';

import dynamic from 'next/dynamic';

const ProductStructuredDataHead = dynamic(
  () => import('@/components/seo/ProductStructuredDataHead'),
  { ssr: false }
);

export default function ProductStructuredDataHeadClient(props) {
  return <ProductStructuredDataHead {...props} />;
}
