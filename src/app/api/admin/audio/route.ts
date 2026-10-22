import { NextRequest, NextResponse } from "next/server";
import { invalidateContent } from "@/lib/firestoreRead";
import { getDb, getStorageBucket, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import type { Story } from "@/data/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George — warm British male
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const STORAGE_PREFIX = "audio/stories";
const COST_PER_1K_CHARS = 0.03; // dollars

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

/** Characters sent to the TTS API — the narration is "{title}.\n\n{body}". */
function narrationCharacters(story: Pick<Story, "title" | "body">): number {
  return (story.title?.length || 0) + (story.body?.length || 0) + 3;
}

function estimatedCost(characters: number): number {
  return Number(((characters / 1000) * COST_PER_1K_CHARS).toFixed(2));
}

/** Per-story audio status: which stories have narration and what generating the rest would cost. */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const snapshot = await getDb().collection("stories").get();
    const status = snapshot.docs.map((doc) => {
      const story = doc.data() as Story;
      const characters = narrationCharacters(story);
      return {
        id: story.id || doc.id,
        title: story.title,
        characters,
        estimatedCost: estimatedCost(characters),
        hasAudio: !!story.audioUrl,
      };
    });
    return NextResponse.json(status);
  } catch (e) {
    console.error("Audio status read failed:", e);
    return dbUnavailable();
  }
}

/** Generate ElevenLabs narration for one story, upload it to Firebase Storage, and save the URL. */
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const storyId = body?.storyId;
  if (!storyId || typeof storyId !== "string") {
    return NextResponse.json({ error: "Story ID required" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Audio generation isn't configured — the ELEVENLABS_API_KEY environment variable is missing",
      },
      { status: 503 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  // Load the story + voice settings from Firestore
  let story: Story | undefined;
  let voiceId = DEFAULT_VOICE_ID;
  let modelId = DEFAULT_MODEL_ID;
  const db = getDb();
  const docRef = db.collection("stories").doc(storyId);
  try {
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }
    story = doc.data() as Story;

    // Voice/model are owner-configurable via siteSettings/global (audioVoiceId / audioModelId)
    try {
      const settings = (
        await db.collection("siteSettings").doc("global").get()
      ).data();
      if (typeof settings?.audioVoiceId === "string" && settings.audioVoiceId) {
        voiceId = settings.audioVoiceId;
      }
      if (typeof settings?.audioModelId === "string" && settings.audioModelId) {
        modelId = settings.audioModelId;
      }
    } catch {
      // Settings doc is optional — fall back to the defaults
    }
  } catch (e) {
    console.error("Audio generation: story load failed:", e);
    return dbUnavailable();
  }
  if (!story) return dbUnavailable();

  // Generate the narration — same request as scripts/generate-audio.ts
  const text = `${story.title}.\n\n${story.body}`;
  let mp3: Buffer | undefined;
  try {
    const res = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      let message: string;
      if (res.status === 401) {
        message =
          "ElevenLabs rejected the request (status 401) — the API key looks invalid.";
      } else if (res.status === 429) {
        message =
          "ElevenLabs rejected the request (status 429) — the character quota is exhausted.";
      } else {
        message = `ElevenLabs returned an error (status ${res.status})${
          detail ? `: ${detail.slice(0, 300)}` : ""
        }`;
      }
      return NextResponse.json({ error: message }, { status: 502 });
    }

    mp3 = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.error("ElevenLabs request failed:", e);
    return NextResponse.json(
      { error: "Could not reach ElevenLabs — please try again in a moment." },
      { status: 502 }
    );
  }
  if (!mp3) {
    return NextResponse.json(
      { error: "ElevenLabs returned an empty response — please try again." },
      { status: 502 }
    );
  }

  // Upload to Firebase Storage and save the public URL on the story
  try {
    const bucket = getStorageBucket();
    const filePath = `${STORAGE_PREFIX}/${storyId}.mp3`;
    const file = bucket.file(filePath);

    await file.save(mp3, {
      metadata: {
        contentType: "audio/mpeg",
        cacheControl: "public, max-age=31536000",
      },
    });
    await file.makePublic();

    const audioUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    await docRef.update({ audioUrl });
    invalidateContent("stories");

    const characters = narrationCharacters(story);
    return NextResponse.json({
      success: true,
      audioUrl,
      characters,
      estimatedCost: estimatedCost(characters),
    });
  } catch (e) {
    console.error("Audio upload/save failed:", e);
    return dbUnavailable();
  }
}
