import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { GeminiChatbot } from './components/GeminiChatbot';
import Landing from './pages/Landing';
import ReviewPage from './pages/ReviewPage';
import ResultsPage from './pages/ResultsPage';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/HistoryPage';
import ChatPage from './pages/ChatPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0a14]">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/chat" element={<ChatPage />} />
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen pt-20 flex items-center justify-center px-4 text-center">
                  <div>
                    <p className="text-6xl font-bold gradient-text mb-4">404</p>
                    <p className="text-slate-400">Page not found.</p>
                    <a href="/" className="btn-primary inline-flex items-center gap-2 mt-6 text-sm px-6 py-2.5">
                      Go home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
        {/* Global floating Gemini Assistant */}
        <GeminiChatbot />
      </div>
    </BrowserRouter>
  );
}

export default App;
