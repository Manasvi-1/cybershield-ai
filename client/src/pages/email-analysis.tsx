import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { PhishingAnalysisResult, PhishingAnalysis } from "@/lib/types";

export default function EmailAnalysis() {
  const [emailContent, setEmailContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<PhishingAnalysisResult | null>(null);
  const { toast } = useToast();

  const { data: recentAnalyses } = useQuery<PhishingAnalysis[]>({
    queryKey: ['/api/analysis/phishing', { limit: 5 }],
  });

  const analyzeEmailMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/analyze/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setAnalysisResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/phishing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      if (result.score >= 70) {
        toast({
          title: "High Risk Detected",
          description: `This email has a ${result.score}% phishing probability`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze email content",
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeEmail = () => {
    if (!emailContent.trim()) {
      toast({
        title: "Email Content Required",
        description: "Please enter email content to analyze",
        variant: "destructive",
      });
      return;
    }
    
    analyzeEmailMutation.mutate(emailContent);
  };

  const getRiskColor = (score: number) => {
    if (score >= 90) return "text-destructive";
    if (score >= 70) return "text-destructive";
    if (score >= 50) return "text-warning";
    return "text-success";
  };

  const getRiskLevel = (score: number) => {
    if (score >= 90) return "CRITICAL";
    if (score >= 70) return "HIGH";
    if (score >= 50) return "MEDIUM";
    return "LOW";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Email Analyzer */}
      <Card className="bg-surface border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Email Content Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email Content
            </label>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              className="w-full h-40 bg-background border-gray-700 text-white placeholder-gray-500 resize-none"
              placeholder="Paste email content here for phishing analysis..."
            />
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={handleAnalyzeEmail}
              disabled={analyzeEmailMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {analyzeEmailMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Email
                </>
              )}
            </Button>
            <Button variant="secondary" className="bg-gray-700 hover:bg-gray-600">
              <Upload className="mr-2 h-4 w-4" />
              Upload .eml File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card className="bg-surface border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-background rounded-lg">
                <div className={`text-2xl font-bold mb-2 ${getRiskColor(analysisResult.score)}`}>
                  {analysisResult.score}%
                </div>
                <p className="text-sm text-text-secondary">Phishing Risk</p>
                <p className={`text-xs font-medium ${getRiskColor(analysisResult.score)}`}>
                  {getRiskLevel(analysisResult.score)}
                </p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-2xl font-bold text-warning mb-2">
                  {analysisResult.suspiciousLinks}
                </div>
                <p className="text-sm text-text-secondary">Suspicious Links</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">
                  {analysisResult.confidence}%
                </div>
                <p className="text-sm text-text-secondary">AI Confidence</p>
              </div>
            </div>

            {analysisResult.indicators.length > 0 && (
              <div className="space-y-4">
                <Alert className="bg-destructive/20 border-destructive">
                  <AlertDescription>
                    <h4 className="font-semibold text-white mb-2 flex items-center">
                      <div className="w-2 h-2 bg-destructive rounded-full mr-2" />
                      Risk Indicators Detected
                    </h4>
                    <ul className="text-sm text-text-secondary space-y-1">
                      {analysisResult.indicators.map((indicator, index) => (
                        <li key={index}>• {indicator}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Analyses */}
      <Card className="bg-surface border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAnalyses && recentAnalyses.length > 0 ? (
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="p-3 bg-background rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">
                        {analysis.content.slice(0, 100)}...
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-text-secondary">
                        <span>Score: {analysis.score}%</span>
                        <span>Confidence: {analysis.confidence}%</span>
                        <span>{new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getRiskColor(analysis.score)} bg-opacity-20`}>
                      {getRiskLevel(analysis.score)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-secondary py-8">
              <p>No analyses performed yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
