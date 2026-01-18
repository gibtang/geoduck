import Product from '../models/Product';

interface ProductMentionDetection {
  product: any;
  position: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
}

export function detectProductMentions(
  response: string,
  products: any[]
): ProductMentionDetection[] {
  const mentions: ProductMentionDetection[] = [];
  const responseLower = response.toLowerCase();

  products.forEach((product) => {
    const productName = product.name.toLowerCase();
    const keywords = product.keywords.map((k: string) => k.toLowerCase());
    const allSearchTerms = [productName, ...keywords];

    for (const term of allSearchTerms) {
      const index = responseLower.indexOf(term);

      if (index !== -1) {
        const contextStart = Math.max(0, index - 50);
        const contextEnd = Math.min(response.length, index + term.length + 50);
        const context = response.substring(contextStart, contextEnd);

        const sentiment = analyzeSentiment(context, response);

        mentions.push({
          product,
          position: index,
          sentiment,
          context: context.trim(),
        });

        break;
      }
    }
  });

  mentions.sort((a, b) => a.position - b.position);

  return mentions;
}

function analyzeSentiment(context: string, fullResponse: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'excellent',
    'great',
    'amazing',
    'best',
    'outstanding',
    'perfect',
    'highly recommend',
    'love',
    'fantastic',
    'superior',
    'top',
    'quality',
    'reliable',
    'impressive',
  ];

  const negativeWords = [
    'poor',
    'bad',
    'terrible',
    'worst',
    'avoid',
    'disappointing',
    'flawed',
    'inferior',
    'unreliable',
    'issues',
    'problems',
    'difficult',
    'expensive',
  ];

  const contextLower = context.toLowerCase();

  const hasPositive = positiveWords.some((word) => contextLower.includes(word));
  const hasNegative = negativeWords.some((word) => contextLower.includes(word));

  if (hasPositive && !hasNegative) return 'positive';
  if (hasNegative && !hasPositive) return 'negative';
  if (hasPositive && hasNegative) return 'neutral';

  return 'neutral';
}

export function highlightProductMentions(
  response: string,
  mentions: ProductMentionDetection[]
): string {
  let highlightedResponse = response;

  mentions.forEach((mention) => {
    const productName = mention.product.name;
    const keywords = mention.product.keywords;

    const regex = new RegExp(`(${productName}|${keywords.join('|')})`, 'gi');

    highlightedResponse = highlightedResponse.replace(regex, '**$1**');
  });

  return highlightedResponse;
}
