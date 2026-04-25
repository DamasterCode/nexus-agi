import { useState, useCallback, useRef, useEffect } from "react";

interface UseTextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

export function useTextToSpeech(
  options: UseTextToSpeechOptions = {}
): UseTextToSpeechReturn {
  const {
    rate = 1,
    pitch = 1,
    volume = 1,
    language = "en-US",
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if Web Speech Synthesis API is supported
    const SpeechSynthesisUtterance =
      (window as any).SpeechSynthesisUtterance ||
      (window as any).webkitSpeechSynthesisUtterance;

    if (SpeechSynthesisUtterance && window.speechSynthesis) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      // Cancel any ongoing speech
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        // Ignore cancel errors
      }

      const SpeechSynthesisUtterance =
        (window as any).SpeechSynthesisUtterance ||
        (window as any).webkitSpeechSynthesisUtterance;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.lang = language;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event: any) => {
        // Ignore interrupted errors (common when speech is cancelled and restarted)
        if (event.error !== "interrupted") {
          console.error("Speech synthesis error:", event.error);
        }
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err: any) {
        console.error("Failed to speak:", err.message);
        setIsSpeaking(false);
      }
    },
    [isSupported, rate, pitch, volume, language]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPaused]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
  };
}
