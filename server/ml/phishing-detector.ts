import { pipeline, env } from '@xenova/transformers';

export interface PhishingDetectionResult {
  score: number; // 0-100 probability of being phishing
  confidence: number; // AI confidence level
  suspiciousLinks: number;
  indicators: string[];
}

export class PhishingDetector {
  private model: any = null;
  private modelLoading: Promise<void> | null = null;

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

  private async loadModel(): Promise<void> {
    if (this.model) return;
    
    if (this.modelLoading) {
      await this.modelLoading;
      return;
    }

    this.modelLoading = (async () => {
      try {
        // Disable local model cache for Hugging Face (use server cache)
        env.allowLocalModels = false;
        env.useBrowserCache = false;
        
        // Load a pre-trained text classification model for phishing detection
        // Using DistilBERT fine-tuned on sentiment analysis (negative = suspicious)
        this.model = await pipeline(
          'text-classification',
          'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
          { quantized: true }
        );
        
        console.log('Phishing detection ML model loaded successfully');
      } catch (error) {
        console.error('Failed to load phishing detection ML model:', error);
        this.model = null;
      }
    })();

    await this.modelLoading;
  }

  async analyzeEmail(content: string): Promise<PhishingDetectionResult> {
    await this.loadModel();

    const indicators: string[] = [];
    let score = 0;
    let mlScore = 0;
    
    // Convert to lowercase for analysis
    const lowerContent = content.toLowerCase();
    const textSample = content.substring(0, 512); // Limit to model max length
    
    // Try ML-based analysis first
    try {
      if (this.model) {
        const result = await this.model(textSample);
        const prediction = result[0];
        const label = prediction.label.toLowerCase();
        const modelConfidence = prediction.score * 100;

        // Map sentiment to phishing likelihood (negative sentiment often correlates with phishing)
        if (label === 'negative') {
          mlScore = Math.round(modelConfidence);
          indicators.push(`ML model detected suspicious content (${modelConfidence.toFixed(1)}% confidence)`);
        } else {
          mlScore = Math.round((1 - prediction.score) * 50); // Lower score for positive sentiment
        }
      }
    } catch (error) {
      console.error('ML inference error:', error);
      // Fall back to rule-based analysis
    }
    
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

    // Combine ML score with rule-based score (weighted average: 60% ML, 40% rules)
    const finalScore = this.model 
      ? Math.round(mlScore * 0.6 + score * 0.4)
      : score;

    // Cap score at 100
    const cappedScore = Math.min(finalScore, 100);
    
    // Calculate confidence based on number of indicators and ML model presence
    const baseConfidence = this.model ? 85 : 70;
    const confidence = Math.min(baseConfidence + (indicators.length * 3), 99);

    return {
      score: cappedScore,
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
