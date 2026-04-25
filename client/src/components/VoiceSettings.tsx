import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, X } from "lucide-react";

interface VoiceSettingsProps {
  language: string;
  speechRate: number;
  volume: number;
  onLanguageChange: (lang: string) => void;
  onSpeechRateChange: (rate: number) => void;
  onVolumeChange: (vol: number) => void;
}

export default function VoiceSettings({
  language,
  speechRate,
  volume,
  onLanguageChange,
  onSpeechRateChange,
  onVolumeChange,
}: VoiceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en-US", label: "English (US)" },
    { code: "en-GB", label: "English (UK)" },
    { code: "es-ES", label: "Spanish" },
    { code: "fr-FR", label: "French" },
    { code: "de-DE", label: "German" },
    { code: "it-IT", label: "Italian" },
    { code: "ja-JP", label: "Japanese" },
    { code: "zh-CN", label: "Chinese (Simplified)" },
  ];

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
      >
        <Settings className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-void-2 border border-cyan-400/30 rounded-lg p-4 space-y-4 z-50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-cyan-400">Voice Settings</h3>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-xs text-metal-silver/60">Language</label>
            <select
              value={language}
              onChange={e => onLanguageChange(e.target.value)}
              className="w-full bg-void-3 border border-cyan-400/20 rounded px-2 py-1 text-xs text-metal-silver focus:border-cyan-400/60 focus:outline-none"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-metal-silver/60">Speech Rate</label>
              <span className="text-xs text-cyan-400">{speechRate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={e => onSpeechRateChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-void-3 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-metal-silver/60">Volume</label>
              <span className="text-xs text-cyan-400">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={e => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-void-3 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="text-xs text-metal-silver/40 border-t border-cyan-400/20 pt-3">
            <p>Changes apply to new responses</p>
          </div>
        </div>
      )}
    </div>
  );
}
