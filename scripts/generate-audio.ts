#!/usr/bin/env npx tsx
/**
 * Generate audio narration for trail stories using ElevenLabs TTS.
 * Uploads MP3s to Firebase Storage and updates stories.json with public URLs.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... npx tsx scripts/generate-audio.ts
 *
 * Options:
 *   --voice <voice_id>     ElevenLabs voice ID (default: "JBFqnCBsd6RMkjVDRZzb" — George)
 *   --model <model_id>     TTS model (default: "eleven_multilingual_v2")
 *   --story <story_id>     Generate for a single story only
 *   --force                Regenerate even if audio already exists
 *   --dry-run              Show what would be generated without calling the API
 *   --list-voices          List available ElevenLabs voices and exit
 *   --migrate              Upload existing local MP3s to Firebase Storage
 */

import fs from "fs";
import path from "path";
import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = "https://api.elevenlabs.io/v1";

const STORIES_PATH = path.join(process.cwd(), "public/data/stories.json");
const LOCAL_AUDIO_DIR = path.join(process.cwd(), "public/audio");
const BUCKET_NAME = "thecotswoldsway-2c218.firebasestorage.app";
const STORAGE_PREFIX = "audio/stories";

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
const MIGRATE = hasFlag("migrate");

interface Story {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  audioUrl?: string;
}

function initFirebase() {
  if (getApps().length) return;

  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (keyJson) {
    const serviceAccount = JSON.parse(keyJson) as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount), storageBucket: BUCKET_NAME });
    return;
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./secrets/service-account.json";
  if (fs.existsSync(credPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credPath, "utf-8")) as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount), storageBucket: BUCKET_NAME });
    return;
  }

  initializeApp({ projectId: "thecotswoldsway-2c218", storageBucket: BUCKET_NAME });
}

async function uploadToFirebase(buffer: Buffer, storyId: string): Promise<string> {
  initFirebase();
  const bucket = getStorage().bucket();
  const filePath = `${STORAGE_PREFIX}/${storyId}.mp3`;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType: "audio/mpeg",
      cacheControl: "public, max-age=31536000",
    },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;
}

async function checkExistsOnFirebase(storyId: string): Promise<boolean> {
  initFirebase();
  const bucket = getStorage().bucket();
  const file = bucket.file(`${STORAGE_PREFIX}/${storyId}.mp3`);
  const [exists] = await file.exists();
  return exists;
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

async function generateAndUpload(story: Story): Promise<string> {
  if (!API_KEY) throw new Error("ELEVENLABS_API_KEY not set");

  const text = `${story.title}.\n\n${story.body}`;

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
  return await uploadToFirebase(buffer, story.id);
}

async function migrateLocalToFirebase() {
  console.log("Migrating local audio files to Firebase Storage...\n");

  const stories: Story[] = JSON.parse(fs.readFileSync(STORIES_PATH, "utf-8"));
  const updatedStories = [...stories];

  if (!fs.existsSync(LOCAL_AUDIO_DIR)) {
    console.log("No local audio directory found.");
    return;
  }

  const mp3Files = fs.readdirSync(LOCAL_AUDIO_DIR).filter((f) => f.endsWith(".mp3"));
  console.log(`Found ${mp3Files.length} local MP3 files\n`);

  let uploaded = 0;
  for (const file of mp3Files) {
    const storyId = file.replace(".mp3", "");
    const localPath = path.join(LOCAL_AUDIO_DIR, file);
    process.stdout.write(`  ${storyId}... `);

    try {
      const buffer = fs.readFileSync(localPath);
      const url = await uploadToFirebase(buffer, storyId);

      const idx = updatedStories.findIndex((s) => s.id === storyId);
      if (idx !== -1) {
        updatedStories[idx] = { ...updatedStories[idx], audioUrl: url };
      }

      uploaded++;
      console.log(`done → ${url}`);
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (uploaded > 0) {
    fs.writeFileSync(STORIES_PATH, JSON.stringify(updatedStories, null, 2) + "\n");
    console.log(`\nUpdated stories.json with ${uploaded} Firebase Storage URLs`);
    console.log("\nYou can now safely delete public/audio/ and remove the audioUrl merge from stories.ts");
  }
}

async function main() {
  if (LIST_VOICES) {
    await listVoices();
    return;
  }

  if (MIGRATE) {
    await migrateLocalToFirebase();
    return;
  }

  if (!API_KEY && !DRY_RUN) {
    console.error("Error: ELEVENLABS_API_KEY environment variable is required");
    console.error("  ELEVENLABS_API_KEY=sk_... npx tsx scripts/generate-audio.ts");
    process.exit(1);
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
    const toCheck = [...toProcess];
    toProcess = [];
    for (const s of toCheck) {
      if (s.audioUrl && s.audioUrl.startsWith("https://storage.googleapis.com/")) {
        console.log(`  [skip] ${s.id} — already on Firebase Storage`);
        continue;
      }
      toProcess.push(s);
    }
  }

  console.log(`\nWill generate audio for ${toProcess.length} stories`);
  console.log(`Voice: ${VOICE_ID} | Model: ${MODEL_ID}`);
  console.log(`Storage: Firebase Storage (${BUCKET_NAME})\n`);

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
      const audioUrl = await generateAndUpload(story);

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
