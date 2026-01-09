
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GeminiService } from '../services/geminiService';
import { DetectionResult } from '../types';

interface LiveDemoProps {
  confidenceThreshold: number;
  cooldownSeconds: number;
}

const LiveDemo: React.FC<LiveDemoProps> = ({ confidenceThreshold, cooldownSeconds }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [lastSpoken, setLastSpoken] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const geminiRef = useRef<GeminiService | null>(null);

  useEffect(() => {
    geminiRef.current = new GeminiService();
  }, []);

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.4; // Low robotic tone
    window.speechSynthesis.speak(utterance);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Please ensure you are using HTTPS or localhost and have granted camera permissions.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsActive(false);
    setDetections(0 as any || []);
    window.speechSynthesis.cancel();
  };

  const processFrame = useCallback(async () => {
    if (!isActive || isProcessing || !videoRef.current || !canvasRef.current || !geminiRef.current) return;
    
    // Ensure video is ready
    if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Sync canvas size to video aspect ratio
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      
      const results = await geminiRef.current.detectObjects(base64Data);
      
      const validDetections = results.filter(d => d.confidence >= confidenceThreshold / 100);
      setDetections(validDetections);

      const now = Date.now();
      validDetections.forEach(det => {
        const lastTime = lastSpoken[det.label] || 0;
        if (now - lastTime > cooldownSeconds * 1000) {
          speak(det.label);
          setLastSpoken(prev => ({ ...prev, [det.label]: now }));
        }
      });
    }
    
    // Throttle the loop
    setTimeout(() => setIsProcessing(false), 1000);
  }, [isActive, isProcessing, confidenceThreshold, cooldownSeconds, lastSpoken, speak]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive) processFrame();
    }, 1200);
    return () => clearInterval(interval);
  }, [isActive, processFrame]);

  return (
    <div className="flex flex-col gap-10 w-full items-center">
      {/* Video Container */}
      <div className="relative aspect-video w-full bg-black border border-red-600/30 shadow-[0_0_40px_-10px_rgba(220,38,38,0.3)] overflow-hidden">
        
        {/* Placeholder UI */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <div className="w-16 h-16 border border-red-600/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <i className="fa-solid fa-camera-retro text-red-600/40 text-2xl"></i>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-all duration-700 grayscale-[0.3] contrast-[1.4] brightness-[0.7] ${isActive ? 'opacity-100' : 'opacity-0'}`}
        />
        
        <canvas ref={canvasRef} className="hidden" />

        {/* HUD Elements */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none z-20 font-mono text-[10px] text-red-600/60 p-5">
            <div className="absolute top-5 left-5 uppercase tracking-[0.2em]">
              Mode: Target_Acquisition<br/>
              Conf_Min: {confidenceThreshold}%
            </div>
            <div className="absolute top-5 right-5 text-right uppercase tracking-[0.2em]">
              Status: {isProcessing ? 'CALCULATING' : 'LOCKED'}<br/>
              Grid: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
            
            {/* Center Reticle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-40">
              <div className="absolute top-0 left-0 w-2 h-0.5 bg-red-600"></div>
              <div className="absolute top-0 left-0 h-2 w-0.5 bg-red-600"></div>
              <div className="absolute top-0 right-0 w-2 h-0.5 bg-red-600"></div>
              <div className="absolute top-0 right-0 h-2 w-0.5 bg-red-600"></div>
              <div className="absolute bottom-0 left-0 w-2 h-0.5 bg-red-600"></div>
              <div className="absolute bottom-0 left-0 h-2 w-0.5 bg-red-600"></div>
              <div className="absolute bottom-0 right-0 w-2 h-0.5 bg-red-600"></div>
              <div className="absolute bottom-0 right-0 h-2 w-0.5 bg-red-600"></div>
            </div>
          </div>
        )}

        {/* Bounding Boxes */}
        {isActive && detections.map((det, i) => {
          if (!det.box_2d) return null;
          const [ymin, xmin, ymax, xmax] = det.box_2d;
          const style = {
            top: `${ymin / 10}%`,
            left: `${xmin / 10}%`,
            width: `${(xmax - xmin) / 10}%`,
            height: `${(ymax - ymin) / 10}%`,
          };

          return (
            <div 
              key={i} 
              style={style}
              className="absolute z-20 border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
            >
              {/* Box Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-red-400"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-red-400"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-red-400"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-red-400"></div>

              {/* Box Label Overlay */}
              <div className="absolute -top-7 left-0 bg-red-600 text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter shadow-xl whitespace-nowrap flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-black animate-pulse"></span>
                {det.label} | {(det.confidence * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Control */}
      <div className="relative group">
        {!isActive ? (
          <button
            onClick={startCamera}
            className="px-14 py-4 border border-red-600 text-red-600 hover:bg-red-600 hover:text-black transition-all duration-300 font-mono font-bold uppercase tracking-[0.5em] text-xs active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.1)]"
          >
            Open Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="px-14 py-4 border border-red-900 bg-red-950/20 text-red-700 hover:bg-red-600 hover:text-black transition-all duration-300 font-mono font-bold uppercase tracking-[0.5em] text-xs active:scale-95"
          >
            Disconnect
          </button>
        )}
        
        {/* Button corner accents */}
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-red-600 pointer-events-none"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-red-600 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default LiveDemo;
