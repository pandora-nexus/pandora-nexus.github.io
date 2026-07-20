"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "bee";
  text: string;
  time: Date;
}

export default function Handbook() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bee",
      text: "Selam Patron! Ben BEE. Sana nasıl yardımcı olabilirim?",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Konuşma komutunu işle
  function processCommand(text: string) {
    const lowerText = text.toLowerCase();

    let command = lowerText
      .replace(/hey bee/i, "")
      .replace(/hey bi/i, "")
      .replace(/hey abi/i, "")
      .trim();

    if (!command) {
      command = "Selam BEE, nasılsın?";
    }

    setInput(command);
    setIsListening(false);

    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) form.requestSubmit();
    }, 200);
  }

  // Ses tanıma başlat
  function startListening() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Patron, tarayıcın ses tanımayı desteklemiyor. Chrome ya da Edge dene.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      // Her yeni sonuçta sessizlik sayacını sıfırla
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      const text = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

      // 3 saniye sessizlik olursa işle
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
        processCommand(text);
      }, 3000);

      // "Hey BEE" anında tetikleme
      if (text.includes("hey bee") || text.includes("hey bi") || text.includes("hey abi")) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        recognition.stop();
        processCommand(text);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  // BEE'nin cevabını seslendir
  function speak(text: string) {
    if (!voiceOn) return;
    if (!("speechSynthesis" in window)) return;

    const cleanText = text
      .replace(/\[📚[^\]]*\]/g, "")
      .replace(/\[🌐[^\]]*\]/g, "")
      .replace(/\(👍[^)]*\)/g, "")
      .replace(/\(🟡[^)]*\)/g, "")
      .replace(/\(👎[^)]*\)/g, "")
      .replace(/\n\n💡 Patron.*/gs, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "tr-TR";
    utterance.rate = 1.1;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", text: input, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: input }),
      });

      if (res.ok) {
        const data = await res.json();
        const beeMsg: Message = {
          role: "bee",
          text: data.result,
          time: new Date(),
        };
        setMessages((prev) => [...prev, beeMsg]);
        speak(data.result);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bee", text: "Patron, bir şeyler ters gitti. Tekrar dener misin?", time: new Date() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bee", text: "Bağlantı hatası. Sunucu çalışıyor mu kontrol eder misin?", time: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gray-800 p-4 flex items-center gap-4">
        <Link href="/" className="text-gray-500 hover:text-white text-sm">
          ← Ana Sayfa
        </Link>
        <h1 className="font-bold">🐝 BEE</h1>
        <button
          onClick={() => setVoiceOn(!voiceOn)}
          className={`text-xs ml-2 ${voiceOn ? "text-green-400" : "text-gray-500"}`}
          title={voiceOn ? "Sesi kapat" : "Sesi aç"}
        >
          {voiceOn ? "🔊" : "🔇"}
        </button>
        <span className="text-xs text-green-400 ml-auto">● Çevrimiçi</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-yellow-500 text-black rounded-br-md"
                  : "bg-gray-800 text-gray-200 rounded-bl-md"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div
                className={`text-xs mt-1 ${
                  msg.role === "user" ? "text-black/50" : "text-gray-500"
                }`}
              >
                {msg.time.toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 px-4 py-3 rounded-2xl rounded-bl-md text-sm">
              Yazıyor...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bir şey sor ya da 🎤 de..."
            className="flex-1 bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-yellow-500"
          />
          <button
            type="button"
            onClick={startListening}
            className={`px-4 py-3 rounded-xl font-bold text-sm transition ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            title="Sesle sor (Hey BEE...)"
          >
            🎤
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-400 disabled:opacity-50 transition"
          >
            Gönder
          </button>
        </div>
      </form>
    </div>
  );
}