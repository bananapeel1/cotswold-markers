# TrailTap Admin Guide

*The owner's handbook for running trail.thecotswoldsway.com without a developer.*
*Written August 2026, after the admin dashboard was completed.*

Everything content-related is edited at **https://trail.thecotswoldsway.com/admin**.
Sign in with an admin account (Google or email/password — the email must be on
the admin list). Edits go live immediately or within about a minute; **no
deploys are needed, and deploys no longer overwrite your edits.**

## What you can edit, and where

| I want to change… | Go to |
|---|---|
| A marker (text, photo, facilities, emergency info, position, seasonal notes, season photos, walking times) | **Edit Markers** → pick the marker |
| The QR code for a marker (print a new plaque) | The marker's edit page — QR at the top |
| Places on the map: pubs, cafés, toilets, pharmacies, medical, historic sites | **All POIs** |
| Verification status of a place (who confirmed it, when — the CWA workflow) | **All POIs** → edit → Verification box |
| Circular walks: details, difficulty, accessibility grading, PDFs, GPX links, the route line on the map | **Circular Walks** |
| Accessible sections of the Way | **Circular Walks** → Accessible sections tab |
| Stories (text, category, image, hidden/secret extras) | **Stories** |
| Story narration audio (generate/regenerate, costs shown before you confirm) | **Stories** → edit a story → Audio panel |
| Partner businesses (details, photos, linked markers) | **Businesses** |
| Discount offers and the rewards on/off switch | **Rewards** |
| Homepage sections, Privacy, Terms, Sponsor page + pricing | **Pages & Copy** |
| Badge names/descriptions/icons, milestone counts, XP amounts, rank names | **Badges** |
| Blog posts | **Blog** |
| Community photo approval, marker problem reports, trail conditions, hints | **Moderation** and **Photos** |
| Site name, tagline, hero images, social links, completion threshold | **Settings** |
| Who has admin access | **Admin Users** |
| Scan statistics | **Analytics** (and the Overview page) |

## Things to know

### Backups
**Settings → Download full backup** saves every piece of content as one file.
Do this after any big editing session and keep the file somewhere safe
(Google Drive, email to yourself). If something ever goes badly wrong, a
developer can restore from it.

### Adding an admin (e.g. someone from the CWA or National Landscape)
1. Ask them to create an account on the site first (Sign up, or Google
   sign-in) using the email address they gave you.
2. Add that exact email on **Admin Users**.
3. They have full access from their next sign-in — every admin can do
   everything, including managing other admins, so only add people you trust.
You can't remove yourself, and the last admin can never be removed.

### QR codes and scan tracking
QR codes printed from the dashboard now include `?source=qr` in the address —
that's what makes a walker's visit count as a real scan (badges, streaks, the
homepage counter). **Plaques printed before August 2026 don't have it**:
walkers can still read them and see the page, but their scans won't register
until the plaque is reprinted with a fresh QR from the marker's edit page.
Replace them as convenient, most-visited markers first.

### Moving a marker's pin
Marker positions are guarded — if you change one, the site asks you to
confirm the move (it tells you how far the pin moved). Only confirm if the
pin really is in the wrong place; the markers are physical posts.

### Walks and route lines
A walk's line on the map and its elevation profile come from a geometry file.
On the walk's edit page you can upload an official **GPX** (preferred — it
carries elevation) or GeoJSON. The upload is checked automatically: it must
be a closed loop, roughly match the stated distance, and lie in the Cotswolds.
If a file is rejected, the reasons are shown. After changing geometry, use
"Recompute nearby POIs" so the walk lists the right pubs/toilets.
Accessibility gradings are never self-certified — only record a published
grading, with its source and date, exactly as shown in the form.

### Verification (the CWA collaboration)
Every place (POI) carries a verification box: status (verified / unverified /
needs re-check), who confirmed it, a link, and a date. The POI list can be
filtered by this, and shows how many entries still need attention — that
banner is the CWA's work queue. The July 2026 audit has been imported as the
starting state.

### Audio narration
The Audio panel on each story shows the estimated cost before generating
(about $0.03 per 1,000 characters — a typical story is 3–5p... roughly
$0.04). "Generate all missing" does the whole backlog in one sitting and can
be stopped at any time. This uses the ElevenLabs account; if it reports a
quota error, the ElevenLabs plan needs topping up at elevenlabs.io.

### Pages & Copy
Text is plain — a blank line starts a new paragraph. There's no bold/links
inside body text (a deliberate simplification). Trail Highlights cards pick
their marker from a dropdown so links can't break.

## Accepted limitations (would need a developer)

1. **What earns a badge** — you can rename badges and change milestone
   counts, but the detection rules (e.g. "scanned before 7am") are code.
2. **The main Cotswold Way trail line** on maps (circular-walk lines ARE
   editable via upload).
3. **Layout, colours, map styling** — all words are editable; design is code.
4. **New POI types or story categories** beyond the current lists.
5. **The app's offline page and app-icon/name** (PWA shell).
6. **Links/bold inside body text** on legal pages and stories.
7. **Firebase, Vercel, ElevenLabs account settings** — platform consoles.
8. The repo's JSON files slowly go stale — they're only an emergency
   fallback; your real backup is the Settings download.

## One-time setup still to run (needs the service-account key, `npx tsx …`)

These were written but need Firebase credentials to execute; run each once
from the project folder (they're safe to re-run):

```bash
npx tsx scripts/import-verification.ts --commit   # July 2026 audit → verification fields
npx tsx scripts/seed-seasonal-notes.ts --commit   # existing seasonal notes → marker docs
npx tsx scripts/set-storage-cors.ts               # lets maps load admin-uploaded route lines
npx tsx scripts/seed-firestore.ts                 # creates the routes collections (safe: create-missing only)
```

Also add **`ELEVENLABS_API_KEY`** to the Vercel project's environment
variables (Settings → Environment Variables) so the audio button works in
production, then redeploy once.

## Health-check walkthrough (do this after any big change)

1. Sign out (or use a private window) → confirm /admin redirects to login.
2. Edit a story → check it on the live story page.
3. Edit a POI's verification → check the map popup shows it.
4. Open a walk → map line, elevation chart, PDF and GPX buttons all work.
5. Scan a *new-format* QR code with your phone → scan registers, confetti.
6. Settings → Download full backup → file downloads and opens.
7. After a deploy (any git push): spot-check one earlier edit survived —
   it always should now.
