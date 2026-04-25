/* CodeAnalyzer.tsx
   Code analysis and improvement suggestions
*/
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Info, Lightbulb } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AnalysisResult {
  issues: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    line?: number;
  }>;
  suggestions: string[];
}

interface CodeAnalyzerProps {
  code: string;
  language?: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export default function CodeAnalyzer({ code, language = "javascript", onAnalysisComplete }: CodeAnalyzerProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCodeMutation = trpc.nexus.analyzeCode.useMutation();

  const handleAnalyze = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeCodeMutation.mutateAsync({
        code,
        language,
      });

      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-500/10 border-red-400/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-400/30";
      default:
        return "bg-blue-500/10 border-blue-400/30";
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !code.trim()}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-semibold"
      >
        {isAnalyzing ? "Analyzing..." : "Analyze Code"}
      </Button>

      {analysis && (
        <div className="space-y-4">
          {/* Issues */}
          {analysis.issues.length > 0 && (
            <Card className="bg-void-2 border-red-400/20 p-4">
              <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Issues Found ({analysis.issues.length})
              </h4>
              <div className="space-y-2">
                {analysis.issues.map((issue, idx) => (
                  <div key={idx} className={`p-3 rounded border ${getSeverityColor(issue.severity)}`}>
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-metal-silver">{issue.message}</p>
                        {issue.line && (
                          <p className="text-xs text-metal-silver/50 mt-1">Line {issue.line}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <Card className="bg-void-2 border-cyan-400/20 p-4">
              <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Suggestions ({analysis.suggestions.length})
              </h4>
              <div className="space-y-2">
                {analysis.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-3 rounded border border-cyan-400/30 bg-cyan-500/10">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-metal-silver leading-relaxed">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {analysis.issues.length === 0 && analysis.suggestions.length === 0 && (
            <Card className="bg-void-2 border-green-400/20 p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-metal-silver">No issues found! Code looks good.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
