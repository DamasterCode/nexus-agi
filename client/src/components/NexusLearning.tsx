/* NexusLearning.tsx
   Self-learning and code improvement tracking for Nexus
*/
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Code2, TrendingUp, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LearningEntry {
  id: number;
  improvementType: string;
  originalCode?: string;
  improvedCode?: string;
  suggestion?: string;
  createdAt: Date;
}

export default function NexusLearning() {
  const [learningLogs, setLearningLogs] = useState<LearningEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LearningEntry | null>(null);

  // Fetch learning logs
  const { data: logs, refetch } = trpc.nexus.getLearningLogs.useQuery();

  useEffect(() => {
    if (logs) {
      setLearningLogs(logs as LearningEntry[]);
    }
  }, [logs]);

  const getImprovementIcon = (type: string) => {
    switch (type) {
      case "code_generation":
        return <Code2 className="w-4 h-4" />;
      case "optimization":
        return <TrendingUp className="w-4 h-4" />;
      case "bug_fix":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getImprovementColor = (type: string) => {
    switch (type) {
      case "code_generation":
        return "bg-blue-500/20 text-blue-300 border-blue-400/50";
      case "optimization":
        return "bg-green-500/20 text-green-300 border-green-400/50";
      case "bug_fix":
        return "bg-purple-500/20 text-purple-300 border-purple-400/50";
      default:
        return "bg-cyan-500/20 text-cyan-300 border-cyan-400/50";
    }
  };

  return (
    <div className="h-full flex gap-4 p-6 bg-gradient-to-b from-void via-void-2 to-void-3">
      {/* Learning logs list */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-cyan-400">Learning History</h3>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3 pr-4">
            {learningLogs.length === 0 ? (
              <div className="text-center py-12 text-metal-silver/50">
                <p className="text-sm">No learning logs yet. Start coding to track improvements!</p>
              </div>
            ) : (
              learningLogs.map(log => (
                <Card
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`bg-void-2 border-cyan-400/20 hover:border-cyan-400/40 transition-all cursor-pointer p-4 ${
                    selectedLog?.id === log.id ? "border-cyan-400/60 bg-cyan-400/10" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-cyan-400">{getImprovementIcon(log.improvementType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getImprovementColor(log.improvementType)}`}
                        >
                          {log.improvementType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {log.suggestion && (
                        <p className="text-xs text-metal-silver/70 line-clamp-2">{log.suggestion}</p>
                      )}
                      <p className="text-xs text-metal-silver/50 mt-2">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail view */}
      {selectedLog && (
        <div className="flex-1 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm p-6 overflow-hidden flex flex-col">
          <h4 className="text-sm font-semibold text-cyan-400 mb-4">
            {selectedLog.improvementType.replace(/_/g, " ").toUpperCase()}
          </h4>

          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {selectedLog.originalCode && (
                <div>
                  <p className="text-xs text-metal-silver/60 mb-2">Original Code</p>
                  <pre className="bg-void-3 border border-cyan-400/20 rounded p-3 text-xs text-metal-silver overflow-x-auto font-mono">
                    <code>{selectedLog.originalCode}</code>
                  </pre>
                </div>
              )}

              {selectedLog.improvedCode && (
                <div>
                  <p className="text-xs text-metal-silver/60 mb-2">Improved Code</p>
                  <pre className="bg-green-900/20 border border-green-400/30 rounded p-3 text-xs text-green-300 overflow-x-auto font-mono">
                    <code>{selectedLog.improvedCode}</code>
                  </pre>
                </div>
              )}

              {selectedLog.suggestion && (
                <div className="bg-cyan-400/10 border border-cyan-400/30 rounded p-4">
                  <p className="text-xs text-cyan-300 font-semibold mb-2">Suggestion</p>
                  <p className="text-xs text-metal-silver leading-relaxed">{selectedLog.suggestion}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="mt-4 pt-4 border-t border-cyan-400/20 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
              onClick={() => setSelectedLog(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
