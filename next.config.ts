import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permanent redirects — old Spanish URLs → new English URLs (301)
  async redirects() {
    return [
      { source: '/portafolio',    destination: '/portfolio',    permanent: true },
      { source: '/como-funciona', destination: '/how-it-works', permanent: true },
      { source: '/nosotros',      destination: '/about',        permanent: true },
      { source: '/servicios',     destination: '/services',     permanent: true },
      { source: '/seo-local',     destination: '/local-seo',    permanent: true },
      { source: '/contacto',      destination: '/contact',      permanent: true },
      { source: '/gracias',       destination: '/thank-you',    permanent: true },
    ];
  },
};

export default nextConfig;
