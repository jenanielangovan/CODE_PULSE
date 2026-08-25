import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Bot,
  User,
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
  Zap,
  Code2,
  TestTube,
  BookOpen,
  FileCode,
  Download,
} from 'lucide-react';
import { sendChatMessage } from '../services/api';
import type { ChatMessage, ChatContext } from '../types';
import { SUPPORTED_LANGUAGES } from '../types';

const PRESET_TEMPLATES = [
  {
    icon: ShieldAlert,
    label: 'Security Audit',
    color: 'text-red-400 border-red-500/30 bg-red-500/10',
    prompt: 'Conduct a thorough security audit of this code. Identify any OWASP Top 10 risks, injection vulnerabilities, insecure memory/data access, or auth weaknesses, and provide hardened fixes.',
  },
  {
    icon: Zap,
    label: 'Performance Optimization',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    prompt: 'Analyze the algorithmic complexity, CPU/memory efficiency, and potential bottlenecks in this code. Provide an optimized, high-throughput refactoring.',
  },
  {
    icon: Code2,
    label: 'Clean Code Refactoring',
    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    prompt: 'Refactor this code to follow clean architecture, SOLID principles, idiomatic best practices, and improved readability without breaking existing functionality.',
  },
  {
    icon: TestTube,
    label: 'Unit Test Generator',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    prompt: 'Generate a comprehensive unit test suite covering happy paths, edge cases, error scenarios, and boundary conditions for this code.',
  },
  {
    icon: BookOpen,
    label: 'Explain Code',
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    prompt: 'Explain what this code does line by line in plain English, highlighting design patterns, asynchronous flows, and key state transitions.',
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        '👋 Welcome to **CodePulse AI Studio**!\n\nI am your dedicated Gemini-powered software engineering assistant. You can paste code snippets in the left panel, choose audit presets, or ask any complex coding question directly.',
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [codeContext, setCodeContext] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [filename, setFilename] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>('Gemini 2.5 Flash');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = (customPrompt ?? input).trim();
    if (!promptToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const apiMessages = newMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const contextObj: ChatContext | undefined = codeContext.trim()
        ? {
            code: codeContext.trim(),
            language,
            filename: filename.trim() || undefined,
          }
        : undefined;

      const response = await sendChatMessage(apiMessages, contextObj);
      if (response.model) {
        setActiveModel(response.model);
      }

      const botMessage: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: new Date(),
      };

      setMessages([...newMessages, botMessage]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `⚠️ **Failed to get response from Gemini**: ${err.message || 'Network error'}. Please check your connection and configuration.`,
        timestamp: new Date(),
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportTranscript = () => {
    const transcript = messages
      .map(m => `### ${m.role === 'user' ? '👤 User' : '🤖 Gemini AI'}\n\n${m.content}\n\n---\n`)
      .join('\n');
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codepulse-gemini-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content: 'Conversation reset. Ask any question or paste code to begin a new consultation!',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Gemini AI Assistant</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Interactive AI coding consultation, vulnerability triage, and architectural reviews.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={exportTranscript}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-indigo-500/20 transition-colors"
            title="Download chat transcript as Markdown"
          >
            <Download size={14} />
            <span>Export Markdown</span>
          </button>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900/80 hover:bg-red-500/10 text-slate-400 hover:text-red-300 border border-indigo-500/20 transition-colors"
            title="Reset conversation"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Code Context & Quick Presets (4 cols) */}
        <div className="lg:col-span-5 space-y-5 animate-fade-up">
          {/* Preset Prompts Card */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              Quick Audit Presets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {PRESET_TEMPLATES.map((tmpl, idx) => {
                const Icon = tmpl.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(tmpl.prompt)}
                    disabled={isLoading}
                    className="w-full text-left p-2.5 rounded-xl border border-white/5 hover:border-indigo-500/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center gap-3 group disabled:opacity-50"
                  >
                    <div className={`p-2 rounded-lg border ${tmpl.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {tmpl.label}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{tmpl.prompt}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attached Code Context Card */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileCode size={14} className="text-indigo-400" />
                Attached Code Context
              </h2>
              {codeContext && (
                <button
                  onClick={() => setCodeContext('')}
                  className="text-xs text-slate-500 hover:text-slate-300 underline"
                >
                  Clear Code
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-slate-900/90 border border-indigo-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-400 outline-none"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value} className="bg-slate-900">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Filename (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. authMiddleware.ts"
                  value={filename}
                  onChange={e => setFilename(e.target.value)}
                  className="w-full bg-slate-900/90 border border-indigo-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-400 outline-none placeholder-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Source Code / Diff to Analyze</label>
              <textarea
                value={codeContext}
                onChange={e => setCodeContext(e.target.value)}
                placeholder="Paste your source code or diff here... Gemini will reference this in all questions."
                rows={8}
                className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-indigo-400 outline-none resize-y custom-scrollbar"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Chat Conversation Stream (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[750px] glass-card overflow-hidden animate-fade-up">
          {/* Stream Header */}
          <div className="px-5 py-3.5 bg-slate-950/70 border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">Conversation Stream</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">Engine: {activeModel}</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex gap-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300 shadow-md">
                    <Bot size={17} />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3.5 text-slate-200 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-600/20 rounded-br-none'
                      : 'bg-slate-900/90 border border-indigo-500/20 shadow-md rounded-tl-none'
                  }`}
                >
                  <FormattedMarkdownView
                    content={msg.content}
                    msgId={msg.id || String(index)}
                    onCopy={copyToClipboard}
                    copiedId={copiedId}
                  />
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 mt-0.5 text-white shadow-md">
                    <User size={17} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 text-sm justify-start items-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300">
                  <Bot size={17} className="animate-spin" />
                </div>
                <div className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-400 font-medium ml-1">Gemini is synthesizing response...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Stream Input */}
          <form
            onSubmit={onSubmit}
            className="p-4 bg-slate-950/90 border-t border-indigo-500/20 flex items-end gap-3"
          >
            <div className="flex-1 bg-slate-900/90 rounded-xl border border-indigo-500/25 focus-within:border-indigo-400 transition-all p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Gemini anything about your code, architecture, or fixes (Shift+Enter for newline)..."
                rows={2}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none resize-none custom-scrollbar leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2"
              id="chat-page-send-btn"
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Rich Markdown View for Chat Studio
 */
function FormattedMarkdownView({
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
    <div className="space-y-3">
      {parts.map((p, idx) => {
        if (p.type === 'code') {
          const blockId = `${msgId}_code_${idx}`;
          const isCopied = copiedId === blockId;
          return (
            <div
              key={idx}
              className="rounded-xl overflow-hidden bg-slate-950/90 border border-indigo-500/30 my-3 shadow-md"
            >
              <div className="px-3.5 py-2 bg-slate-900/90 border-b border-indigo-500/20 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-300">
                  {p.lang}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(p.text, blockId)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-white/10 text-slate-300 transition-colors text-xs"
                >
                  {isCopied ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono text-indigo-100 overflow-x-auto leading-relaxed custom-scrollbar">
                <code>{p.text}</code>
              </pre>
            </div>
          );
        }

        return (
          <div key={idx} className="space-y-2">
            {p.text.split('\n\n').map((paragraph, pIdx) => {
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

              if (paragraph.trim().startsWith('#')) {
                const clean = paragraph.replace(/^#+\s*/, '');
                return (
                  <h3 key={pIdx} className="font-bold text-slate-100 text-base mt-2 mb-1">
                    <InlineMarkdown text={clean} />
                  </h3>
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

function InlineMarkdown({ text }: { text: string }) {
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
