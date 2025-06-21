import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileUpload } from "@/components/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { queryClient } from "@/lib/queryClient";
import type { DeepfakeAnalysisResult, DeepfakeAnalysis } from "@/lib/types";

export default function DeepfakeDetection() {
  const [recentResults, setRecentResults] = useState<DeepfakeAnalysisResult[]>([]);

  const { data: analysisHistory } = useQuery<DeepfakeAnalysis[]>({
    queryKey: ['/api/analysis/deepfake', { limit: 10 }],
  });

  const handleFileAnalyzed = (result: DeepfakeAnalysisResult) => {
    setRecentResults(prev => [result, ...prev.slice(0, 4)]);
    queryClient.invalidateQueries({ queryKey: ['/api/analysis/deepfake'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-success";
    if (confidence >= 70) return "text-warning";
    return "text-destructive";
  };

  const getAuthenticityBadge = (isDeepfake: boolean, confidence: number) => {
    if (isDeepfake) {
      return (
        <Badge variant="destructive" className="bg-destructive text-white">
          DEEPFAKE
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-success text-white">
          AUTHENTIC
        </Badge>
      );
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* File Uploader */}
      <Card className="bg-surface border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Media Upload for Deepfake Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFileAnalyzed={handleFileAnalyzed}
            accept={{
              'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
              'video/*': ['.mp4', '.avi', '.mov', '.wmv']
            }}
          />
        </CardContent>
      </Card>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <Card className="bg-surface border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Latest Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentResults.map((result, index) => (
                <div key={index} className="p-4 bg-background rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">Analysis #{index + 1}</h4>
                    {getAuthenticityBadge(result.isDeepfake, result.confidence)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">
                        {result.isDeepfake ? 'Deepfake Score' : 'Authenticity Score'}
                      </span>
                      <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                        {result.confidence}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Processing Time</span>
                      <span className="text-sm text-white">{result.processingTime}s</span>
                    </div>
                    {result.anomalies.length > 0 && (
                      <div>
                        <span className="text-sm text-text-secondary">Anomalies Found:</span>
                        <p className="text-xs text-white mt-1">
                          {result.anomalies.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis History */}
      <Card className="bg-surface border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          {analysisHistory && analysisHistory.length > 0 ? (
            <div className="space-y-3">
              {analysisHistory.map((analysis) => (
                <div key={analysis.id} className="p-4 bg-background rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-white">{analysis.fileName}</h4>
                      {getAuthenticityBadge(analysis.isDeepfake, analysis.confidence)}
                    </div>
                    <span className="text-xs text-text-secondary">
                      {new Date(analysis.analyzedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Confidence</span>
                      <p className={`font-medium ${getConfidenceColor(analysis.confidence)}`}>
                        {analysis.confidence}%
                      </p>
                    </div>
                    <div>
                      <span className="text-text-secondary">File Size</span>
                      <p className="text-white">
                        {(analysis.fileSize / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Processing Time</span>
                      <p className="text-white">{analysis.processingTime}s</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">File Type</span>
                      <p className="text-white">{analysis.fileType}</p>
                    </div>
                  </div>

                  {analysis.anomalies && Array.isArray(analysis.anomalies) && analysis.anomalies.length > 0 && (
                    <div className="mt-3 p-2 bg-warning/20 border border-warning rounded">
                      <p className="text-xs text-warning font-medium">Anomalies Detected:</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {analysis.anomalies.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-secondary py-8">
              <p>No analysis history available</p>
              <p className="text-sm mt-2">Upload media files to start detecting deepfakes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
