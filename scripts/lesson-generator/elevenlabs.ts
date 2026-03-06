import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'https://api.elevenlabs.io/v1';

interface Voice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;         // English voice
  voiceIdAr?: string;      // Arabic voice (optional)
  modelId?: string;        // default: eleven_multilingual_v2
  stability?: number;      // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
}

export async function listVoices(apiKey: string): Promise<Voice[]> {
  const res = await fetch(`${API_BASE}/voices`, {
    headers: { 'xi-api-key': apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs voices error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.voices;
}

export async function generateSpeech(
  text: string,
  config: ElevenLabsConfig,
  outputPath: string,
): Promise<{ durationMs: number }> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Skip if audio already exists (caching)
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    if (stats.size > 0) {
      // Estimate duration from file size (~16kbps for MP3)
      const durationMs = Math.round((stats.size / 2000) * 1000);
      console.log(`  [cached] ${path.basename(outputPath)}`);
      return { durationMs };
    }
  }

  const res = await fetch(
    `${API_BASE}/text-to-speech/${config.voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: config.modelId || 'eleven_multilingual_v2',
        voice_settings: {
          stability: config.stability ?? 0.5,
          similarity_boost: config.similarityBoost ?? 0.75,
        },
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs TTS error: ${res.status} ${errText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);

  // Estimate duration from file size (~16kbps for MP3)
  const durationMs = Math.round((buffer.length / 2000) * 1000);
  console.log(`  [generated] ${path.basename(outputPath)} (${Math.round(durationMs / 1000)}s)`);

  return { durationMs };
}

export async function generateLessonAudio(
  narrations: string[],
  config: ElevenLabsConfig,
  outputDir: string,
  lessonPrefix: string,
  delayBetweenMs = 500,
): Promise<{ files: string[]; durations: number[] }> {
  const files: string[] = [];
  const durations: number[] = [];

  for (let i = 0; i < narrations.length; i++) {
    const narration = narrations[i];
    if (!narration || narration.trim().length === 0) {
      files.push('');
      durations.push(6500); // default slide time
      continue;
    }

    const filename = `${lessonPrefix}-s${i}.mp3`;
    const outputPath = path.join(outputDir, filename);

    const { durationMs } = await generateSpeech(narration, config, outputPath);
    files.push(filename);
    durations.push(durationMs);

    // Rate limiting delay
    if (i < narrations.length - 1 && delayBetweenMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }

  return { files, durations };
}
