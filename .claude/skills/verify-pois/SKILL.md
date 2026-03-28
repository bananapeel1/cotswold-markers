---
name: verify-pois
description: Verify and fix POI coordinates against Google Maps, one geographic phase at a time
command: verify-pois
user_invocable: true
arguments: "[phase-number]"
---

# Verify POI Coordinates Against Google Maps

Verify and correct POI coordinates in `public/data/pois.json` by searching Google Maps for each place and extracting exact building-level coordinates. Processes one geographic phase per invocation.

## How to run

```
/verify-pois        # auto-detect next unfinished phase
/verify-pois 3      # run specific phase
```

## Phases

| Phase | Area | Approx POIs |
|-------|------|-------------|
| 1 | Chipping Campden + Broadway + Fish Hill | 20 |
| 2 | Stanton + Stanway + Winchcombe | 19 |
| 3 | Cleeve Hill + Cheltenham + Leckhampton | 8 |
| 4 | Birdlip + Cranham + Painswick | 12 |
| 5 | Stroud + Kings Stanley + Coaley + Dursley | 17 |
| 6 | Wotton + Hawkesbury + Sodbury + Cold Ashton + Bath | 25 |

## Instructions

1. **Read progress**: Load `.claude/poi-verification-progress.json` to see which POIs are already verified. If the file doesn't exist, start fresh.

2. **Determine phase**: Use the argument if provided, otherwise pick the first phase with unverified POIs.

3. **Load POI data**: Read `public/data/pois.json`. Filter to POIs in the target phase that are NOT in the verified list and NOT type "water" or "toilets".

4. **For each POI**, use web search to find its Google Maps listing:
   - Search: `"{POI name}" {town/village} Google Maps`
   - Look for the Google Maps place URL which contains coordinates in the format `!3d{lat}!4d{lng}` or `@{lat},{lng}`
   - If no Google Maps listing found, search the POI's postcode or address for coordinates
   - Extract the latitude and longitude

5. **Compare coordinates**:
   - Calculate distance between current and Google Maps coords using Haversine formula
   - If distance > 50m, flag for update
   - Record both old and new coordinates

6. **Apply updates**: Update `pois.json` with corrected coordinates in one pass.

7. **Update progress tracker**: Add all processed POI IDs to the verified list in `.claude/poi-verification-progress.json`. Record how many were updated.

8. **Validate**: Run `npx tsx scripts/validate-data.ts` to confirm no errors.

9. **Spot check**: Pick 2-3 updated POIs and open `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode=walking` in Chrome to verify Google Maps resolves to the correct place name.

10. **Report**: Print a summary table showing each POI, old coords, new coords, distance moved, and whether it was updated or confirmed correct.

## Phase geographic boundaries (by latitude)

- Phase 1: lat >= 52.02 (Chipping Campden, Broadway, Fish Hill)
- Phase 2: 51.93 <= lat < 52.02 (Stanton, Stanway, Winchcombe, Cleeve Hill)
- Phase 3: 51.84 <= lat < 51.93 (Cheltenham, Leckhampton, Seven Springs)
- Phase 4: 51.74 <= lat < 51.84 (Birdlip, Cranham, Painswick, Standish)
- Phase 5: 51.63 <= lat < 51.74 (Stroud, Kings Stanley, Uley, Coaley, Dursley)
- Phase 6: lat < 51.63 (Wotton, Hawkesbury, Sodbury, Tormarton, Cold Ashton, Bath)

## Special cases

- **Water points** (type "water"): Use https://trailtap.co.uk/ to verify locations. Navigate to the relevant marker page on trailtap.co.uk and check the water point coordinates shown there.
- **Toilets** (type "toilets"): Skip — already verified against Google Maps in a previous pass.
- **Campsites**: May not appear on Google Maps. Try the campsite name + village. If not found, try the campsite's website address or postcode.
- **Closed/renamed businesses**: If Google Maps shows a POI as permanently closed, flag it in the report for potential removal.

## Files

- `public/data/pois.json` — POI data to update
- `.claude/poi-verification-progress.json` — progress tracker
- `scripts/validate-data.ts` — validation script to run after updates
