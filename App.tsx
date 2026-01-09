
import React from 'react';
import LiveDemo from './components/LiveDemo';

const App: React.FC = () => {
  // Check if API key is present to assist with Netlify configuration
  const isApiKeyMissing = typeof process !== 'undefined' && !process.env.API_KEY;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-0 m-0 overflow-hidden select-none">
      {/* Dynamic Red Glow Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(185,28,28,0.15)_0%,rgba(0,0,0,1)_100%)] z-0"></div>
      
      {/* Netlify/Environment Setup Warning */}
      {isApiKeyMissing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-md text-black px-4 py-3 font-mono text-xs font-bold uppercase text-center border-b-4 border-red-600 shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center justify-center gap-3 animate-slide-down">
          <i className="fa-solid fa-triangle-exclamation text-lg animate-pulse"></i>
          <span>
            SYSTEM ALERT: API_KEY MISSING. PLEASE CONFIGURE 'API_KEY' IN NETLIFY SITE SETTINGS.
          </span>
        </div>
      )}

      {/* Main Camera Module */}
      <main className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">
        <LiveDemo confidenceThreshold={90} cooldownSeconds={4} />
      </main>

      {/* Aesthetic scanning line */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-red-600/10 shadow-[0_0_10px_rgba(220,38,38,0.5)] z-20 animate-[scan_4s_linear_infinite]"></div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes slide-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
