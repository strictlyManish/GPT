import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  MessageCircle,
  Plus,
  Send,
  Menu,
  X,
  User,
  Bot,
  Search,
  Sparkles,
} from "lucide-react";

const socket = io("https://own-ai-l7or.onrender.com", {
  withCredentials: true,
});

function Home() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State to manage the AI thinking placeholder

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const res = await axios.get("https://own-ai-l7or.onrender.com/api", {
          withCredentials: true,
        });
        setChats(res.data.chats || []);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  const selectActiveChat = async (chatId) => {
    setActiveChat(chatId);
    setSidebarOpen(false);
    try {
      const res = await axios.get(
        `https://own-ai-l7or.onrender.com/api/messages/${chatId}`,
        { withCredentials: true }
      );
      setMessages(res.data.messages || []);
      socket.emit("join_room", chatId);
      setIsLoading(false); // Reset loading state when a new chat is selected
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;

    const msg = {
      chatId: activeChat,
      title: newMessage,
      sender: "user",
      role: "user",
      content: newMessage,
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, msg]);
    setIsLoading(true); // Start thinking placeholder

    // Send to backend
    socket.emit("ai-message", msg);

    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    socket.on("ai-response", (payload) => {
      if (!activeChat) return;

      const aiMsg = {
        chatId: activeChat,
        role: "assistant",
        sender: "AI",
        content: payload.response,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false); // Stop thinking placeholder once response is received
    });

    return () => {
      socket.off("ai-response");
    };
  }, [activeChat]);

  return (
    <div className="h-screen flex bg-[#171717] text-gray-200 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 w-80 h-full bg-[#212121]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full p-3">
          <div className="flex items-center justify-between p-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg">OWN.Ai</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg hover:bg-gray-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={async () => {
              const chat_title = window.prompt("Enter Chat title: ");
              if (!chat_title?.trim()) return;
              try {
                const res = await axios.post(
                  "https://own-ai-l7or.onrender.com/api/chat",
                  { chat_title },
                  { withCredentials: true }
                );
                setChats((prev) => [res.data.chat, ...prev]);
                setActiveChat(res.data.chat._id);
                setMessages([]);
                setSidebarOpen(false);
                setIsLoading(false); // Reset loading
              } catch (error) {
                console.error("Error creating chat:", error);
              }
            }}
            className="w-full p-3 text-left rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-3 text-white font-semibold"
          >
            <Plus size={18} /> New chat
          </button>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => selectActiveChat(chat._id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors group relative truncate text-sm ${
                    activeChat === chat._id
                      ? "bg-gray-800/50 text-white"
                      : "text-gray-400 hover:bg-gray-800/30 hover:text-gray-200"
                  }`}
                >
                  {chat.title}
                </button>
              ))
            )}
          </div>

          {/* User Section */}
          <div className="p-2 border-t border-gray-800">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/30 cursor-pointer">
              <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium">
                📐
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between p-4 border-b border-gray-800/50 md:border-none">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-medium md:hidden">
            {activeChat
              ? chats.find((c) => c._id === activeChat)?.title
              : "OWN.Ai"}
          </h1>
          <div /> {/* Spacer */}
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {!activeChat ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-medium text-white mb-4">
                  How can I help you today?
                </h1>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`flex flex-col max-w-2xl ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isUser
                            ? "bg-gray-700 text-white rounded-br-md"
                            : "bg-gray-800 text-gray-300 rounded-bl-md"
                        }`}
                      >
                        {!isUser && (
                          <div className="text-sm font-semibold text-white mb-1">
                            OWN.Ai
                          </div>
                        )}
                        <div className="prose prose-invert max-w-none prose-p:my-0 text-white">
                          <p className="whitespace-pre-wrap">{msg.con3tent}</p>
                        </div>
                      </div>
                    </div>
                    {isUser && (
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        U
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* NEW: Conditional Loader for AI response */}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-gray-800 text-gray-300 rounded-bl-md">
                    <div className="text-sm font-semibold text-white mb-1">
                      OWN.Ai
                    </div>
                    <div className="prose prose-invert max-w-none prose-p:my-0 text-white">
                      <p className="whitespace-pre-wrap">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="w-full bg-gradient-to-t from-[#171717] via-[#171717]/80 to-transparent">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="relative bg-[#212121] border border-gray-700/80 rounded-2xl">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  activeChat
                    ? "Message OWN.Ai..."
                    : "Select or start a new chat"
                }
                disabled={!activeChat}
                rows={1}
                className="w-full p-4 pr-14 bg-transparent rounded-2xl focus:outline-none disabled:opacity-50 text-white placeholder-gray-500 resize-none"
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 128) + "px";
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!activeChat || !newMessage.trim() || isLoading} // Disable button while AI is thinking
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 text-white bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-indigo-700"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center mt-3">
              OWN.Ai can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;