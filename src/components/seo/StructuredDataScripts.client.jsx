'use client';

import dynamic from 'next/dynamic';

const StructuredDataScripts = dynamic(
  () => import('@/components/seo/StructuredDataScripts'),
  { ssr: false }
);

export default function StructuredDataScriptsClient(props) {
  return <StructuredDataScripts {...props} />;
}
