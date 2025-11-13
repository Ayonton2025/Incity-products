// src/pages/finance/index.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import { MdOutlineChat } from "react-icons/md";
import { FaWindowClose } from "react-icons/fa";
import RootLayout from "../layout";
import ReactMarkDown from "react-markdown";
import { useSession, signOut } from "next-auth/react";

const FinanceBot = ({ toggleChat = () => {} }) => {
  const { data: session, status } = useSession();
  const [chatHistory, setChatHistory] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null); // ✅ Declare all hooks at top

  // ✅ All hooks declared before any early return
  if (status === "loading") return <div className="p-4 text-white">Loading...</div>;
  if (!session) {
    return (
      <RootLayout>
        <div className="p-4 text-white">
          Please <a href="/auth/signin" className="text-blue-400">sign in</a> to use Finance Bot.
        </div>
      </RootLayout>
    );
  }

  const userId = session.user.id;

  const initializeChatbot = () => {
    setChatHistory([
      { role: "model", parts: ["Hi, I am your Finance Bot. How can I assist you today?"] },
    ]);
  };

  useEffect(() => {
    initializeChatbot();
  }, []);

  const handleChatInput = async () => {
    if (!messageInput.trim()) return;
    setLoading(true);

    try {
      const response = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: messageInput, chatHistory, userId }),
      });
      const data = await response.json();

      setChatHistory(prev => [
        ...prev,
        { role: "user", parts: [messageInput] },
        { role: "model", parts: [data.responseText] },
      ]);
      setMessageInput("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <RootLayout>
      <div
        ref={chatRef}
        className="w-full h-[100vh] flex flex-col justify-between backdrop-blur-lg border bg-black border-zinc-600 p-4 shadow-md z-70 font-Mono"
      >
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Logout
        </button>

        <button
          onClick={toggleChat}
          className="absolute -top-5 -right-5 z-10 text-red-500 p-2 font-mono"
        >
          <FaWindowClose size={28} />
        </button>
        <div className="flex flex-col gap-2 overflow-y-auto">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`text-xl ${msg.role === "user" ? "text-fuchsia-500" : "text-cyan-300"}`}
            >
              <ReactMarkDown>
                {`${msg.role === "user" ? "You" : "Finance Bot"}: ${msg.parts.join("")}`}
              </ReactMarkDown>
            </div>
          ))}
          {loading && <div className="text-center">Loading...</div>}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white">
          <input
            disabled={loading}
            className="w-full h-full border border-gray-300 px-3 py-2 text-gray-700 rounded-md focus:outline-none"
            placeholder="Type your message"
            onKeyDown={(e) => e.key === "Enter" && handleChatInput()}
            onChange={(e) => setMessageInput(e.target.value)}
            value={messageInput}
          />
          <button
            className="bg-blue-600 px-4 py-2 text-white rounded-md shadow-md hover:bg-blue-500 disabled:bg-slate-500 focus:outline-none ml-4"
            disabled={!messageInput.trim() || loading}
            onClick={handleChatInput}
          >
            <MdOutlineChat size={24} />
          </button>
        </div>
      </div>
    </RootLayout>
  );
};

export default FinanceBot;