"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionAlternativeLike = { transcript: string };
type SpeechRecognitionResultItemLike = ArrayLike<SpeechRecognitionAlternativeLike> & {
  isFinal?: boolean;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultItemLike>;
};
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Voice art-direction capture. Appends new dictation to existing transcript
 * instead of replacing it. Falls back gracefully when Web Speech API is absent.
 */
export function useVoice(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);
  const sessionBaseRef = useRef("");
  const sessionFinalRef = useRef("");
  const listeningRef = useRef(false);
  const transcriptRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);

  onTranscriptRef.current = onTranscript;
  transcriptRef.current = transcript;

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    setSupported(Boolean(Ctor));
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const chunk = result?.[0]?.transcript ?? "";
        if (result?.isFinal) {
          sessionFinalRef.current += `${chunk} `;
        } else {
          interim += chunk;
        }
      }
      const full = `${sessionBaseRef.current}${sessionFinalRef.current}${interim}`.trim();
      setTranscript(full);
      transcriptRef.current = full;
      onTranscriptRef.current(full);
    };

    rec.onend = () => {
      if (listeningRef.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
        return;
      }
      setListening(false);
    };

    rec.onerror = () => {
      listeningRef.current = false;
      setListening(false);
    };

    recRef.current = rec;
    return () => rec.stop();
  }, []);

  const start = useCallback(() => {
    if (!recRef.current) return;
    const base = transcriptRef.current.trim();
    sessionBaseRef.current = base ? `${base} ` : "";
    sessionFinalRef.current = "";
    listeningRef.current = true;
    setListening(true);
    try {
      recRef.current.start();
    } catch {
      /* already started */
    }
  }, []);

  const stop = useCallback(() => {
    listeningRef.current = false;
    recRef.current?.stop();
    setListening(false);
  }, []);

  const clear = useCallback(() => {
    sessionBaseRef.current = "";
    sessionFinalRef.current = "";
    setTranscript("");
    transcriptRef.current = "";
    onTranscriptRef.current("");
  }, []);

  const setTranscriptExternal = useCallback((text: string) => {
    sessionBaseRef.current = text;
    sessionFinalRef.current = "";
    setTranscript(text);
    transcriptRef.current = text;
  }, []);

  return {
    listening,
    transcript,
    supported,
    start,
    stop,
    clear,
    setTranscript: setTranscriptExternal,
  };
}
