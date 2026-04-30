import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://saborweb.com';

const routes = [
  { path: '/', priority: 1 },
  { path: '/services', priority: 0.9 },
  { path: '/portfolio', priority: 0.85 },
  { path: '/how-it-works', priority: 0.8 },
  { path: '/local-seo', priority: 0.8 },
  { path: '/about', priority: 0.65 },
  { path: '/contact', priority: 0.75 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.flatMap((route) => {
    const englishPath = route.path === '/' ? '' : route.path;
    const spanishPath = route.path === '/' ? '/es' : `/es${route.path}`;
    const alternates = {
      languages: {
        en: `${siteUrl}${englishPath}`,
        es: `${siteUrl}${spanishPath}`,
      },
    };

    return [
      {
        url: `${siteUrl}${englishPath}`,
        lastModified,
        changeFrequency: route.path === '/' ? 'weekly' : 'monthly',
        priority: route.priority,
        alternates,
      },
      {
        url: `${siteUrl}${spanishPath}`,
        lastModified,
        changeFrequency: route.path === '/' ? 'weekly' : 'monthly',
        priority: route.priority,
        alternates,
      },
    ];
  });
}
