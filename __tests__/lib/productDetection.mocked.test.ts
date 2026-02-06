import { detectKeywordMentions, highlightKeywordMentions } from '@/lib/keywordDetection';

describe('Keyword Detection (Mocked)', () => {
  const mockKeywords = [
    {
      _id: '1',
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones',
    },
    {
      _id: '2',
      name: 'Gaming Laptop',
      description: 'Powerful gaming laptop',
    },
    {
      _id: '3',
      name: 'bluetooth',
      description: 'Bluetooth technology',
    },
  ];

  describe('detectKeywordMentions', () => {
    it('should detect keyword by name', () => {
      const response = 'I recommend the Wireless Headphones for music lovers.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].keyword.name).toBe('Wireless Headphones');
      expect(mentions[0].position).toBeGreaterThanOrEqual(0);
    });

    it('should detect keyword by name', () => {
      const response = 'This bluetooth device is excellent.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].keyword.name).toBe('bluetooth');
      expect(mentions[0].position).toBeGreaterThanOrEqual(0);
    });

    it('should detect multiple keywords', () => {
      const response = 'Compare Wireless Headphones and Gaming Laptop for best performance.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(2);
      expect(mentions[0].keyword.name).toBe('Wireless Headphones');
      expect(mentions[1].keyword.name).toBe('Gaming Laptop');
    });

    it('should be case insensitive', () => {
      const response = 'The WIRELESS HEADPHONES are great.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].keyword.name).toBe('Wireless Headphones');
    });

    it('should handle no matches', () => {
      const response = 'I recommend tablets and phones.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(0);
    });

    it('should extract context around mention', () => {
      const response = 'You should definitely buy the Wireless Headphones because they have great sound quality.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].context).toContain('Wireless Headphones');
    });

    it('should sort mentions by position', () => {
      const response = 'The Gaming Laptop beats Wireless Headphones in performance.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(2);
      expect(mentions[0].position).toBeLessThan(mentions[1].position);
    });

    it('should only mention each keyword once', () => {
      const response = 'Wireless Headphones and Wireless Headphones again';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
    });

    it('should detect sentiment - positive', () => {
      const response = 'The Wireless Headphones are excellent and amazing!';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].sentiment).toBe('positive');
    });

    it('should detect sentiment - negative', () => {
      const response = 'The Wireless Headphones are terrible and disappointing.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].sentiment).toBe('negative');
    });

    it('should detect sentiment - neutral', () => {
      const response = 'The Wireless Headphones are available in black.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].sentiment).toBe('neutral');
    });

    it('should handle mixed sentiment as neutral', () => {
      const response = 'The Wireless Headphones are great but have poor battery.';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].sentiment).toBe('neutral');
    });

    it('should detect keyword match with sentiment', () => {
      const response = 'This bluetooth device is fantastic!';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].keyword.name).toBe('bluetooth');
      expect(mentions[0].sentiment).toBe('positive');
    });

    it('should handle keyword with simple name', () => {
      const simpleKeyword = {
        _id: '4',
        name: 'Tablet',
        description: 'A tablet device',
      };
      const response = 'Get a Tablet today';
      const mentions = detectKeywordMentions(response, [simpleKeyword]);

      expect(mentions).toHaveLength(1);
      expect(mentions[0].keyword.name).toBe('Tablet');
    });

    it('should handle very short response', () => {
      const response = 'Tablet';
      const mentions = detectKeywordMentions(response, mockKeywords);

      expect(mentions).toHaveLength(0);
    });
  });

  describe('highlightKeywordMentions', () => {
    it('should highlight keyword name', () => {
      const mentions = [
        {
          keyword: mockKeywords[0],
          position: 19,
          sentiment: 'positive' as const,
          context: 'the Wireless Headphones for',
        },
      ];
      const response = 'I recommend the Wireless Headphones for music.';
      const highlighted = highlightKeywordMentions(response, mentions);

      expect(highlighted).toContain('**Wireless Headphones**');
    });

    it('should highlight keyword name', () => {
      const mentions = [
        {
          keyword: mockKeywords[2], // bluetooth keyword
          position: 10,
          sentiment: 'positive' as const,
          context: 'This bluetooth device',
        },
      ];
      const response = 'This bluetooth device is great';
      const highlighted = highlightKeywordMentions(response, mentions);

      expect(highlighted).toContain('**bluetooth**');
    });

    it('should highlight multiple mentions', () => {
      const mentions = [
        {
          keyword: mockKeywords[0],
          position: 19,
          sentiment: 'positive' as const,
          context: 'Wireless Headphones',
        },
        {
          keyword: mockKeywords[1],
          position: 45,
          sentiment: 'neutral' as const,
          context: 'Gaming Laptop',
        },
      ];
      const response = 'Compare Wireless Headphones and Gaming Laptop';
      const highlighted = highlightKeywordMentions(response, mentions);

      expect(highlighted).toContain('**Wireless Headphones**');
      expect(highlighted).toContain('**Gaming Laptop**');
    });

    it('should handle response with no mentions', () => {
      const response = 'No keywords mentioned here';
      const highlighted = highlightKeywordMentions(response, []);

      expect(highlighted).toBe(response);
    });
  });
});
