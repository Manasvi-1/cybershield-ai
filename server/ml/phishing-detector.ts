export interface PhishingDetectionResult {
  score: number; // 0-100 probability of being phishing
  confidence: number; // AI confidence level
  suspiciousLinks: number;
  indicators: string[];
}

export class PhishingDetector {
  private phishingKeywords = [
    'urgent', 'verify', 'suspend', 'click here', 'act now', 'limited time',
    'confirm identity', 'update payment', 'security alert', 'account locked',
    'winner', 'congratulations', 'claim now', 'free', 'prize'
  ];

  private urgentPhrases = [
    'immediate action required', 'within 24 hours', 'expires today',
    'act immediately', 'time sensitive', 'last chance'
  ];

  private suspiciousDomains = [
    'bit.ly', 'tinyurl.com', 'shortened.link', 'temp-mail.org',
    'fake-bank.com', 'secure-verify.net', 'phishing.net'
  ];

  async analyzeEmail(content: string): Promise<PhishingDetectionResult> {
    const indicators: string[] = [];
    let score = 0;
    
    // Convert to lowercase for analysis
    const lowerContent = content.toLowerCase();
    
    // Check for phishing keywords
    const keywordMatches = this.phishingKeywords.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      score += keywordMatches.length * 15;
      indicators.push(`Suspicious keywords detected: ${keywordMatches.join(', ')}`);
    }

    // Check for urgent language
    const urgentMatches = this.urgentPhrases.filter(phrase => 
      lowerContent.includes(phrase.toLowerCase())
    );
    if (urgentMatches.length > 0) {
      score += urgentMatches.length * 25;
      indicators.push(`Urgent language patterns detected`);
    }

    // Check for suspicious links/domains
    const suspiciousLinks = this.extractSuspiciousLinks(content);
    if (suspiciousLinks > 0) {
      score += suspiciousLinks * 20;
      indicators.push(`Suspicious URL redirects found`);
    }

    // Check for poor grammar/spelling (simplified)
    if (this.hasPoorGrammar(content)) {
      score += 10;
      indicators.push('Poor grammar or spelling detected');
    }

    // Check for fake sender patterns
    if (this.hasFakeSender(content)) {
      score += 30;
      indicators.push('Suspicious sender domain detected');
    }

    // Cap score at 100
    score = Math.min(score, 100);
    
    // Calculate confidence based on number of indicators
    const confidence = Math.min(70 + (indicators.length * 8), 99);

    return {
      score,
      confidence,
      suspiciousLinks,
      indicators
    };
  }

  private extractSuspiciousLinks(content: string): number {
    let count = 0;
    
    // Look for suspicious domains
    this.suspiciousDomains.forEach(domain => {
      if (content.toLowerCase().includes(domain)) {
        count++;
      }
    });

    // Look for URL shorteners
    const urlShortenerPattern = /(bit\.ly|tinyurl|t\.co|goo\.gl|short\.link)/gi;
    const matches = content.match(urlShortenerPattern);
    if (matches) {
      count += matches.length;
    }

    return count;
  }

  private hasPoorGrammar(content: string): boolean {
    // Simple heuristics for poor grammar
    const sentences = content.split(/[.!?]+/);
    let issues = 0;
    
    sentences.forEach(sentence => {
      // Check for common grammar issues
      if (sentence.includes(' i ') && !sentence.includes(' I ')) issues++;
      if (sentence.match(/\s{2,}/)) issues++; // Multiple spaces
      if (sentence.match(/[a-z][A-Z]/)) issues++; // Missing spaces between words
    });

    return issues > 2;
  }

  private hasFakeSender(content: string): boolean {
    const suspiciousPatterns = [
      'fake-bank', 'secure-verify', 'account-update',
      'security-alert', 'urgent-notice', 'verify-account'
    ];
    
    return suspiciousPatterns.some(pattern => 
      content.toLowerCase().includes(pattern)
    );
  }
}
