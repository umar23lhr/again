import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, 
  Settings2, 
  VolumeX, 
  Play, 
  Trash2,
  History as HistoryIcon,
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Waves,
  Zap,
  Activity,
  User
} from 'lucide-react';

interface SilenceSegment {
  id: string;
  start: number;
  end: number;
}

export default function App() {
  const [threshold, setThreshold] = useState(-35);
  const [minDuration, setMinDuration] = useState(0.5);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'cutting'>('idle');
  const [segments, setSegments] = useState<SilenceSegment[]>([]);
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
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

    // Subtle Hardware Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Waveform
    const step = width / (waveformData.length || 1);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1.5;
    
    waveformData.forEach((val, i) => {
      const x = i * step;
      const h = val * (height * 0.7);
      ctx.moveTo(x, (height - h) / 2);
      ctx.lineTo(x, (height + h) / 2);
    });
    ctx.stroke();

    // Gap Overlays (RED)
    segments.forEach(seg => {
      const xStart = (seg.start / 20) * width;
      const xEnd = (seg.end / 20) * width;
      const maskWidth = xEnd - xStart;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.fillRect(xStart, 0, maskWidth, height);
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xStart, 0); ctx.lineTo(xStart, height);
      ctx.moveTo(xEnd, 0); ctx.lineTo(xEnd, height);
      ctx.stroke();
    });
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAnalyze = async () => {
    setStatus('analyzing');
    setProgress(0);
    setSegments([]);
    
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
      const mappedSegments = data.segments.map((s: any, idx: number) => ({
        id: `GAP-${idx + 1}`,
        start: s.start,
        end: s.end
      }));
      setSegments(mappedSegments);
      setProgress(100);
      setStatus('idle');
      showNotification(`Found ${mappedSegments.length} segments`);
    } catch (error) {
      console.error(error);
      setStatus('idle');
      showNotification('Scan failed');
    } finally {
      clearInterval(interval);
    }
  };

  const handleApply = () => {
    if (segments.length === 0) return;
    setStatus('cutting');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    const finish = (message: string) => {
      clearInterval(interval);
      setProgress(100);
      setStatus('idle');
      setSegments([]);
      showNotification(message);
    };

    if (typeof (window as any).CSInterface !== 'undefined' && typeof (window as any).CSInterface === 'function') {
      try {
        const cs = new (window as any).CSInterface();
        cs.evalScript(`silenceX.applyCuts('${JSON.stringify(segments)}')`, (res: any) => {
          finish(res || 'Timeline successfully cleaned');
        });
      } catch (e) {
        console.error("CSInterface Error:", e);
        finish('Bridge connection failed');
      }
    } else {
      setTimeout(() => finish('Simulation: Timeline cleaned'), 1500);
    }
  };

  const removeSegment = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const totalSavings = segments.reduce((acc, s) => acc + (s.end - s.start), 0).toFixed(1);

  return (
    <div className="flex flex-col h-screen bg-[#0f1115] text-white font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* 1. Header Panel */}
      <header className="h-[70px] bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-8 shrink-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 gradient-indigo-purple rounded-xl flex items-center justify-center font-black text-white shadow-xl shadow-indigo-500/20">
            SX
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">SilenceX</h1>
            <p className="text-[10px] tracking-wider font-bold text-indigo-400 flex items-center gap-1.5 opacity-80">
              by Umar S.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full text-[10px] font-mono text-white/40">
            v1.4 BUILD
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. Left Control Sidebar (The Engine Room) */}
        <aside className="w-[340px] bg-white/[0.01] border-r border-white/[0.03] p-8 flex flex-col gap-10 overflow-y-auto shrink-0 frosted-glass z-30">
          
          <section className="space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-[11px] font-black uppercase tracking-[2px] text-white/40">Detection Tuning</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/60">Threshold Level</label>
                <span className="font-mono text-xs text-purple-400 font-bold">{threshold}dB</span>
              </div>
              <input 
                type="range" min="-60" max="-20" value={threshold} 
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/60">Gap Minimum</label>
                <span className="font-mono text-xs text-purple-400 font-bold">{minDuration}s</span>
              </div>
              <input 
                type="range" min="0.1" max="2.0" step="0.1" value={minDuration} 
                onChange={(e) => setMinDuration(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2 pt-2">
              {['LOW', 'MED', 'HIGH'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setThreshold(p === 'LOW' ? -25 : p === 'MED' ? -35 : -50)}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black tracking-widest hover:bg-white/10 transition-all font-mono"
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-auto space-y-4">
            <button 
              onClick={handleAnalyze} 
              disabled={status !== 'idle'}
              className="w-full py-4 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Activity className="w-4 h-4" />
              Scan Silence
            </button>
            <button 
              onClick={handleApply}
              disabled={segments.length === 0 || status !== 'idle'}
              className="w-full py-5 rounded-xl gradient-indigo-purple text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/40 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20"
            >
              <Scissors className="w-5 h-5" />
              Auto-Cut & Ripple Delete
            </button>
          </section>
        </aside>

        {/* 3. Central Analysis Pane (The Live View) */}
        <main className="flex-1 flex flex-col bg-black/20 overflow-hidden">
          
          <div className="p-8 pb-0 flex items-center justify-between z-10 shrink-0">
             <div>
                <h3 className="text-xl font-bold">Sequence-01 <span className="text-white/20 font-medium">/ Analysis</span></h3>
                <p className="text-[10px] uppercase font-bold text-white/40 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Real-time Scan Buffer
                </p>
             </div>
             <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                <Scissors className="w-4 h-4 text-indigo-400" />
                <div>
                   <p className="text-[9px] font-black tracking-widest text-indigo-400">ESTIMATED SAVINGS</p>
                   <p className="text-sm font-black font-mono">-{totalSavings}s</p>
                </div>
             </div>
          </div>

          <div className="flex-1 p-8 space-y-8 overflow-y-auto">
            
            {/* Waveform Card */}
            <div className="h-[240px] bg-[#15181e] rounded-[32px] border border-white/[0.03] shadow-2xl relative overflow-hidden shrink-0 group">
              <canvas ref={canvasRef} className="w-full h-full opacity-60" />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#15181e] via-transparent to-transparent opacity-50" />
              
              <div className="absolute top-4 left-6 flex items-center gap-2">
                 <Waves className="w-3 h-3 text-indigo-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Frequency Spectrum</span>
              </div>
            </div>

            {/* Detections Table */}
            <div className="space-y-4 pb-8">
              <div className="flex items-center gap-3 mb-6">
                <HistoryIcon className="w-4 h-4 text-purple-400" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-white/40">Detection Log</h4>
              </div>

              <div className="grid grid-cols-4 gap-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">
                <span>ID</span>
                <span>In-Point</span>
                <span>Duration</span>
                <span className="text-right">Action</span>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {segments.map((s, i) => (
                    <motion.div 
                      key={s.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-4 gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all items-center"
                    >
                      <span className="font-mono text-xs text-indigo-400 font-bold">{s.id}</span>
                      <span className="font-mono text-xs text-white/60">00:00:{s.start.toFixed(2)}</span>
                      <span className="font-mono text-xs text-purple-400">{(s.end - s.start).toFixed(2)}s</span>
                      <div className="flex justify-end">
                        <button 
                          onClick={() => removeSegment(s.id)}
                          className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          REMOVE
                        </button>
                      </div>
                    </motion.div>
                  )).reverse()}
                </AnimatePresence>
                
                {segments.length === 0 && (
                  <div className="h-40 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4 text-white/20">
                    <Activity className="w-8 h-8 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">Waiting for analysis scan...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 4. Interactive Footer */}
      <footer className="h-[60px] bg-black/40 backdrop-blur-3xl border-t border-white/[0.05] flex items-center px-8 justify-between relative z-40 overflow-hidden">
        
        {/* Progress Bar Background */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
           <motion.div 
              className="h-full gradient-indigo-purple"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
           />
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${status === 'analyzing' ? 'bg-indigo-500 shadow-indigo-500/40 animate-pulse' : status === 'cutting' ? 'bg-orange-500 shadow-orange-500/40 animate-spin' : 'bg-green-500 shadow-green-500/40'}`} />
            <span className="text-[11px] font-black uppercase tracking-widest text-white/50">
              {status === 'analyzing' ? 'Analyzing Audio Data...' : status === 'cutting' ? 'Processing Timeline...' : `Ready • Detected ${segments.length} gaps`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="w-[200px] h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-500" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
           </div>
           <span className="text-[10px] font-mono font-bold text-indigo-400">{progress}%</span>
        </div>
      </footer>

      {/* 5. Immersion Processing Overlay */}
      <AnimatePresence>
        {(status === 'analyzing' || status === 'cutting') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] backdrop-blur-3xl bg-black/60 flex items-center justify-center"
          >
            <div className="w-[400px] p-10 frosted-glass rounded-[40px] text-center space-y-8 shadow-[0_0_100px_rgba(99,102,241,0.2)]">
               <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-t-2 border-indigo-500 border-r-2 border-r-transparent mx-auto flex items-center justify-center"
                  >
                    <Zap className="w-10 h-10 text-indigo-500 fill-indigo-500 animate-bounce" />
                  </motion.div>
               </div>

               <div className="space-y-3">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                    {status === 'analyzing' ? 'Scanning Frequencies' : 'Executing Ripple Cut'}
                  </h2>
                  <p className="text-[10px] font-black tracking-widest text-white/30 uppercase">
                    Interacting with Premiere Pro Host API...
                  </p>
               </div>

               <div className="space-y-4">
                  <div className="text-4xl font-black font-mono text-indigo-400">{progress}%</div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
                     <motion.div 
                        className="h-full gradient-indigo-purple rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                     />
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-500/[0.05] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-purple-500/[0.05] blur-[150px] rounded-full" />
      </div>

      {/* Header Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] gradient-indigo-purple text-white px-8 py-3 rounded-full shadow-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
