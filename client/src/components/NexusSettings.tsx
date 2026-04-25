/**
 * NexusSettings.tsx
 * Settings panel for Nexus AI — uncensored mode toggle, safety controls (Phase 6).
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Settings, AlertTriangle, Shield, ShieldOff } from "lucide-react";

interface NexusSettingsProps {
  conversationId: number | null;
  uncensoredMode: boolean;
  onUncensoredModeChange: (value: boolean) => void;
}

export default function NexusSettings({
  conversationId,
  uncensoredMode,
  onUncensoredModeChange,
}: NexusSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingUncensored, setPendingUncensored] = useState(false);

  const updateSettingsMutation = trpc.nexus.updateConversationSettings.useMutation();

  const handleUncensoredToggle = () => {
    if (!uncensoredMode) {
      // Show consent warning before enabling
      setPendingUncensored(true);
      setShowWarning(true);
    } else {
      // Disable immediately
      applyUncensoredMode(false);
    }
  };

  const applyUncensoredMode = (value: boolean) => {
    onUncensoredModeChange(value);
    if (conversationId) {
      updateSettingsMutation.mutate({
        conversationId,
        uncensoredMode: value,
      });
    }
    setShowWarning(false);
    setPendingUncensored(false);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className={`border-cyan-400/30 transition-all ${
          isOpen ? "text-cyan-400 bg-cyan-400/10" : "text-metal-silver/60 hover:text-cyan-400"
        }`}
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-72 z-50 border border-cyan-400/20 rounded-lg bg-void-2 backdrop-blur-sm shadow-xl shadow-black/50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Nexus Settings
          </h3>

          {/* Uncensored Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {uncensoredMode ? (
                  <ShieldOff className="w-4 h-4 text-orange-400" />
                ) : (
                  <Shield className="w-4 h-4 text-cyan-400" />
                )}
                <div>
                  <p className="text-sm text-metal-silver">Uncensored Mode</p>
                  <p className="text-xs text-metal-silver/40">
                    {uncensoredMode ? "Content filtering disabled" : "Content filtering enabled"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleUncensoredToggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  uncensoredMode ? "bg-orange-500" : "bg-cyan-600/40"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${
                    uncensoredMode ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {uncensoredMode && (
              <div className="flex items-start gap-2 px-2 py-1.5 rounded bg-orange-400/10 border border-orange-400/30">
                <AlertTriangle className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                <p className="text-xs text-orange-300">
                  Uncensored mode is active. Nexus will respond without content restrictions.
                  All responses are logged.
                </p>
              </div>
            )}
          </div>

          {/* Consent warning modal */}
          {showWarning && (
            <div className="space-y-3 p-3 rounded border border-orange-400/40 bg-orange-400/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-400">Enable Uncensored Mode?</p>
                  <p className="text-xs text-metal-silver/60 mt-1">
                    This will disable content filtering for this conversation. Nexus may produce
                    unfiltered responses. All interactions in uncensored mode are logged.
                    You must be 18+ to use this feature.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => applyUncensoredMode(true)}
                  size="sm"
                  className="flex-1 h-7 text-xs bg-orange-500 hover:bg-orange-400 text-white"
                >
                  I Understand, Enable
                </Button>
                <Button
                  onClick={() => { setShowWarning(false); setPendingUncensored(false); }}
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-metal-silver/60"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="border-t border-cyan-400/10 pt-3">
            <p className="text-xs text-metal-silver/40">
              Settings apply to the current conversation only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
