import Keyword from '../models/Keyword';

interface KeywordMentionDetection {
  keyword: any;
  position: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
}

export function detectKeywordMentions(
  response: string,
  keywords: any[]
): KeywordMentionDetection[] {
  const mentions: KeywordMentionDetection[] = [];
  const responseLower = response.toLowerCase();

  keywords.forEach((keyword) => {
    const keywordName = keyword.name.toLowerCase();
    const keywordTerms = keyword.keywords.map((k: string) => k.toLowerCase());
    const allSearchTerms = [keywordName, ...keywordTerms];

    for (const term of allSearchTerms) {
      const index = responseLower.indexOf(term);

      if (index !== -1) {
        const contextStart = Math.max(0, index - 50);
        const contextEnd = Math.min(response.length, index + term.length + 50);
        const context = response.substring(contextStart, contextEnd);

        const sentiment = analyzeSentiment(context, response);

        mentions.push({
          keyword,
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

export function highlightKeywordMentions(
  response: string,
  mentions: KeywordMentionDetection[]
): string {
  let highlightedResponse = response;

  mentions.forEach((mention) => {
    const keywordName = mention.keyword.name;
    const keywordTerms = mention.keyword.keywords;

    const regex = new RegExp(`(${keywordName}|${keywordTerms.join('|')})`, 'gi');

    highlightedResponse = highlightedResponse.replace(regex, '**$1**');
  });

  return highlightedResponse;
}
