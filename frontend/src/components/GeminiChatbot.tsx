import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Trash2,
  Minimize2,
  Maximize2,
  FileCode2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { sendChatMessage } from '../services/api';
import type { ChatMessage, ChatContext } from '../types';

export interface OpenChatEventDetail {
  initialPrompt?: string;
  context?: ChatContext;
  autoSend?: boolean;
}

export function GeminiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        '👋 Hi! I am **Gemini AI Assistant** for CodePulse.\n\nI can help you review code, explain security issues, refactor architecture, write unit tests, or debug complex bugs. How can I assist your code today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeContext, setActiveContext] = useState<ChatContext | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Global event listener for custom "open-gemini-chat" events
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent<OpenChatEventDetail>) => {
      const { initialPrompt, context, autoSend } = event.detail || {};
      setIsOpen(true);
      if (context) {
        setActiveContext(context);
      }
      if (initialPrompt) {
        if (autoSend) {
          handleSendMessage(initialPrompt, context);
        } else {
          setInput(initialPrompt);
          setTimeout(() => textareaRef.current?.focus(), 200);
        }
      }
    };

    window.addEventListener('open-gemini-chat' as any, handleOpenChat as any);
    return () => {
      window.removeEventListener('open-gemini-chat' as any, handleOpenChat as any);
    };
  }, [messages, activeContext]);

  const handleSendMessage = async (customText?: string, overrideContext?: ChatContext) => {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const apiMessages = newMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const contextToSend = overrideContext || activeContext || undefined;
      const response = await sendChatMessage(apiMessages, contextToSend);

      const botMessage: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: new Date(),
      };

      setMessages([...newMessages, botMessage]);
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `⚠️ **Error communicating with Gemini**: ${err.message || 'Network error'}. Please verify your network and Gemini API credentials.`,
        timestamp: new Date(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content: 'Chat cleared. Ask me anything about your code or review findings!',
        timestamp: new Date(),
      },
    ]);
  };

  const quickPrompts = activeContext?.finding
    ? [
        { label: '🛠️ How do I fix this finding?', prompt: `How should I fix the "${activeContext.finding.title}" issue? Please provide a complete, safe refactored code example.` },
        { label: '🔒 Explain the security risk', prompt: `What are the exact security or performance risks associated with "${activeContext.finding.title}"?` },
        { label: '🧪 Write unit tests', prompt: `Write automated unit tests verifying this code and ensuring this finding cannot regress.` },
      ]
    : [
        { label: '🔒 Check security flaws', prompt: 'What are common security vulnerabilities to watch out for in fullstack web applications?' },
        { label: '⚡ Performance tips', prompt: 'How do I optimize database queries and async handlers in Node.js?' },
        { label: '🧪 Unit test best practices', prompt: 'What is the recommended pattern for writing unit tests with mock dependencies?' },
      ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-violet-600 text-white font-medium text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 group border border-white/10"
          id="gemini-chat-launcher"
          aria-label="Open Gemini AI Code Assistant"
        >
          <div className="relative">
            <Bot size={20} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-slate-900" />
          </div>
          <span className="tracking-wide font-semibold">Gemini AI</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-out / Floating Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col ${
            isExpanded
              ? 'inset-4 md:inset-10 rounded-2xl'
              : 'bottom-4 right-4 w-full max-w-md h-[600px] max-h-[85vh] rounded-2xl'
          } bg-[#0e0e1a]/95 backdrop-blur-2xl border border-indigo-500/30 shadow-2xl shadow-black/80 overflow-hidden flex flex-col`}
          role="dialog"
          aria-label="Gemini AI Assistant Chat"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                <Sparkles size={16} className="text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight">CodePulse AI</h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Gemini
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Online & Ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore size' : 'Maximize window'}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors hidden sm:inline-flex"
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                id="gemini-chat-close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Active Context Banner (if attached) */}
          {activeContext && (
            <div className="px-3.5 py-2 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300 shrink-0">
              <div className="flex items-center gap-2 truncate">
                {activeContext.finding ? (
                  <>
                    <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                    <span className="font-semibold text-amber-300 truncate">
                      Context: {activeContext.finding.title}
                    </span>
                  </>
                ) : (
                  <>
                    <FileCode2 size={13} className="text-indigo-400 shrink-0" />
                    <span className="truncate">
                      Context: {activeContext.filename || 'Code Review'} ({activeContext.language || 'Snippet'})
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => setActiveContext(null)}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline ml-2 shrink-0"
              >
                Detach
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex gap-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-slate-200 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-600/20 rounded-br-none'
                      : 'bg-slate-900/90 border border-indigo-500/20 shadow-sm rounded-tl-none'
                  }`}
                >
                  <FormattedMarkdown content={msg.content} msgId={msg.id || String(index)} onCopy={copyToClipboard} copiedId={copiedIndex} />
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 mt-0.5 text-white">
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Loading Animation */}
            {isLoading && (
              <div className="flex gap-3 text-sm justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300">
                  <Bot size={15} className="animate-spin" />
                </div>
                <div className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-400 font-medium ml-1">Gemini is analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="px-3 pt-2 pb-1 bg-slate-950/60 border-t border-indigo-500/10 flex gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 whitespace-nowrap transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <Lightbulb size={11} className="text-amber-400 shrink-0" />
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={onSubmit}
            className="p-3 bg-slate-950/80 border-t border-indigo-500/20 flex items-end gap-2 shrink-0"
          >
            <div className="flex-1 bg-slate-900/90 rounded-xl border border-indigo-500/25 focus-within:border-indigo-400 transition-all p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemini anything (Shift+Enter for newline)..."
                rows={1}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none resize-none max-h-32 custom-scrollbar leading-relaxed"
                style={{ height: 'auto', minHeight: '24px' }}
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
              id="gemini-chat-send"
              title="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/**
 * Lightweight Rich Markdown & Syntax Renderer
 */
function FormattedMarkdown({
  content,
  msgId,
  onCopy,
  copiedId,
}: {
  content: string;
  msgId: string;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const parts: Array<{ type: 'text' | 'code'; text: string; lang?: string }> = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1] || 'code', text: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return (
    <div className="space-y-2.5 overflow-hidden">
      {parts.map((p, idx) => {
        if (p.type === 'code') {
          const blockId = `${msgId}_code_${idx}`;
          const isCopied = copiedId === blockId;
          return (
            <div
              key={idx}
              className="rounded-xl overflow-hidden bg-slate-950/90 border border-indigo-500/30 my-2 shadow-inner"
            >
              <div className="px-3 py-1.5 bg-slate-900/80 border-b border-indigo-500/20 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-300">
                  {p.lang}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(p.text, blockId)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 text-slate-300 transition-colors text-[11px]"
                >
                  {isCopied ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-xs font-mono text-indigo-100 overflow-x-auto leading-relaxed custom-scrollbar">
                <code>{p.text}</code>
              </pre>
            </div>
          );
        }

        // Render formatted text lines
        return (
          <div key={idx} className="space-y-1">
            {p.text.split('\n\n').map((paragraph, pIdx) => {
              // Check if bullet points
              if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
                const items = paragraph.split('\n').filter(Boolean);
                return (
                  <ul key={pIdx} className="list-disc list-inside space-y-1 text-slate-200">
                    {items.map((item, iIdx) => (
                      <li key={iIdx} className="leading-relaxed">
                        <InlineMarkdown text={item.replace(/^[-*]\s+/, '')} />
                      </li>
                    ))}
                  </ul>
                );
              }

              // Check if numbered list
              if (/^\d+\.\s/.test(paragraph.trim())) {
                const items = paragraph.split('\n').filter(Boolean);
                return (
                  <ol key={pIdx} className="list-decimal list-inside space-y-1 text-slate-200">
                    {items.map((item, iIdx) => (
                      <li key={iIdx} className="leading-relaxed">
                        <InlineMarkdown text={item.replace(/^\d+\.\s+/, '')} />
                      </li>
                    ))}
                  </ol>
                );
              }

              // Check if heading (### or ## or #)
              if (paragraph.trim().startsWith('#')) {
                const clean = paragraph.replace(/^#+\s*/, '');
                return (
                  <h4 key={pIdx} className="font-bold text-slate-100 text-sm mt-2 mb-1">
                    <InlineMarkdown text={clean} />
                  </h4>
                );
              }

              return (
                <p key={pIdx} className="leading-relaxed">
                  <InlineMarkdown text={paragraph} />
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Handles inline bold (**text**), inline code (`code`), and italics
 */
function InlineMarkdown({ text }: { text: string }) {
  // Regex to split by inline code `...` or bold **...**
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return (
    <>
      {tokens.map((token, i) => {
        if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono text-xs"
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
          return (
            <strong key={i} className="font-bold text-slate-100">
              {token.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{token}</span>;
      })}
    </>
  );
}
