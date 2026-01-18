import { detectProductMentions, highlightProductMentions } from '@/lib/productDetection';

describe('Product Detection', () => {
  const mockProducts = [
    {
      _id: '1',
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones',
      keywords: ['bluetooth', 'noise-cancelling', 'audio'],
    },
    {
      _id: '2',
      name: 'Gaming Laptop',
      description: 'Powerful gaming laptop',
      keywords: ['gaming', 'RTX', 'portable'],
    },
  ];

  describe('detectProductMentions', () => {
    it('should detect product by name', () => {
      const response = 'I recommend the Wireless Headphones for music lovers.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].product.name).toBe('Wireless Headphones');
      expect(mentions[0].position).toBeGreaterThanOrEqual(0);
    });

    it('should detect product by keyword', () => {
      const response = 'This bluetooth device is excellent.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].product.name).toBe('Wireless Headphones');
    });

    it('should detect multiple products', () => {
      const response = 'Compare Wireless Headphones and Gaming Laptop for best performance.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(2);
      expect(mentions[0].product.name).toBe('Wireless Headphones');
      expect(mentions[1].product.name).toBe('Gaming Laptop');
    });

    it('should be case insensitive', () => {
      const response = 'The WIRELESS HEADPHONES are great.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].product.name).toBe('Wireless Headphones');
    });

    it('should handle no matches', () => {
      const response = 'I recommend tablets and phones.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(0);
    });

    it('should extract context around mention', () => {
      const response = 'You should definitely buy the Wireless Headphones because they have great sound quality and comfort.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].context).toContain('Wireless Headphones');
      expect(mentions[0].context.length).toBeLessThanOrEqual(120); // term.length + 100 (50 on each side)
    });

    it('should handle context at start of response', () => {
      const response = 'Wireless Headphones are the best choice for audio.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].context).toContain('Wireless Headphones');
    });

    it('should handle context at end of response', () => {
      const response = 'For the best audio experience, get Wireless Headphones';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].context).toContain('Wireless Headphones');
    });

    it('should sort mentions by position', () => {
      const response = 'The Gaming Laptop beats Wireless Headphones in performance.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(2);
      expect(mentions[0].product.name).toBe('Gaming Laptop');
      expect(mentions[1].product.name).toBe('Wireless Headphones');
    });

    it('should only mention each product once', () => {
      const response = 'Wireless Headphones and Wireless Headphones again';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
    });

    it('should detect sentiment - positive', () => {
      const response = 'The Wireless Headphones are excellent and amazing!';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].sentiment).toBe('positive');
    });

    it('should detect sentiment - negative', () => {
      const response = 'The Wireless Headphones are terrible and disappointing.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].sentiment).toBe('negative');
    });

    it('should detect sentiment - neutral', () => {
      const response = 'The Wireless Headphones are available in black.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].sentiment).toBe('neutral');
    });

    it('should handle mixed sentiment as neutral', () => {
      const response = 'The Wireless Headphones are great but have poor battery.';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].sentiment).toBe('neutral');
    });

    it('should detect keyword match with sentiment', () => {
      const response = 'This bluetooth device is fantastic!';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].product.name).toBe('Wireless Headphones');
      expect(mentions[0].sentiment).toBe('positive');
    });

    it('should handle empty keywords array', () => {
      const productWithoutKeywords = {
        _id: '3',
        name: 'Tablet',
        description: 'A tablet device',
        keywords: [],
      };
      const response = 'Get a Tablet today';
      const mentions = detectProductMentions(response, [productWithoutKeywords]);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].product.name).toBe('Tablet');
    });

    it('should handle very short response', () => {
      const response = 'Tablet';
      const mentions = detectProductMentions(response, mockProducts);

      expect(mentions).toHaveLength(0);
    });
  });

  describe('highlightProductMentions', () => {
    it('should highlight product name', () => {
      const mentions = [
        {
          product: mockProducts[0],
          position: 19,
          sentiment: 'positive' as const,
          context: 'the Wireless Headphones for',
        },
      ];
      const response = 'I recommend the Wireless Headphones for music.';
      const highlighted = highlightProductMentions(response, mentions);

      expect(highlighted).toContain('**Wireless Headphones**');
    });

    it('should highlight product keywords', () => {
      const mentions = [
        {
          product: mockProducts[0],
          position: 10,
          sentiment: 'positive' as const,
          context: 'This bluetooth device',
        },
      ];
      const response = 'This bluetooth device is great';
      const highlighted = highlightProductMentions(response, mentions);

      expect(highlighted).toContain('**bluetooth**');
    });

    it('should highlight multiple mentions', () => {
      const mentions = [
        {
          product: mockProducts[0],
          position: 19,
          sentiment: 'positive' as const,
          context: 'Wireless Headphones',
        },
        {
          product: mockProducts[1],
          position: 45,
          sentiment: 'neutral' as const,
          context: 'Gaming Laptop',
        },
      ];
      const response = 'Compare Wireless Headphones and Gaming Laptop';
      const highlighted = highlightProductMentions(response, mentions);

      expect(highlighted).toContain('**Wireless Headphones**');
      expect(highlighted).toContain('**Gaming Laptop**');
    });

    it('should be case insensitive when highlighting', () => {
      const mentions = [
        {
          product: mockProducts[0],
          position: 19,
          sentiment: 'positive' as const,
          context: 'WIRELESS HEADPHONES',
        },
      ];
      const response = 'The WIRELESS HEADPHONES are great';
      const highlighted = highlightProductMentions(response, mentions);

      expect(highlighted).toContain('**WIRELESS HEADPHONES**');
    });

    it('should handle response with no mentions', () => {
      const response = 'No products mentioned here';
      const highlighted = highlightProductMentions(response, []);

      expect(highlighted).toBe(response);
    });
  });
});
