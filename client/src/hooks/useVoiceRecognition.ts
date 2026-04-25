import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const {
    language = "en-US",
    continuous = false,
    interimResults = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();

      const recognition = recognitionRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.language = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            final += transcript + " ";
          } else {
            interim += transcript;
          }
        }

        setInterimTranscript(interim);
        if (final) {
          setTranscript((prev) => prev + final);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          setError(event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, interimResults, language]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        setInterimTranscript("");
        setError(null);
        recognitionRef.current.start();
      } catch (err: any) {
        // Ignore "already started" errors
        if (err.name !== "InvalidStateError") {
          setError(err.message);
        }
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
}
