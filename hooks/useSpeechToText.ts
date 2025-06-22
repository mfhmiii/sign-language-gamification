import { useState, useEffect, useCallback } from "react";

// Add type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
}

// Add global declarations
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type SpeechRecognitionStatus =
  | "inactive"
  | "listening"
  | "processing"
  | "error";

interface UseSpeechToTextReturn {
  transcript: string;
  status: SpeechRecognitionStatus;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<SpeechRecognitionStatus>("inactive");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports the Web Speech API
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "id-ID"; // Set to Indonesian language

      recognitionInstance.onstart = () => {
        setStatus("listening");
      };

      recognitionInstance.onresult = (event) => {
        setStatus("processing");
        const result = event.results[0][0].transcript;
        setTranscript(result);
        setStatus("inactive");
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setStatus("error");
      };

      recognitionInstance.onend = () => {
        if (status === "listening") {
          setStatus("inactive");
        }
      };

      setRecognition(recognitionInstance);
      setIsSupported(true);
    } else {
      console.warn("Speech recognition not supported in this browser");
      setIsSupported(false);
    }

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognition && status !== "listening") {
      try {
        recognition.start();
        console.log('Started listening');
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  }, [recognition, status]);

  const stopListening = useCallback(() => {
    if (recognition && status === "listening") {
      recognition.stop();
      setStatus("inactive");
      console.log('Stopped listening');
    }
  }, [recognition, status]);

  return {
    transcript,
    status,
    startListening,
    stopListening,
    isSupported,
  };
};
