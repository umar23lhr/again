const { spawn } = require('child_process');
const fs = require('fs');

/**
 * SilenceX Analyzer Node Script
 * Used within CEP Node context or external server.
 */
function analyzeSilence(filePath, threshold = -35, minDuration = 0.5) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error('File not found at path: ' + filePath));
        }

        const ffmpeg = spawn('ffmpeg', [
            '-i', filePath,
            '-af', `silencedetect=n=${threshold}dB:d=${minDuration}`,
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
            const segments = [];
            
            let matchStart;
            let matchEnd;
            
            const starts = [];
            const ends = [];
            
            while ((matchStart = silenceStartRegex.exec(output)) !== null) {
                starts.push(parseFloat(matchStart[1]));
            }
            while ((matchEnd = silenceEndRegex.exec(output)) !== null) {
                ends.push(parseFloat(matchEnd[1]));
            }

            for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
                segments.push({ start: starts[i], end: ends[i] });
            }

            resolve(segments);
        });

        ffmpeg.on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = { analyzeSilence };
