import { redirect, permanentRedirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL; // https://espobackend.vercel.app/api
const SITE_FILTER = process.env.NEXT_PUBLIC_SITE_FILTER; // catalogue

function buildFromPath(pathArr) {
  return "/" + (pathArr || []).join("/");
}

function searchParamsToString(searchParams) {
  const usp = new URLSearchParams();

  if (!searchParams || typeof searchParams !== "object") return "";

  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, String(x)));
    else usp.set(k, String(v));
  }

  return usp.toString();
}

function appendQuery(toUrl, searchParams) {
  const qs = searchParamsToString(searchParams);
  if (!qs) return toUrl;
  return toUrl.includes("?") ? `${toUrl}&${qs}` : `${toUrl}?${qs}`;
}

export default async function RedirectCatchAll({ params, searchParams }) {
  const fromPath = buildFromPath(params?.path);

  if (!API_BASE) return notFound();

  // If your backend doesn't support from/site filtering, you can just call `${API_BASE}/redirect`
  const url = `${API_BASE}/redirect?site=${encodeURIComponent(
    SITE_FILTER || ""
  )}&from=${encodeURIComponent(fromPath)}`;

  let res;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (e) {
    return notFound();
  }

  if (!res.ok) return notFound();

  const json = await res.json();
  const rules = Array.isArray(json?.data) ? json.data : [];

  const exact = rules.find(
    (r) =>
      r?.isActive &&
      r?.matchType === "exact" &&
      (r?.fromPath || "").toLowerCase() === fromPath.toLowerCase()
  );

  const prefix = rules
    .filter((r) => r?.isActive && r?.matchType === "prefix")
    .sort((a, b) => (b?.priority || 0) - (a?.priority || 0))
    .find((r) =>
      fromPath.toLowerCase().startsWith((r?.fromPath || "").toLowerCase())
    );

  const rule = exact || prefix;
  if (!rule) return notFound();

  let target = rule.toUrl || "/";
  if (rule.preserveQuery) target = appendQuery(target, searchParams);

  const code = String(rule.statusCode || "301");
  if (code === "301" || code === "308") permanentRedirect(target);

  redirect(target);
}
