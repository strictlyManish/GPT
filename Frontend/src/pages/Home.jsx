import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Plus,
  Send,
  Menu,
  X,
  Bot,
  Sparkles,
} from "lucide-react";

// Constants
const API_BASE_URL = "https://own-ai-l7or.onrender.com";
const SOCKET_CONFIG = { withCredentials: true };

// Custom hooks
const useSocket = () => {
  const socketRef = useRef(null);
  
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(API_BASE_URL, SOCKET_CONFIG);
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);
  
  return socketRef.current;
};

const useApi = () => {
  const apiClient = useMemo(() => 
    axios.create({
      baseURL: `${API_BASE_URL}/api`,
      withCredentials: true,
    }), []
  );
  
  return {
    fetchChats: useCallback(() => apiClient.get('/'), [apiClient]),
    fetchMessages: useCallback((chatId) => apiClient.get(`/messages/${chatId}`), [apiClient]),
    createChat: useCallback((chat_title) => apiClient.post('/chat', { chat_title }), [apiClient]),
  };
};

// Components
const LoadingSpinner = ({ size = 5 }) => (
  <div className={`animate-spin w-${size} h-${size} border-2 border-gray-600 border-t-transparent rounded-full`} />
);

const ChatMessage = React.memo(({ message, isUser }) => (
  <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
    {!isUser && (
      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
    )}
    
    <div className={`flex flex-col max-w-2xl ${isUser ? "items-end" : "items-start"}`}>
      <div className={`px-4 py-2 rounded-2xl ${
        isUser
          ? "bg-gray-700 text-white rounded-br-md"
          : "bg-gray-800 text-gray-300 rounded-bl-md"
      }`}>
        {!isUser && (
          <div className="text-sm font-semibold text-white mb-1">OWN.Ai</div>
        )}
        <p className="whitespace-pre-wrap text-white">{message.content}</p>
      </div>
    </div>
    
    {isUser && (
      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
        U
      </div>
    )}
  </div>
));

