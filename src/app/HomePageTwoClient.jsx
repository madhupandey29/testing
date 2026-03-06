/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import FashionBanner from "@/components/banner/fashion-banner";

// ✅ Lazy load below-the-fold components
const PopularProducts = dynamic(
  () => import("@/components/products/fashion/popular-products"),
  { loading: () => <div style={{ minHeight: "500px" }} /> }
);
const WeeksFeatured = dynamic(
  () => import("@/components/products/fashion/weeks-featured"),
  { loading: () => <div style={{ minHeight: "400px" }} /> }
);
const FashionTestimonial = dynamic(
  () => import("@/components/testimonial/fashion-testimonial"),
  { loading: () => <div style={{ minHeight: "400px" }} /> }
);
const BlogArea = dynamic(() => import("@/components/blog/fashion/blog-area"), {
  loading: () => <div style={{ minHeight: "400px" }} />,
});
const FeatureAreaTwo = dynamic(
  () => import("@/components/features/feature-area-2"),
  { loading: () => <div style={{ minHeight: "200px" }} /> }
);
const Footer = dynamic(() => import("@/layout/footers/footer"), {
  loading: () => <div style={{ minHeight: "400px" }} />,
});

import { FiShare2 } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import { useGetOfficeInformationQuery } from "@/redux/features/officeInformationApi";

const FloatingChatbot = dynamic(() => import("@/components/chatbot/FloatingChatbot"), {
  ssr: false,
  loading: () => null,
});

export default function HomePageTwoClient() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { data: officeRes } = useGetOfficeInformationQuery();
  const office = officeRes?.data?.[0];

  useEffect(() => setMounted(true), []);

  // close on outside click / ESC
  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      const root = document.getElementById("age-social-share-root");
      if (root && e?.target && !root.contains(e.target)) setOpen(false);
    };

    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const links = useMemo(() => {
    const fb = office?.facebookUrl || "https://facebook.com";
    const ig = office?.instagramUrl || "https://instagram.com";
    const ln = office?.linkedinUrl || "https://linkedin.com";
    const yt = office?.youtubeUrl || "https://youtube.com";
    const tw = office?.xUrl || "https://twitter.com";

    return [
      { id: "fb", icon: <FaFacebookF />, color: "#1877F2", href: fb },
      { id: "ig", icon: <FaInstagram />, color: "#E1306C", href: ig },
      { id: "ln", icon: <FaLinkedinIn />, color: "#0A66C2", href: ln },
      { id: "yt", icon: <FaYoutube />, color: "#FF0000", href: yt },
      { id: "tw", icon: <FaXTwitter />, color: "#000000", href: tw },
    ];
  }, [office]);

  return (
    <Wrapper>
      <HeaderTwo />

      <FashionBanner />
      <PopularProducts />
      <WeeksFeatured />
      <FeatureAreaTwo />
      <FashionTestimonial />
      <BlogArea />

      {/* ✅ Social Share (Portal + unique class names) */}
      {mounted &&
        createPortal(
          <div id="age-social-share-root" className="age-social-root">
            <button
              type="button"
              className={`age-social-toggle ${open ? "is-open" : ""}`}
              aria-label="Share"
              title="Share"
              onClick={() => setOpen((v) => !v)}
            >
              <FiShare2 size={20} />
            </button>

            <ul className={`age-social-items ${open ? "show" : ""}`} aria-hidden={!open}>
              {links.map((s, i) => (
                <li
                  key={s.id}
                  className="age-social-item"
                  style={{
                    background: s.color,
                    "--d": `${i * 70}ms`, // ✅ stagger delay (reliable)
                  }}
                >
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.id}
                    title={s.id}
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}

      <Footer />
      <FloatingChatbot />
    </Wrapper>
  );
}
