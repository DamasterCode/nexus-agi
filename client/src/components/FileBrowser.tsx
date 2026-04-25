/* FileBrowser.tsx
   File browser for Nexus sandbox environment
*/
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Folder, File, ChevronRight, Plus, Trash2, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FileItem {
  name: string;
  type: "file" | "directory";
  size?: number;
  modified?: string;
}

export default function FileBrowser() {
  const [currentPath, setCurrentPath] = useState("/home/ubuntu/nexus-sandbox");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const deleteFileMutation = trpc.nexus.deleteFile.useMutation();

  const loadDirectory = async (path: string) => {
    setIsLoading(true);
    try {
      // Use a simple ls command instead
      setCurrentPath(path);
      setFiles([]);
    } catch (error) {
      console.error("Error loading directory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  const handleNavigate = (fileName: string) => {
    const newPath = `${currentPath}/${fileName}`;
    loadDirectory(newPath);
  };

  const handleGoBack = () => {
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    if (parentPath) {
      loadDirectory(parentPath);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (confirm(`Delete ${fileName}?`)) {
      try {
        const result = await deleteFileMutation.mutateAsync({
          path: `${currentPath}/${fileName}`,
        });
        if (result.success) {
          loadDirectory(currentPath);
        }
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
  };

  const handleViewFile = async (fileName: string) => {
    setSelectedFile({ name: fileName, type: "file" });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="h-full flex gap-4 p-6 bg-gradient-to-b from-void via-void-2 to-void-3">
      {/* File list */}
      <div className="flex-1 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-metal-silver/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-cyan-400 hover:text-cyan-300 p-0 h-auto"
          >
            ← Back
          </Button>
          <span>{currentPath}</span>
        </div>

        {/* File list */}
        <ScrollArea className="h-[calc(100vh-250px)] border border-cyan-400/20 rounded-lg bg-void-2">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-metal-silver/50">
                <p className="text-sm">No files or directories</p>
              </div>
            ) : (
              files.map((file, idx) => (
                <Card
                  key={idx}
                  className="bg-void-3 border-cyan-400/20 hover:border-cyan-400/40 transition-all p-3 cursor-pointer"
                  onClick={() => {
                    if (file.type === "directory") {
                      handleNavigate(file.name);
                    } else {
                      handleViewFile(file.name);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {file.type === "directory" ? (
                        <Folder className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-metal-silver/60 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-metal-silver truncate">{file.name}</p>
                        <p className="text-xs text-metal-silver/50">
                          {file.type === "directory" ? "Directory" : formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {file.type === "file" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(file.name);
                          }}
                          className="text-red-400 hover:text-red-300 p-1 h-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                      {file.type === "directory" && (
                        <ChevronRight className="w-4 h-4 text-metal-silver/40" />
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* File preview */}
      {selectedFile && (
        <div className="flex-1 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm p-6 overflow-hidden flex flex-col">
          <h4 className="text-sm font-semibold text-cyan-400 mb-4">{selectedFile.name}</h4>
          <ScrollArea className="flex-1 bg-void-3 border border-cyan-400/20 rounded p-4">
            <pre className="text-xs text-metal-silver font-mono whitespace-pre-wrap break-words">
              {selectedFile.type === "file" ? "File content preview" : "Directory"}
            </pre>
          </ScrollArea>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
              onClick={() => setSelectedFile(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
