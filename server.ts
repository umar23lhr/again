import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Silence Detection
  app.post('/api/analyze', async (req, res) => {
    const { threshold = -35, duration = 0.5, filePath } = req.body;

    // For the web demo, if no file is provided, we simulate a response
    if (!filePath || !fs.existsSync(filePath)) {
      console.log('Simulating analysis for demo...');
      // Return dummy segments
      return res.json({
        segments: [
          { start: 2.5, end: 4.2 },
          { start: 7.8, end: 10.5 },
          { start: 15.0, end: 16.8 }
        ],
        duration: 20
      });
    }

    try {
      // ffmpeg -i input.wav -af silencedetect=n=-35dB:d=0.5 -f null -
      const ffmpeg = spawn('ffmpeg', [
        '-i', filePath,
        '-af', `silencedetect=n=${threshold}dB:d=${duration}`,
        '-f', 'null',
        '-'
      ]);

      let output = '';
      ffmpeg.stderr.on('data', (data) => {
        output += data.toString();
      });

      ffmpeg.on('close', (code) => {
        const silenceStartRegex = /silence_start: ([\d.]+)/g;
        const silenceEndRegex = /silence_end: ([\d.]+)/g;
        const segments: { start: number; end: number }[] = [];
        
        let matchStart;
        let matchEnd;
        
        const starts: number[] = [];
        const ends: number[] = [];
        
        while ((matchStart = silenceStartRegex.exec(output)) !== null) {
          starts.push(parseFloat(matchStart[1]));
        }
        while ((matchEnd = silenceEndRegex.exec(output)) !== null) {
          ends.push(parseFloat(matchEnd[1]));
        }

        for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
          segments.push({ start: starts[i], end: ends[i] });
        }

        res.json({ segments });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'FFmpeg processing failed' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SilenceX Server running on http://localhost:${PORT}`);
  });
}

startServer();
