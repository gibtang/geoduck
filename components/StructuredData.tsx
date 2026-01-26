/**
 * Structured Data (JSON-LD) Component for SEO
 *
 * This component adds structured data to help search engines understand
 * your website content better, enabling rich snippets in search results.
 */

interface StructuredDataProps {
  data: Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization schema for brand identity
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GEO Platform',
    description:
      'Optimize your e-commerce products for AI-powered search engines like ChatGPT, Google SGE, and Bing Copilot.',
    url: 'https://thegeoduck.com',
    logo: 'https://thegeoduck.com/logo.png',
    sameAs: [
      'https://twitter.com/thegeoduck',
      'https://github.com/thegeoduck',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: 'https://thegeoduck.com/contact',
    },
  };

  return <StructuredData data={schema} />;
}

/**
 * WebApplication schema for the platform
 */
export function WebApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'GEO Platform',
    description:
      'Generative Engine Optimization platform for e-commerce products. Test, analyze, and optimize your product content for AI search engines.',
    url: 'https://thegeoduck.com',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier with 5 daily analyses',
    },
    featureList: [
      'AI search optimization',
      'Product catalog management',
      'Multi-model LLM testing',
      'Sentiment analysis',
      'Performance analytics',
      'Competitor tracking',
    ],
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
  };

  return <StructuredData data={schema} />;
}

/**
 * WebSite schema with search action
 */
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'GEO Platform',
    url: 'https://thegeoduck.com',
    description:
      'Optimize your e-commerce products for AI-powered search engines',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://thegeoduck.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return <StructuredData data={schema} />;
}

/**
 * BreadcrumbList schema for navigation
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <StructuredData data={schema} />;
}

/**
 * FAQPage schema for FAQ sections
 */
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSchema({ faqs }: { faqs: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <StructuredData data={schema} />;
}

/**
 * Article schema for blog posts (future use)
 */
export function ArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  authorName,
  imageUrl,
}: {
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  imageUrl?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: imageUrl || 'https://thegeoduck.com/og-image.png',
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'GEO Platform',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thegeoduck.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://thegeoduck.com',
    },
  };

  return <StructuredData data={schema} />;
}
