
import React from 'react';
import LiveDemo from './components/LiveDemo';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-0 m-0 overflow-hidden select-none">
      {/* Dynamic Red Glow Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(185,28,28,0.15)_0%,rgba(0,0,0,1)_100%)] z-0"></div>
      
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
      `}</style>
    </div>
  );
};

export default App;
