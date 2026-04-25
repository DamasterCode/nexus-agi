/**
 * ModelSelector.tsx
 * UI panel for managing local/offline model configurations (Phase 5).
 * Supports Ollama, llama.cpp, and custom OpenAI-compatible API endpoints.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cpu, Plus, Trash2, CheckCircle, Circle, Wifi, WifiOff, ChevronDown, ChevronUp } from "lucide-react";

type ModelType = "ollama" | "llama_cpp" | "api" | "local";

const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  ollama: "Ollama",
  llama_cpp: "llama.cpp",
  api: "Custom API",
  local: "Local",
};

const MODEL_TYPE_DESCRIPTIONS: Record<ModelType, string> = {
  ollama: "Run models locally via Ollama (recommended)",
  llama_cpp: "Run GGUF models via llama.cpp server",
  api: "Connect to any OpenAI-compatible API",
  local: "Other local model server",
};

interface ModelSelectorProps {
  onClose?: () => void;
}

export default function ModelSelector({ onClose }: ModelSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState({
    modelName: "",
    modelType: "ollama" as ModelType,
    endpoint: "",
    apiKey: "",
  });
  const [ollamaEndpoint, setOllamaEndpoint] = useState("");

  const { data: modelConfigs, refetch: refetchConfigs } = trpc.nexus.getModelConfigs.useQuery();
  const { data: activeModel, refetch: refetchActive } = trpc.nexus.getActiveModelConfig.useQuery();
  const { data: ollamaHealth } = trpc.nexus.checkOllamaHealth.useQuery(
    { endpoint: ollamaEndpoint || undefined },
    { refetchInterval: 10000 }
  );
  const { data: ollamaModels } = trpc.nexus.listOllamaModels.useQuery(
    { endpoint: ollamaEndpoint || undefined },
    { enabled: ollamaHealth?.isOnline ?? false }
  );

  const createModelMutation = trpc.nexus.createModelConfig.useMutation({
    onSuccess: () => {
      refetchConfigs();
      setShowAddForm(false);
      setNewModel({ modelName: "", modelType: "ollama", endpoint: "", apiKey: "" });
    },
  });

  const setActiveMutation = trpc.nexus.setActiveModelConfig.useMutation({
    onSuccess: () => {
      refetchActive();
      refetchConfigs();
    },
  });

  const deleteMutation = trpc.nexus.deleteModelConfig.useMutation({
    onSuccess: () => {
      refetchConfigs();
      refetchActive();
    },
  });

  const handleAddModel = () => {
    if (!newModel.modelName.trim()) return;
    createModelMutation.mutate({
      modelName: newModel.modelName,
      modelType: newModel.modelType,
      endpoint: newModel.endpoint || undefined,
      settings: newModel.apiKey ? { apiKey: newModel.apiKey } : undefined,
    });
  };

  const handleAddOllamaModel = (modelName: string) => {
    createModelMutation.mutate({
      modelName,
      modelType: "ollama",
      endpoint: ollamaEndpoint || undefined,
    });
  };

  return (
    <div className="border border-cyan-400/20 rounded-lg bg-void-2/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-cyan-400/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-400">Model</span>
          <span className="text-xs text-metal-silver/60 ml-1">
            {activeModel
              ? `${activeModel.modelName} (${MODEL_TYPE_LABELS[activeModel.modelType as ModelType]})`
              : "Forge / Gemini (default)"}
          </span>
          {ollamaHealth?.isOnline ? (
            <Wifi className="w-3 h-3 text-green-400" title="Ollama online" />
          ) : (
            <WifiOff className="w-3 h-3 text-metal-silver/40" title="Ollama offline" />
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-metal-silver/60" />
        ) : (
          <ChevronDown className="w-4 h-4 text-metal-silver/60" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-cyan-400/10">
          {/* Default model indicator */}
          <div className="pt-3">
            <button
              onClick={() => setActiveMutation.mutate({ modelConfigId: -1 })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded border transition-colors ${
                !activeModel
                  ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-400"
                  : "border-cyan-400/20 text-metal-silver/60 hover:border-cyan-400/40 hover:text-metal-silver"
              }`}
            >
              <div className="flex items-center gap-2">
                {!activeModel ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                <span className="text-sm">Forge / Gemini 2.5 Flash (default)</span>
              </div>
              <span className="text-xs opacity-60">Cloud</span>
            </button>
          </div>

          {/* Saved model configs */}
          {modelConfigs && modelConfigs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-metal-silver/40 uppercase tracking-wider">Saved Models</p>
              {modelConfigs.map(config => (
                <div
                  key={config.id}
                  className={`flex items-center justify-between px-3 py-2 rounded border transition-colors ${
                    activeModel?.id === config.id
                      ? "border-cyan-400/60 bg-cyan-400/10"
                      : "border-cyan-400/20 hover:border-cyan-400/40"
                  }`}
                >
                  <button
                    onClick={() => setActiveMutation.mutate({ modelConfigId: config.id })}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {activeModel?.id === config.id ? (
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-metal-silver/40" />
                    )}
                    <div>
                      <p className={`text-sm ${activeModel?.id === config.id ? "text-cyan-400" : "text-metal-silver"}`}>
                        {config.modelName}
                      </p>
                      <p className="text-xs text-metal-silver/40">
                        {MODEL_TYPE_LABELS[config.modelType as ModelType]}
                        {config.endpoint ? ` • ${config.endpoint}` : ""}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ modelConfigId: config.id })}
                    className="p-1 text-metal-silver/40 hover:text-red-400 transition-colors"
                    title="Remove model"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ollama auto-discovery */}
          {ollamaHealth?.isOnline && ollamaModels && ollamaModels.models.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-green-400 uppercase tracking-wider flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Ollama Models Available
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {ollamaModels.models.map(modelName => {
                  const alreadySaved = modelConfigs?.some(c => c.modelName === modelName && c.modelType === "ollama");
                  return (
                    <div key={modelName} className="flex items-center justify-between px-2 py-1 rounded bg-green-400/5 border border-green-400/20">
                      <span className="text-xs text-metal-silver">{modelName}</span>
                      {!alreadySaved && (
                        <button
                          onClick={() => handleAddOllamaModel(modelName)}
                          className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      )}
                      {alreadySaved && (
                        <span className="text-xs text-metal-silver/40">Saved</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ollama endpoint override */}
          <div className="space-y-1">
            <p className="text-xs text-metal-silver/40">Ollama URL (optional)</p>
            <Input
              value={ollamaEndpoint}
              onChange={e => setOllamaEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
              className="h-7 text-xs bg-void-3 border-cyan-400/20 text-metal-silver placeholder-metal-silver/30"
            />
          </div>

          {/* Add model form toggle */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center gap-2 text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add model manually
          </button>

          {showAddForm && (
            <div className="space-y-2 p-3 rounded border border-cyan-400/20 bg-void-3">
              <select
                value={newModel.modelType}
                onChange={e => setNewModel({ ...newModel, modelType: e.target.value as ModelType })}
                className="w-full text-xs bg-void-3 border border-cyan-400/20 rounded px-2 py-1.5 text-metal-silver"
              >
                {(Object.keys(MODEL_TYPE_LABELS) as ModelType[]).map(type => (
                  <option key={type} value={type}>
                    {MODEL_TYPE_LABELS[type]} — {MODEL_TYPE_DESCRIPTIONS[type]}
                  </option>
                ))}
              </select>

              <Input
                value={newModel.modelName}
                onChange={e => setNewModel({ ...newModel, modelName: e.target.value })}
                placeholder={
                  newModel.modelType === "ollama"
                    ? "e.g. llama3, mistral, codellama"
                    : newModel.modelType === "llama_cpp"
                    ? "e.g. local"
                    : "e.g. gpt-4, claude-3"
                }
                className="h-7 text-xs bg-void-3 border-cyan-400/20 text-metal-silver placeholder-metal-silver/30"
              />

              {(newModel.modelType === "ollama" || newModel.modelType === "llama_cpp" || newModel.modelType === "api") && (
                <Input
                  value={newModel.endpoint}
                  onChange={e => setNewModel({ ...newModel, endpoint: e.target.value })}
                  placeholder={
                    newModel.modelType === "ollama"
                      ? "http://localhost:11434 (optional)"
                      : newModel.modelType === "llama_cpp"
                      ? "http://localhost:8080 (optional)"
                      : "https://api.example.com"
                  }
                  className="h-7 text-xs bg-void-3 border-cyan-400/20 text-metal-silver placeholder-metal-silver/30"
                />
              )}

              {newModel.modelType === "api" && (
                <Input
                  value={newModel.apiKey}
                  onChange={e => setNewModel({ ...newModel, apiKey: e.target.value })}
                  placeholder="API Key"
                  type="password"
                  className="h-7 text-xs bg-void-3 border-cyan-400/20 text-metal-silver placeholder-metal-silver/30"
                />
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleAddModel}
                  disabled={!newModel.modelName.trim() || createModelMutation.isPending}
                  size="sm"
                  className="flex-1 h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-black"
                >
                  {createModelMutation.isPending ? "Adding..." : "Add Model"}
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-metal-silver/60"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
