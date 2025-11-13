import React, { useState, useRef, useEffect } from "react";
import { MdOutlineChat } from "react-icons/md";
import { FaWindowClose } from "react-icons/fa";
import axios from "axios";
import RootLayout from "../layout";
import ReactMarkDown from "react-markdown";
import { useSession, signOut } from "next-auth/react";

const API_KEY = "655cf0b44b9841c9b6fd80bdc8f3b87a"; // Your API Key
const NEWS_API_URL = "https://newsapi.org/v2/everything"; // Example endpoint

const News = ({ toggleChat = () => {} }) => {
  const { data: session, status } = useSession();
  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Popup ref
  const chatRef = useRef(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  // Handler for opening/closing the popup
  const handleInput = (e) => {
    setMessageInput(e.target.value);
  };

  const handleChatInput = async () => {
    const query = messageInput;
    if (messageInput === "") return;

    setLoading(true);
    try {
      const apiResponse = await axios.get(NEWS_API_URL, {
        params: {
          q: query,
          apiKey: API_KEY,
          language: "en",
          pageSize: 5, // Adjust as needed
        },
      });

      const articles = apiResponse.data.articles;
      if (articles.length === 0) {
        updateChatHistory("No news articles found for your query.");
      } else {
        const newsSummary = articles.map((article) => ({
          title: article.title,
          description: article.description,
        }));
        updateChatHistory(newsSummary);
      }
      setMessageInput("");
    } catch (error) {
      console.error("Error fetching news:", error);
      updateChatHistory("An error occurred while fetching news.");
    }
  };

  const updateChatHistory = (newsItems) => {
    const newHistory = [
      ...chatHistory,
      { role: "user", parts: [messageInput] },
      { role: "model", parts: newsItems },
    ];
    setChatHistory(newHistory);
    setLoading(false);
  };

  const initializeChatbot = () => {
    setLoading(false);
    setChatHistory([
      {
        role: "model",
        parts: ["Hi, I am Incity NewsBot. Ask me about the latest news!"],
      },
      {
        role: "model",
        parts: [
          "You can ask me about recent headlines or news related to specific topics.",
        ],
      },
      {
        role: "model",
        parts: [
          'For example, you can type "latest technology news" or "news about sports" to get updates.',
        ],
      },
    ]);
  };

  useEffect(() => {
    initializeChatbot();
  }, []);

  return (
    <RootLayout>
      <div
        ref={chatRef}
        className="w-full h-full flex flex-col justify-between backdrop-blur-lg border bg-black border-zinc-600 p-4  shadow-md z-70 font-Mono"
      >
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Logout
        </button>

        <div className="flex flex-col gap-4 h-full overflow-y-auto">
          {chatHistory.map((message, index) => (
            <div
              key={message.role + index}
              className={`text-xl ${
                message.role === "user" ? "text-fuchsia-500" : "text-cyan-300"
              } snap-end`}
            >
              {message.role === "model" ? (
                message.parts.map((item, idx) => (
                  <div key={idx} className="mb-4">
                    <div className="font-bold text-lg">
                      {item.title || "Incity NewsBot"}
                    </div>
                    <div className="mt-1 mb-2">{item.description || item}</div>
                  </div>
                ))
              ) : (
                <ReactMarkDown>
                  {`${message.role === "user" ? "You" : "Incity NewsBot"}: ${
                    message.parts
                  }`}
                </ReactMarkDown>
              )}
            </div>
          ))}
          {loading && <div className="text-center">Loading...</div>}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white">
          <input
            disabled={loading}
            className="w-full h-full border border-gray-300 px-3 py-2 text-gray-700 rounded-md border-none focus:outline-none"
            placeholder="Type your message"
            onKeyDown={(e) => (e.key === "Enter" ? handleChatInput() : null)}
            onChange={handleInput}
            value={messageInput}
          />
          <button
            className={`bg-[rgba(29,71,253,1)] px-4 py-2 text-white rounded-md shadow-md hover:bg-[#1d46fdd5] disabled:bg-slate-500 focus:outline-none ml-4`}
            disabled={messageInput === "" || loading}
            onClick={() => handleChatInput()}
          >
            <MdOutlineChat size={24} />
          </button>
        </div>
      </div>
    </RootLayout>
    // </div>
  );
};

export default News;