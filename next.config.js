/** @type {import('next').NextConfig} */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/* ---------- helpers ---------- */
const safeOrigin = (value, fallback = '') => {
  try {
    if (!value) return fallback;
    return new URL(value).origin;
  } catch {
    return fallback;
  }
};

// Security headers for fabric e-commerce site
const getSecurityHeaders = () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  // fallback keeps build stable even if env is missing
  const apiDomain = safeOrigin(apiBaseUrl, 'https://espobackend.vercel.app');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const siteDomain = safeOrigin(siteUrl, '');

  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://accounts.google.com https://vercel.live https://*.vercel.app https://vercel.com https://maps.googleapis.com https://maps.gstatic.com https://espobackend.vercel.app" +
          (siteDomain ? ` ${siteDomain}` : ''),
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com https://maps.gstatic.com data:",
        "img-src 'self' data: blob: https://res.cloudinary.com https://i.ibb.co https://lh3.googleusercontent.com https://img.youtube.com https://amritafashions.com https://test.amrita-fashions.com https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com",
        `connect-src 'self' ${apiDomain} https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://vitals.vercel-insights.com https://www.clarity.ms https://scripts.clarity.ms https://accounts.google.com https://www.youtube-nocookie.com https://maps.googleapis.com https://espo.egport.com https://espobackend.vercel.app` +
          (siteDomain ? ` ${siteDomain}` : ''),
        "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://www.google.com https://maps.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://espo.egport.com",
        "frame-ancestors 'self'",
        'upgrade-insecure-requests',
      ].join('; '),
    },
  ];
};

const nextConfig = {
  // helps if Next ever infers wrong root because of workspace files
  turbopack: { root: __dirname },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ibb.co', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
      { protocol: 'https', hostname: 'test.amrita-fashions.com', pathname: '/**' },
      { protocol: 'https', hostname: 'amritafashions.com', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '7000', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    loader: 'default',
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  async headers() {
    return [
      { source: '/((?!_next/static).*)', headers: getSecurityHeaders() },

      {
        source: '/assets/css/:path*',
        headers: [
          { key: 'Content-Type', value: 'text/css; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/_next/static/css/:path*',
        headers: [
          { key: 'Content-Type', value: 'text/css; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/js/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/assets/fonts/:path*.woff2',
        headers: [{ key: 'Content-Type', value: 'font/woff2' }],
      },
      {
        source: '/assets/fonts/:path*.ttf',
        headers: [{ key: 'Content-Type', value: 'font/ttf' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  typescript: { ignoreBuildErrors: true },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,

  experimental: {
    optimizePackageImports: [
      'react-icons/fa',
      'react-icons/fi',
      'react-icons/fa6',
      'react-icons/ai',
      'react-icons/bs',
      'react-icons/cg',
      'react-icons/tb',
      'framer-motion',
      'react-toastify',
    ],
    optimizeCss: true,
  },

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  modularizeImports: {
    'react-icons': { transform: 'react-icons/{{member}}' },
    'react-icons/fa': { transform: 'react-icons/fa/{{member}}' },
    'react-icons/fi': { transform: 'react-icons/fi/{{member}}' },
    'react-icons/fa6': { transform: 'react-icons/fa6/{{member}}' },
    'react-icons/ai': { transform: 'react-icons/ai/{{member}}' },
    'react-icons/bs': { transform: 'react-icons/bs/{{member}}' },
    'react-icons/cg': { transform: 'react-icons/cg/{{member}}' },
    'react-icons/tb': { transform: 'react-icons/tb/{{member}}' },
  },

  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react/jsx-runtime': 'react/jsx-runtime',
        'react/jsx-dev-runtime': 'react/jsx-dev-runtime',
      };

      config.ignoreWarnings = [
        /Event handlers cannot be passed to Client Component props/,
        /Functions cannot be passed directly to Client Components/,
        /Attempted import error/,
        { module: /node_modules/ },
      ];

      config.optimization = {
        ...config.optimization,
        usedExports: true,
        minimize: true,
        sideEffects: true,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 10,
          maxAsyncRequests: 10,
          minSize: 60000,
          maxSize: 120000,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 50,
              enforce: true,
              chunks: 'all',
              maxSize: 100000,
            },
            pdf: {
              name: 'pdf-libs',
              test: /[\\/]node_modules[\\/](jspdf|html2canvas|@react-pdf|pdfkit)[\\/]/,
              priority: 45,
              enforce: true,
              chunks: 'all',
            },
            swiper: {
              name: 'swiper',
              test: /[\\/]node_modules[\\/](swiper)[\\/]/,
              priority: 40,
              enforce: true,
              chunks: 'all',
            },
            redux: {
              name: 'redux',
              test: /[\\/]node_modules[\\/](@reduxjs|react-redux|redux)[\\/]/,
              priority: 35,
              enforce: true,
              chunks: 'all',
            },
            forms: {
              name: 'forms',
              test: /[\\/]node_modules[\\/](react-hook-form|yup|@hookform)[\\/]/,
              priority: 30,
              enforce: true,
              chunks: 'all',
            },
            icons: {
              name: 'icons',
              test: /[\\/]node_modules[\\/](react-icons)[\\/]/,
              priority: 28,
              enforce: true,
              chunks: 'all',
            },
            animations: {
              name: 'animations',
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              priority: 26,
              enforce: true,
              chunks: 'all',
            },
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              minChunks: 2,
              chunks: 'all',
              maxSize: 80000,
            },
            common: {
              name: 'common',
              minChunks: 3,
              priority: 10,
              reuseExistingChunk: true,
              chunks: 'all',
              maxSize: 60000,
            },
          },
        },
      };
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    return config;
  },

  async redirects() {
    return [];
  },
};

module.exports = withBundleAnalyzer(nextConfig);