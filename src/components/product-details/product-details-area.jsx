'use client';
import React from 'react';

import ErrorMsg                     from '../common/error-msg';
import ProductDetailsBreadcrumb     from '../breadcrumb/product-details-breadcrumb';
import ProductDetailsContent        from './product-details-content';

/* -------------------------------------------------------------------- */
/*  ProductDetailsArea                                                  */
/* -------------------------------------------------------------------- */
const ProductDetailsArea = ({ product }) => {
  /* handle missing product after hooks have run */
  if (!product) return <ErrorMsg msg="No product found!" />;

  const breadcrumbTitle = product.productTitle || product.title || product.name || 'Product';

  return (
    <>
      <ProductDetailsBreadcrumb
        title={breadcrumbTitle}
      />
      <ProductDetailsContent productItem={product} />
    </>
  );
};

export default ProductDetailsArea;
