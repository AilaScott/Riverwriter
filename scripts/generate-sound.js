import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'public', 'sounds');
const outPath = path.join(outDir, 'timer-end.wav');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sampleRate = 44100;
const duration = 0.4;
const frequency = 880;
const amplitude = 0.4;

const numSamples = Math.floor(sampleRate * duration);
const data = Buffer.alloc(numSamples * 2);

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const value = Math.sin(2 * Math.PI * frequency * t) * amplitude * 32767;
  const fade = Math.min(1, i / 200, (numSamples - i) / 2000);
  data.writeInt16LE(Math.floor(value * fade), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

fs.writeFileSync(outPath, Buffer.concat([header, data]));
console.log('Generated placeholder timer sound:', outPath);
