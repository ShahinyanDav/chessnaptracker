import React from 'react';
import { Brain, Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

function Stupidometer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
              <span>←</span>
              <span>Back to Tools</span>
            </Link>
            <h1 className="text-3xl font-bold">Stupidometer</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
              <Construction className="w-24 h-24 text-blue-400 animate-pulse" />
              <h2 className="text-4xl font-bold">Coming Soon</h2>
              <p className="text-gray-400 max-w-lg">
                The Stupidometer is currently under construction. We're working hard to bring you advanced chess game analysis capabilities.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Stupidometer;