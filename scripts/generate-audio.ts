#!/usr/bin/env npx tsx
/**
 * Generate audio narration for trail stories using ElevenLabs TTS.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... npx tsx scripts/generate-audio.ts
 *
 * Options:
 *   --voice <voice_id>     ElevenLabs voice ID (default: "JBFqnCBsd6RMkjVDRZzb" — George)
 *   --model <model_id>     TTS model (default: "eleven_multilingual_v2")
 *   --story <story_id>     Generate for a single story only
 *   --force                Regenerate even if audio file already exists
 *   --dry-run              Show what would be generated without calling the API
 *   --list-voices          List available ElevenLabs voices and exit
 */

import fs from "fs";
import path from "path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = "https://api.elevenlabs.io/v1";

const STORIES_PATH = path.join(process.cwd(), "public/data/stories.json");
const AUDIO_DIR = path.join(process.cwd(), "public/audio");

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const VOICE_ID = getArg("voice") || "JBFqnCBsd6RMkjVDRZzb"; // George — warm British male
const MODEL_ID = getArg("model") || "eleven_multilingual_v2";
const SINGLE_STORY = getArg("story");
const FORCE = hasFlag("force");
const DRY_RUN = hasFlag("dry-run");
const LIST_VOICES = hasFlag("list-voices");

interface Story {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  audioUrl?: string;
}

async function listVoices() {
  if (!API_KEY) {
    console.error("Error: ELEVENLABS_API_KEY environment variable is required");
    process.exit(1);
  }

  const res = await fetch(`${BASE_URL}/voices`, {
    headers: { "xi-api-key": API_KEY },
  });
  const data = await res.json();

  console.log("\nAvailable voices:\n");
  for (const voice of data.voices) {
    const labels = voice.labels
      ? Object.entries(voice.labels)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "";
    console.log(`  ${voice.voice_id}  ${voice.name}  (${labels})`);
  }
  console.log(`\nTotal: ${data.voices.length} voices`);
}

async function generateAudio(story: Story): Promise<string> {
  if (!API_KEY) throw new Error("ELEVENLABS_API_KEY not set");

  // Prepare the text — title + summary + body
  const text = `${story.title}.\n\n${story.summary}\n\n${story.body}`;

  const res = await fetch(`${BASE_URL}/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${err}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = `${story.id}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  return `/audio/${filename}`;
}

async function main() {
  if (LIST_VOICES) {
    await listVoices();
    return;
  }

  if (!API_KEY && !DRY_RUN) {
    console.error("Error: ELEVENLABS_API_KEY environment variable is required");
    console.error("  ELEVENLABS_API_KEY=sk_... npx tsx scripts/generate-audio.ts");
    process.exit(1);
  }

  // Ensure audio directory exists
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  // Load stories
  const stories: Story[] = JSON.parse(fs.readFileSync(STORIES_PATH, "utf-8"));
  console.log(`Loaded ${stories.length} stories\n`);

  // Filter
  let toProcess = SINGLE_STORY
    ? stories.filter((s) => s.id === SINGLE_STORY)
    : stories;

  if (SINGLE_STORY && toProcess.length === 0) {
    console.error(`Story "${SINGLE_STORY}" not found`);
    process.exit(1);
  }

  // Skip already-generated unless --force
  if (!FORCE) {
    toProcess = toProcess.filter((s) => {
      const audioPath = path.join(AUDIO_DIR, `${s.id}.mp3`);
      if (fs.existsSync(audioPath)) {
        console.log(`  [skip] ${s.id} — audio already exists`);
        return false;
      }
      return true;
    });
  }

  console.log(`\nWill generate audio for ${toProcess.length} stories`);
  console.log(`Voice: ${VOICE_ID} | Model: ${MODEL_ID}\n`);

  if (DRY_RUN) {
    for (const story of toProcess) {
      const chars = story.title.length + story.summary.length + story.body.length;
      console.log(`  [dry-run] ${story.id} — "${story.title}" (${chars} chars)`);
    }
    const totalChars = toProcess.reduce(
      (sum, s) => sum + s.title.length + s.summary.length + s.body.length,
      0
    );
    console.log(`\nTotal characters: ${totalChars.toLocaleString()}`);
    console.log(
      `Estimated cost: ~$${((totalChars / 1000) * 0.03).toFixed(2)} (at $0.03/1k chars)`
    );
    return;
  }

  let generated = 0;
  let failed = 0;
  const updatedStories = [...stories];

  for (let i = 0; i < toProcess.length; i++) {
    const story = toProcess[i];
    const chars = story.title.length + story.summary.length + story.body.length;
    process.stdout.write(
      `  [${i + 1}/${toProcess.length}] ${story.id} — "${story.title}" (${chars} chars)... `
    );

    try {
      const audioUrl = await generateAudio(story);

      // Update the story in the array
      const idx = updatedStories.findIndex((s) => s.id === story.id);
      if (idx !== -1) {
        updatedStories[idx] = { ...updatedStories[idx], audioUrl };
      }

      generated++;
      console.log(`done → ${audioUrl}`);

      // Rate limit — wait 1 second between requests
      if (i < toProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      failed++;
      console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Write updated stories.json with audioUrl fields
  if (generated > 0) {
    fs.writeFileSync(STORIES_PATH, JSON.stringify(updatedStories, null, 2) + "\n");
    console.log(`\nUpdated stories.json with ${generated} audioUrl fields`);
  }

  console.log(`\nDone! Generated: ${generated}, Failed: ${failed}, Skipped: ${stories.length - toProcess.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
