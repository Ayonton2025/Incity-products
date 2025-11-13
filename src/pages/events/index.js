// src/pages/events/index.js
import React, { useState, useRef, useEffect } from "react";
import { MdOutlineChat } from "react-icons/md";
import { FaWindowClose, FaMusic, FaUtensils, FaRunning, FaTheaterMasks, FaGraduationCap } from "react-icons/fa";
import RootLayout from "../layout";
import ReactMarkdown from "react-markdown";
import { useSession, signOut } from "next-auth/react";

const EventsBot = ({ toggleChat = () => {} }) => {
  const { data: session, status } = useSession();
  const [chatHistory, setChatHistory] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  if (status === "loading") return <div className="p-4 text-white">Loading...</div>;
  if (!session) {
    return (
      <RootLayout>
        <div className="p-4 text-white">
          Please <a href="/auth/signin" className="text-blue-400">sign in</a> to use Events Bot.
        </div>
      </RootLayout>
    );
  }

  const userId = session.user.id;

  useEffect(() => {
    setChatHistory([
      { 
        role: "model", 
        text: "🎪 Welcome to Events Bot! I can help you find exciting events in your area." 
      },
      { 
        role: "model", 
        text: "I'll check your budget and recommend events you can actually afford!" 
      }
    ]);
  }, []);

  const handleInput = (e) => setMessageInput(e.target.value);

  const handleChatInput = async () => {
    if (!messageInput.trim()) return;
    setLoading(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageInput, 
          chatHistory, 
          userId 
        }),
      });

      const data = await response.json();

      setChatHistory([
        ...chatHistory,
        { role: "user", text: messageInput },
        { role: "model", text: data.response },
      ]);
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      setChatHistory([
        ...chatHistory,
        { role: "user", text: messageInput },
        { role: "model", text: "Sorry, I couldn't fetch events right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickSuggestions = [
    { icon: FaMusic, text: "Music concerts this weekend", color: "text-purple-400" },
    { icon: FaUtensils, text: "Food festivals nearby", color: "text-orange-400" },
    { icon: FaRunning, text: "Sports events", color: "text-green-400" },
    { icon: FaTheaterMasks, text: "Comedy shows", color: "text-yellow-400" },
    { icon: FaGraduationCap, text: "Free workshops", color: "text-blue-400" },
  ];

  const handleQuickSuggestion = (suggestion) => {
    setMessageInput(suggestion);
    // Auto-trigger search after a delay
    setTimeout(() => {
      if (messageInput === suggestion) {
        handleChatInput();
      }
    }, 100);
  };

  return (
    <RootLayout>
      <div ref={chatRef} className="w-full bg-gradient-to-br from-purple-900 to-blue-900 flex flex-col h-full p-4">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Logout
        </button>

        <div className="flex flex-col gap-4 h-full overflow-y-auto mb-4">
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`text-lg p-4 rounded-lg max-w-3xl ${
                message.role === "user" 
                  ? "bg-blue-600 text-white self-end" 
                  : "bg-gray-800 text-green-300 self-start"
              }`}
            >
              <ReactMarkdown>
                {message.text}
              </ReactMarkdown>
            </div>
          ))}
          {loading && (
            <div className="text-center text-yellow-300">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-300 mr-2"></div>
                Finding awesome events...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickSuggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={index}
                onClick={() => handleQuickSuggestion(suggestion.text)}
                className={`flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors ${suggestion.color}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{suggestion.text}</span>
              </button>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-2">
          <input
            disabled={loading}
            className="flex-1 border border-gray-300 px-4 py-3 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ask about concerts, festivals, sports events..."
            onKeyDown={(e) => e.key === "Enter" && handleChatInput()}
            onChange={handleInput}
            value={messageInput}
          />
          <button
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 text-white rounded-lg disabled:bg-gray-600 transition-colors flex items-center gap-2"
            disabled={!messageInput.trim() || loading}
            onClick={handleChatInput}
          >
            <MdOutlineChat size={20} />
            <span>Find Events</span>
          </button>
        </div>

        {/* Budget Helper */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300">
            💡 <strong>Pro Tip:</strong> Use the <strong>Finance Bot</strong> to set your event budget, then I'll recommend events you can actually afford!
          </p>
        </div>
      </div>
    </RootLayout>
  );
};

export default EventsBot;