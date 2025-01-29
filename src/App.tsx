import React from 'react';
import { Brain, Clock } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import ChessNapTracker from './components/ChessNapTracker';
import Stupidometer from './components/Stupidometer';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center">Chess Tools</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div 
            onClick={() => navigate('/nap-tracker')}
            className="group cursor-pointer"
          >
            <div className="bg-gray-800 rounded-2xl p-8 shadow-xl h-full transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-blue-500/30 flex flex-col">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-4 bg-blue-500/10 rounded-xl">
                  <Clock className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold">ChessNapTracker</h2>
              </div>
              <p className="text-gray-400 text-lg mb-8">
                Track your longest think times and discover where you're spending too much time in your chess games.
              </p>
              <div className="mt-auto">
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2">
                  <span>Track Your Naps</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/stupidometer')}
            className="group cursor-pointer"
          >
            <div className="bg-gray-800 rounded-2xl p-8 shadow-xl h-full transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-purple-500/30 flex flex-col">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-4 bg-purple-500/10 rounded-xl">
                  <Brain className="w-12 h-12 text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold">Stupidometer</h2>
              </div>
              <p className="text-gray-400 text-lg mb-8">
                Analyze your chess blunders and mistakes. Learn from your questionable moves and improve your game.
              </p>
              <div className="mt-auto">
                <button className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2">
                  <span>Analyze Games</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/nap-tracker" element={<ChessNapTracker />} />
        <Route path="/stupidometer" element={<Stupidometer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;