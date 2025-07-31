"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

let sessionId: string | null = null;

if (typeof window !== "undefined") {
  // sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    // localStorage.setItem("sessionId", sessionId);
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.text,
            sessionId,
          }),
        }
      );

      let data;
      if (!response.ok) {
        try {
          data = await response.json();
        } catch {
          throw new Error("Error processing server response");
        }
        throw new Error(data?.message || data?.response || "Server error");
      }

      data = await response.json();
      //console.log("Response from server:", data);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.response || data.message || "No response received",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: Date.now() + 1,
        text:
          (error as Error).message ||
          "An error occurred while sending your message",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto border-x border-gray-200 chat-container">
      {/* Header */}
      <div className="p-3 chat-header">
        <h1 className="text-base font-semibold">AI Shopping Assistant</h1>
        <p className="text-xs text-muted-foreground">Powered by OpenAI</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center mt-4 welcome-message">
            <p className="text-base mb-1">Welcome! 👋</p>
            <p className="text-sm">
              I can help you find products, create shopping carts, and manage
              your orders.
            </p>
            <p className="text-xs mt-1">
              Try asking me something like "Show me some pants" or "Add 2 blue
              shirts to cart"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-xl shadow-sm ${
                message.sender === "user" ? "message-user" : "message-bot"
              }`}
            >
              <p className="text-xs leading-relaxed whitespace-pre-line">
                {message.text}
              </p>
              <p className="message-timestamp mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="typing-indicator max-w-xs lg:max-w-md px-3 py-2 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-xs">typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 p-3 bg-white/90 backdrop-blur-sm rounded-b-2xl">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-lg chat-input text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 rounded-lg font-medium chat-button text-sm"
          >
            {isLoading ? "sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
