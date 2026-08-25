import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, ChevronDown, Zap, RotateCcw, AlertTriangle } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../types';
import { submitReview } from '../services/api';
import { AnalyzingLoader } from '../components/UIStates';

const SAMPLE_CODES: Record<string, { filename: string; code: string }> = {
  Python: {
    filename: 'user_service.py',
    code: `import sqlite3
import hashlib

def get_user(user_id):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # WARNING: Vulnerable to SQL injection
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    user = cursor.fetchone()
    return user

def authenticate(username, password):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Weak password hashing
    hashed = hashlib.md5(password.encode()).hexdigest()
    result = cursor.execute(
        f"SELECT * FROM users WHERE username='{username}' AND password='{hashed}'"
    ).fetchone()
    return result is not None

def process_users():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    users = cursor.execute("SELECT id FROM users").fetchall()
    # N+1 query problem
    for user in users:
        details = cursor.execute(f"SELECT * FROM details WHERE user_id = {user[0]}").fetchone()
        print(details)
`,
  },
  JavaScript: {
    filename: 'api.js',
    code: `const express = require('express');
const app = express();

// No input validation
app.post('/search', (req, res) => {
    const query = req.body.q;
    // Direct interpolation - XSS risk
    res.send('<h1>Results for: ' + query + '</h1>');
});

// Hardcoded secret
const API_KEY = 'sk-prod-abc123secret456';

app.get('/data', async (req, res) => {
    // No error handling
    const data = await fetch('https://api.example.com/data?key=' + API_KEY);
    const json = await data.json();
    res.json(json);
});

app.listen(3000);
`,
  },
  TypeScript: {
    filename: 'auth.ts',
    code: `import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

// Weak secret
const JWT_SECRET = 'secret123';

export function login(req: Request, res: Response) {
    const { username, password } = req.body;
    // No validation
    if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ username }, JWT_SECRET);
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
}

export function getUser(req: Request, res: Response) {
    const token = req.headers.authorization;
    // No try/catch
    const decoded = jwt.verify(token as string, JWT_SECRET);
    res.json(decoded);
}
`,
  },
};

export default function ReviewPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [filename, setFilename] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.value === language) || SUPPORTED_LANGUAGES[0];

  const handleLoadSample = () => {
    const lang = language !== 'auto' ? language : 'Python';
    const sample = SAMPLE_CODES[lang] || SAMPLE_CODES.Python;
    setCode(sample.code);
    setFilename(sample.filename);
    if (language === 'auto') setLanguage(lang);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please enter some code to review.');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const review = await submitReview({
        code,
        language: language === 'auto' ? undefined as any : language,
        filename: filename || undefined,
        userId: 'default_user',
        projectId: 'default_project',
      });

      // Navigate to results page with the review data
      navigate(`/results/${review.id}`, { state: { review } });
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'We could not complete the review. Please try again.');
    }
  };

  const handleClear = () => {
    setCode('');
    setFilename('');
    setStatus('idle');
    setError(null);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="glass-card p-10 w-full max-w-lg">
          <AnalyzingLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-slate-200 mb-2">Code Review</h1>
          <p className="text-slate-400">
            Submit your code for an AI-powered review. Gemini will analyze it across 5 quality dimensions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left panel — controls */}
          <div className="lg:col-span-1 space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {/* Language selector */}
            <div className="glass-card p-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Language
              </label>
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900/60 border border-indigo-500/20 text-sm text-slate-200 hover:border-indigo-500/40 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={langDropdownOpen}
                  id="language-selector"
                >
                  <span>{selectedLang.label}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {langDropdownOpen && (
                  <div
                    className="absolute z-50 w-full mt-1 glass-card shadow-xl overflow-hidden"
                    role="listbox"
                    aria-label="Select programming language"
                  >
                    <div className="max-h-60 overflow-y-auto py-1">
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                          key={lang.value}
                          role="option"
                          aria-selected={language === lang.value}
                          onClick={() => {
                            setLanguage(lang.value);
                            setLangDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            language === lang.value
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filename */}
            <div className="glass-card p-4">
              <label
                htmlFor="filename-input"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3"
              >
                Filename (optional)
              </label>
              <input
                id="filename-input"
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                placeholder="main.py"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-indigo-500/20 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
              />
              <p className="text-xs text-slate-600 mt-1.5">Helps with language detection</p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleLoadSample}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                id="load-sample-btn"
              >
                <Code2 size={14} />
                Load Sample Code
              </button>
              {code && (
                <button
                  onClick={handleClear}
                  className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 py-2 transition-colors"
                >
                  <RotateCcw size={13} />
                  Clear
                </button>
              )}
            </div>

            {/* Tips */}
            <div className="glass-card p-4 border-indigo-500/10">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tips</p>
              <ul className="space-y-2">
                {[
                  'Real code produces better analysis than pseudocode',
                  'Smaller focused functions are reviewed more precisely',
                  'Include any relevant context in filename',
                ].map(tip => (
                  <li key={tip} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <span className="text-indigo-500 shrink-0 mt-0.5">·</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right panel — code editor */}
          <div className="lg:col-span-3 space-y-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            {/* Editor header */}
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-500/10 bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono ml-2">
                    {filename || (language !== 'auto' ? `code.${language.toLowerCase()}` : 'untitled')}
                  </span>
                </div>
                <span className="text-xs text-slate-600">{code.length} chars</span>
              </div>

              <textarea
                id="code-editor"
                className="code-input w-full p-4 min-h-[420px] rounded-none border-0"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={`// Paste your ${language === 'auto' ? '' : language + ' '}code here...\n// CodePulse will analyze it across 5 quality dimensions.\n\n// Or click "Load Sample Code" to try a vulnerable example.`}
                spellCheck={false}
                aria-label="Code input"
                aria-describedby="code-editor-hint"
              />
            </div>

            <p id="code-editor-hint" className="sr-only">
              Enter code to review. Supports Python, JavaScript, TypeScript, Java, Go, C++, and more.
            </p>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20"
                role="alert"
              >
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!code.trim()}
              className="btn-primary w-full flex items-center justify-center gap-3 text-base py-4"
              id="submit-review-btn"
              aria-disabled={!code.trim()}
            >
              <Zap size={18} />
              Analyze with Gemini
            </button>

            <p className="text-xs text-slate-600 text-center">
              Analysis powered by Gemini through Vertex AI on Google Cloud
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