const ThinkingIndicator = () => (
  <div className="flex items-start gap-3 justify-start">
    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="px-4 py-2 rounded-2xl bg-gray-800 text-gray-300 rounded-bl-md">
      <div className="text-sm font-semibold text-white mb-1">OWN.Ai</div>
      <div className="flex items-center gap-1">
        <span>Thinking</span>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1 h-1 bg-white rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ChatItem = React.memo(({ chat, isActive, onClick }) => (
  <button
    onClick={() => onClick(chat._id)}
    className={`w-full text-left p-3 rounded-lg transition-colors truncate text-sm ${
      isActive
        ? "bg-gray-800/50 text-white"
        : "text-gray-400 hover:bg-gray-800/30 hover:text-gray-200"
    }`}
  >
    {chat.title}
  </button>
));

const Sidebar = ({ 
  chats, 
  loading, 
  activeChat, 
  sidebarOpen, 
  onChatSelect, 
  onNewChat, 
  onSidebarToggle 
}) => (
  <aside className={`
    fixed md:relative z-50 w-80 h-full bg-[#212121]
    transform transition-transform duration-300 ease-in-out
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}>
    <div className="flex flex-col h-full p-3">
      {/* Header */}
      <div className="flex items-center justify-between p-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">OWN.Ai</span>
        </div>
        <button
          onClick={onSidebarToggle}
          className="md:hidden p-1 rounded-lg hover:bg-gray-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="w-full p-3 text-left rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-3 text-white font-semibold"
      >
        <Plus size={18} /> New chat
      </button>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          chats.map((chat) => (
            <ChatItem
              key={chat._id}
              chat={chat}
              isActive={activeChat === chat._id}
              onClick={onChatSelect}
            />
          ))
        )}
      </div>

      {/* Settings */}
      <div className="p-2 border-t border-gray-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/30 cursor-pointer">
          <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium">
            ⚙️
          </div>
          <span className="text-sm font-medium text-white">Settings</span>
        </div>
      </div>
    </div>
  </aside>
);

const MessageInput = ({ 
  value, 
  onChange, 
  onSend, 
  disabled, 
  placeholder 
}) => {
  const textareaRef = useRef(null);
  
  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);
  
  const handleInput = useCallback((e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
  }, []);
  
  return (
    <div className="w-full bg-gradient-to-t from-[#171717] via-[#171717]/80 to-transparent">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="relative bg-[#212121] border border-gray-700/80 rounded-2xl">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyPress={handleKeyPress}
            onInput={handleInput}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full p-4 pr-14 bg-transparent rounded-2xl focus:outline-none disabled:opacity-50 text-white placeholder-gray-500 resize-none"
          />
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
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
  );
};

// Main Component
function Home() {
  // State management
  const [state, setState] = useState({
    chats: [],
    loading: false,
    activeChat: null,
    messages: [],
    newMessage: "",
    sidebarOpen: false,
    isLoading: false,
  });
  
  const socket = useSocket();
  const api = useApi();
  const messagesEndRef = useRef(null);
  
  // Memoized values
  const activeTitle = useMemo(() => 
    state.chats.find(c => c._id === state.activeChat)?.title || "OWN.Ai",
    [state.chats, state.activeChat]
  );
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [state.messages, state.isLoading, scrollToBottom]);
  
  // API calls
  const fetchChats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const res = await api.fetchChats();
      setState(prev => ({ ...prev, chats: res.data.chats || [] }));
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [api]);
  
  const selectActiveChat = useCallback(async (chatId) => {
    setState(prev => ({ 
      ...prev, 
      activeChat: chatId, 
      sidebarOpen: false,
      isLoading: false 
    }));
    
    try {
      const res = await api.fetchMessages(chatId);
      setState(prev => ({ ...prev, messages: res.data.messages || [] }));
      socket?.emit("join_room", chatId);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [api, socket]);
  
  const createNewChat = useCallback(async () => {
    const chat_title = window.prompt("Enter Chat title:");
    if (!chat_title?.trim()) return;
    
    try {
      const res = await api.createChat(chat_title);
      const newChat = res.data.chat;
      
      setState(prev => ({
        ...prev,
        chats: [newChat, ...prev.chats],
        activeChat: newChat._id,
        messages: [],
        sidebarOpen: false,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  }, [api]);
  
  const handleSendMessage = useCallback(() => {
    if (!state.newMessage.trim() || !state.activeChat || state.isLoading) return;
    
    const msg = {
      chatId: state.activeChat,
      title: state.newMessage,
      sender: "user",
      role: "user",
      content: state.newMessage,
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, msg],
      newMessage: "",
      isLoading: true,
    }));
    
    socket?.emit("ai-message", msg);
  }, [state.newMessage, state.activeChat, state.isLoading, socket]);
  
  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleAIResponse = (payload) => {
      if (!state.activeChat) return;
      
      const aiMsg = {
        chatId: state.activeChat,
        role: "assistant",
        sender: "AI",
        content: payload.response,
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMsg],
        isLoading: false,
      }));
    };
    
    socket.on("ai-response", handleAIResponse);
    return () => socket.off("ai-response", handleAIResponse);
  }, [socket, state.activeChat]);
  
  // Initial data fetch
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);
  
  return (
    <div className="h-screen flex bg-[#171717] text-gray-200 font-sans">
      {/* Mobile Overlay */}
      {state.sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setState(prev => ({ ...prev, sidebarOpen: false }))}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar
        chats={state.chats}
        loading={state.loading}
        activeChat={state.activeChat}
        sidebarOpen={state.sidebarOpen}
        onChatSelect={selectActiveChat}
        onNewChat={createNewChat}
        onSidebarToggle={() => setState(prev => ({ ...prev, sidebarOpen: false }))}
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-800/50 md:border-none">
          <button
            onClick={() => setState(prev => ({ ...prev, sidebarOpen: true }))}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-medium md:hidden">{activeTitle}</h1>
          <div />
        </header>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {!state.activeChat ? (
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
              {state.messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  message={msg}
                  isUser={msg.role === "user"}
                />
              ))}
              {state.isLoading && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input */}
        <MessageInput
          value={state.newMessage}
          onChange={(e) => setState(prev => ({ ...prev, newMessage: e.target.value }))}
          onSend={handleSendMessage}
          disabled={!state.activeChat || state.isLoading}
          placeholder={state.activeChat ? "Message OWN.Ai..." : "Select or start a new chat"}
        />
      </main>
    </div>
  );
}

export default Home;