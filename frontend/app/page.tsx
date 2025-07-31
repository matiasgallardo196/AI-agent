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
      <div className="p-4 chat-header">
        <h1 className="text-lg font-semibold">AI Shopping Assistant</h1>
        <p className="text-sm text-muted-foreground">Powered by OpenAI</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-8 welcome-message">
            <p className="text-lg mb-2">Welcome! 👋</p>
            <p>
              I can help you find products, create shopping carts, and manage
              your orders.
            </p>
            <p className="text-sm mt-2">
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
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                message.sender === "user" ? "message-user" : "message-bot"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {message.text}
              </p>
              <p className="message-timestamp mt-2">
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
            <div className="typing-indicator max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl chat-input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 rounded-xl font-medium chat-button"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
