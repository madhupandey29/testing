'use client';
import React from 'react';
import Link from 'next/link';
import { SmDot } from '@/svg';

const CompactUniversalBreadcrumb = ({ items }) => {
  return (
    <section className="breadcrumb__area breadcrumb__style-2 include-bg pt-20 pb-10">
      <div className="container">
        <div className="row">
          <div className="col-xxl-12">
            <div className="breadcrumb__content p-relative z-index-1">
              <div className="breadcrumb__list has-icon">
                <span className="breadcrumb-icon">
                  <SmDot />{" "}
                </span>
                {items.map((item, index) => (
                  <span key={index} style={index === items.length - 1 ? { wordBreak: 'break-word', whiteSpace: 'normal' } : {}}>
                    {item.href ? (
                      <Link href={item.href}>{item.label}</Link>
                    ) : (
                      item.label
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompactUniversalBreadcrumb;
