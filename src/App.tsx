import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, 
  Settings2, 
  VolumeX, 
  Play, 
  History, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Import,
  Waves
} from 'lucide-react';

interface SilenceSegment {
  start: number;
  end: number;
}

export default function App() {
  const [threshold, setThreshold] = useState(-42);
  const [minDuration, setMinDuration] = useState(0.5);
  const [padding, setPadding] = useState(0.15);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [segments, setSegments] = useState<SilenceSegment[]>([]);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock Waveform Data
  const [waveformData, setWaveformData] = useState<number[]>([]);

  useEffect(() => {
    const data = Array.from({ length: 500 }, () => Math.random() * 0.8 + 0.1);
    setWaveformData(data);
  }, []);

  useEffect(() => {
    drawWaveform();
    const handleResize = () => drawWaveform();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [waveformData, segments]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    // Grid Background (Subtle)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Waveform - Simple Bars per theme aesthetic
    const barsCount = 80;
    const barWidth = width / barsCount;
    const padding = 2;
    
    ctx.fillStyle = '#444';
    for (let i = 0; i < barsCount; i++) {
        const val = waveformData[Math.floor(i * (waveformData.length / barsCount))] || 0.1;
        const h = val * (height * 0.6);
        const x = i * barWidth + padding;
        const y = (height - h) / 2;
        
        // Check if this bar is in a silence segment
        const timeAtBar = (i / barsCount) * 20;
        const isSilent = segments.some(s => timeAtBar >= s.start && timeAtBar <= s.end);
        
        ctx.fillStyle = isSilent ? '#666' : '#444';
        ctx.fillRect(x, y, barWidth - padding * 2, h);
    }

    // Silence Masks (RED)
    segments.forEach(seg => {
      const xStart = (seg.start / 20) * width;
      const xEnd = (seg.end / 20) * width;
      const maskWidth = xEnd - xStart;

      ctx.fillStyle = 'rgba(226, 76, 76, 0.25)';
      ctx.fillRect(xStart, height * 0.1, maskWidth, height * 0.8);
      
      ctx.strokeStyle = '#e24c4c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xStart, height * 0.1);
      ctx.lineTo(xStart, height * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xEnd, height * 0.1);
      ctx.lineTo(xEnd, height * 0.9);
      ctx.stroke();

      // Label "SILENCE" - manually drawn to match CSS aesthetic
      ctx.font = 'bold 10px Helvetica Neue';
      ctx.fillStyle = '#e24c4c';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '2px';
      ctx.fillText('SILENCE', xStart + maskWidth / 2, height * 0.1 - 5);
    });

    // Playhead line
    ctx.strokeStyle = '#3a8dff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.45, 0);
    ctx.lineTo(width * 0.45, height);
    ctx.stroke();
  };

  const [notification, setNotification] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setStatus('analyzing');
    setProgress(0);
    setSegments([]);
    setNotification(null);
    
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 150);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold, duration: minDuration })
      });
      const data = await response.json();
      setSegments(data.segments);
      setProgress(100);
      setStatus('complete');
      showNotification(`Detected ${data.segments.length} silent gaps`);
    } catch (error) {
      console.error(error);
      setStatus('idle');
      showNotification('Analysis failed');
    } finally {
      clearInterval(interval);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApply = () => {
    if (segments.length === 0) return;
    
    setStatus('analyzing'); // Show processing state
    
    // Call Adobe Bridge
    if (typeof (window as any).CSInterface !== 'undefined') {
      const cs = new (window as any).CSInterface();
      const segmentsJson = JSON.stringify(segments);
      
      cs.evalScript(`silenceX.applyCuts('${segmentsJson}')`, (res: any) => {
        setStatus('idle');
        setSegments([]); // Clear segments after successful application
        showNotification(res || 'Cuts applied successfully');
      });
    } else {
      // Fallback for browser demo
      setTimeout(() => {
        setStatus('idle');
        setSegments([]);
        showNotification('Simulation: Multi-track cuts applied');
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#161616] text-[#e0e0e0] font-sans selection:bg-[#3a8dff]/30 overflow-hidden">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#3a8dff] text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Geometric Balance Header */}
      <header className="h-[60px] bg-[#222222] border-b border-[#333333] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#3a8dff] to-[#1e4d8b] rounded-[6px] grid place-items-center text-white font-bold text-sm">
            SX
          </div>
          <div className="text-lg font-semibold tracking-wide">SilenceX by US</div>
        </div>
        <div className="text-[11px] uppercase tracking-[1px] text-[#3a8dff] border border-[#3a8dff] px-2.5 py-1 rounded-full">
          Sequence: Podcast_Ep12_Final
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[320px] bg-[#222222] border-r border-[#333333] p-6 flex flex-col gap-8 overflow-y-auto shrink-0">
          <button className="bg-[#333] hover:brightness-125 transition-all text-white border border-[#444] py-3 rounded-[6px] font-semibold text-sm">
            Import Active Sequence
          </button>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-[13px] font-medium text-[#959595]">
              <label>Silence Threshold</label>
              <span className="font-mono text-[#3a8dff]">{threshold}dB</span>
            </div>
            <input 
              type="range" min="-60" max="-20" value={threshold} 
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-[13px] font-medium text-[#959595]">
              <label>Min Silence Duration</label>
              <span className="font-mono text-[#3a8dff]">{minDuration.toFixed(2)}s</span>
            </div>
            <input 
              type="range" min="0.1" max="2.0" step="0.1" value={minDuration} 
              onChange={(e) => setMinDuration(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-[13px] font-medium text-[#959595]">
              <label>Padding (In/Out)</label>
              <span className="font-mono text-[#3a8dff]">{padding.toFixed(2)}s</span>
            </div>
            <input 
              type="range" min="0" max="0.5" step="0.05" value={padding} 
              onChange={(e) => setPadding(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex-1" />

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleAnalyze}
              disabled={status === 'analyzing'}
              className="bg-[#3a8dff] hover:brightness-110 text-white py-3 rounded-[6px] font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'analyzing' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'analyzing' ? 'Analyzing...' : 'Analyze Waveform'}
            </button>
            <button 
              onClick={handleApply}
              disabled={segments.length === 0 || status === 'analyzing'}
              className="bg-[#333] hover:brightness-110 border border-[#e24c4c] text-[#e24c4c] py-3 rounded-[6px] font-semibold text-sm transition-all disabled:opacity-50"
            >
              Apply & Ripple Cut
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col bg-[#0f0f0f] relative overflow-hidden">
          <div className="flex-1 relative p-5 flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full" />
            
            <AnimatePresence>
              {status === 'analyzing' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50"
                >
                  <div className="w-64 h-1 bg-[#222] rounded-full overflow-hidden mb-4">
                    <motion.div 
                      className="h-full bg-[#3a8dff]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-[10px] uppercase tracking-[2px] font-bold text-[#3a8dff]">Scanning Frequencies... {progress}%</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Timeline Ruler */}
          <div className="h-[40px] border-t border-[#333333] relative shrink-0">
             {[0, 20, 40, 60, 80].map((left) => (
               <React.Fragment key={left}>
                 <div className="absolute top-0 w-px h-2 bg-[#444]" style={{ left: `${left + 10}%` }} />
                 <span className="absolute top-4 font-mono text-[10px] text-[#666]" style={{ left: `${left + 10}%` }}>
                   00:00:{left < 10 ? '0' : ''}{left/2}:00
                 </span>
               </React.Fragment>
             ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-[50px] bg-[#222222] border-t border-[#333333] flex items-center justify-between px-6 shrink-0 text-[12px] text-[#959595]">
        <div>{segments.length > 0 ? `${segments.length} gaps detected (32.4s total)` : '0 gaps detected'}</div>
        <div>v1.0.0 | Ready</div>
      </footer>
    </div>
  );
}
