import { Metadata } from 'next';

/**
 * Site configuration for SEO and metadata
 */
export const siteConfig = {
  name: 'GEO Platform',
  title: 'GEO Platform - Generative Engine Optimization',
  description:
    'Optimize your e-commerce products for AI-powered search engines. Improve visibility in ChatGPT, Google SGE, Bing Copilot, and other AI search experiences.',
  url: 'https://thegeoduck.com',
  ogImage: 'https://thegeoduck.com/og-image.png',
  links: {
    twitter: 'https://twitter.com/thegeoduck',
    github: 'https://github.com/thegeoduck',
  },
  author: {
    name: 'GEO Platform',
    url: 'https://thegeoduck.com',
  },
} as const;

/**
 * Base metadata template used across all pages
 */
export function createBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      template: '%s | GEO Platform',
      default: siteConfig.title,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    authors: [siteConfig.author],
    generator: 'Next.js',
    keywords: [
      'GEO',
      'Generative Engine Optimization',
      'AI search',
      'ChatGPT optimization',
      'Google SGE',
      'Bing Copilot',
      'e-commerce SEO',
      'AI-powered search',
      'product optimization',
      'online store optimization',
    ],
    referrer: 'origin-when-cross-origin',
    creator: siteConfig.author.name,
    publisher: siteConfig.author.name,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
      url: siteConfig.url,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.title,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.title,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
      creator: '@thegeoduck',
    },
  };
}

/**
 * Page-specific metadata helper
 */
interface PageMetadataOptions {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  additionalKeywords?: string[];
}

export function createPageMetadata(options: PageMetadataOptions): Metadata {
  const baseMetadata = createBaseMetadata();

  return {
    ...baseMetadata,
    title: options.title,
    description: options.description,
    keywords: options.additionalKeywords
      ? [...(baseMetadata.keywords as string[]), ...options.additionalKeywords]
      : baseMetadata.keywords,
    openGraph: {
      ...baseMetadata.openGraph,
      title: options.title,
      description: options.description,
      type: options.ogType || 'website',
      images: options.ogImage
        ? [
            {
              url: options.ogImage,
              width: 1200,
              height: 630,
              alt: options.title,
            },
          ]
        : baseMetadata.openGraph?.images,
    },
    twitter: {
      ...baseMetadata.twitter,
      title: options.title,
      description: options.description,
      images: options.ogImage ? [options.ogImage] : baseMetadata.twitter?.images,
    },
    robots: options.noIndex
      ? {
          index: false,
          follow: false,
        }
      : baseMetadata.robots,
  };
}

/**
 * Homepage metadata
 */
export function getHomepageMetadata(): Metadata {
  return createPageMetadata({
    title: 'GEO Platform - Optimize Your Products for AI Search',
    description:
      'Boost your e-commerce visibility in AI-powered search engines like ChatGPT, Google SGE, and Bing Copilot. Test, analyze, and optimize your product content with GEO Platform.',
    ogType: 'website',
    additionalKeywords: [
      'AI search optimization',
      'product testing',
      'content optimization',
      'e-commerce growth',
    ],
  });
}

/**
 * Dashboard metadata
 */
export function getDashboardMetadata(): Metadata {
  return createPageMetadata({
    title: 'Dashboard - GEO Platform',
    description:
      'Manage your products, test AI search performance, and analyze optimization results. Your central hub for generative engine optimization.',
    ogType: 'website',
    additionalKeywords: [
      'product management',
      'analytics dashboard',
      'performance tracking',
    ],
  });
}

/**
 * Products metadata
 */
export function getProductsMetadata(): Metadata {
  return createPageMetadata({
    title: 'Products - GEO Platform',
    description:
      'Manage and optimize your e-commerce product catalog for AI search engines. Add, edit, and test product descriptions for better GEO performance.',
    ogType: 'website',
    additionalKeywords: [
      'product catalog',
      'inventory management',
      'product descriptions',
    ],
  });
}

/**
 * Prompts metadata
 */
export function getPromptsMetadata(): Metadata {
  return createPageMetadata({
    title: 'Prompts - GEO Platform',
    description:
      'Test your products with AI-powered prompts. Simulate ChatGPT, Google SGE, and other AI search experiences to optimize your product content.',
    ogType: 'website',
    additionalKeywords: [
      'AI testing',
      'prompt engineering',
      'content testing',
      'ChatGPT simulation',
    ],
  });
}

/**
 * Results metadata
 */
export function getResultsMetadata(): Metadata {
  return createPageMetadata({
    title: 'Results - GEO Platform',
    description:
      'View detailed analytics and insights from your AI search optimization tests. Track performance, identify opportunities, and improve your GEO strategy.',
    ogType: 'website',
    additionalKeywords: [
      'analytics',
      'performance insights',
      'optimization results',
      'GEO reporting',
    ],
  });
}

/**
 * Authentication pages metadata (no-index)
 */
export function getAuthMetadata(pageName: string): Metadata {
  return createPageMetadata({
    title: `${pageName} - GEO Platform`,
    description: `Access your GEO Platform account to optimize your products for AI search engines.`,
    noIndex: true,
    additionalKeywords: ['authentication', 'login', 'signup'],
  });
}
