// app/api/revalidate/route.js
//
// On-demand ISR webhook endpoint.
// Call this from your backend whenever content changes so pages
// are regenerated immediately instead of waiting for the revalidate window.
//
// POST /api/revalidate
// Body: {
//   "secret": "<REVALIDATE_SECRET env var>",
//   "slug":       "product-slug",     // revalidates /fabric/<slug>
//   "blogSlug":   "blog-slug-or-id",  // revalidates /blog-details/<slug>
//   "tag":        "cotton",           // revalidates /blog/tag/<tag>
//   "paths": ["/", "/about"]          // any extra paths
// }

import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

// ─── Static ISR pages (always revalidated on any webhook call) ────────────
const STATIC_ROUTES = [
  "/",
  "/fabric",
  "/blog",
  "/contact",
  "/capabilities",
  "/about",
  "/shop-category",
  "/search",
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { secret, slug, blogSlug, tag, paths = [] } = body;

    // ── Auth check ──────────────────────────────────────────────────────────
    const expectedSecret = process.env.REVALIDATE_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: invalid or missing secret" },
        { status: 401 }
      );
    }

    const revalidated = { staticRoutes: [], product: null, blog: null, tag: null, extra: [] };

    // ── Revalidate all static routes ────────────────────────────────────────
    for (const path of STATIC_ROUTES) {
      revalidatePath(path);
      revalidated.staticRoutes.push(path);
    }

    // ── Product detail page ─────────────────────────────────────────────────
    if (slug && typeof slug === "string") {
      const productPath = `/fabric/${slug.replace(/^\//, "")}`;
      revalidatePath(productPath);
      revalidated.product = productPath;
    }

    // ── Blog detail page ────────────────────────────────────────────────────
    if (blogSlug && typeof blogSlug === "string") {
      const blogPath = `/blog-details/${blogSlug.replace(/^\//, "")}`;
      revalidatePath(blogPath);
      revalidated.blog = blogPath;
    }

    // ── Blog tag page ───────────────────────────────────────────────────────
    if (tag && typeof tag === "string") {
      const tagPath = `/blog/tag/${encodeURIComponent(tag)}`;
      revalidatePath(tagPath);
      revalidated.tag = tagPath;
    }

    // ── Arbitrary extra paths from the webhook payload ──────────────────────
    if (Array.isArray(paths)) {
      for (const p of paths) {
        if (typeof p === "string" && p.startsWith("/")) {
          revalidatePath(p);
          revalidated.extra.push(p);
        }
      }
    }

    return NextResponse.json({ ok: true, revalidated });
  } catch (err) {
    console.error("[revalidate] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Convenience GET for quick health-check (no revalidation performed) ─────
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "ISR revalidation endpoint is live. Use POST with a valid secret to trigger revalidation.",
    routes: STATIC_ROUTES,
  });
}
