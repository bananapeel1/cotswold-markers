"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// Type-only import — erased at compile time, so the firebase-admin code in
// siteContent.ts never reaches the client bundle.
import type {
  HomepageContent,
  LegalContent,
  SponsorsContent,
  MiscContent,
} from "@/data/siteContent";

type PageKey = "homepage" | "privacy" | "terms" | "sponsors" | "misc";

interface MarkerOption {
  shortCode: string;
  name: string;
}

interface AllContent {
  homepage?: HomepageContent;
  privacy?: LegalContent;
  terms?: LegalContent;
  sponsors?: SponsorsContent;
  misc?: MiscContent;
}

const PAGE_TABS: { key: PageKey; label: string }[] = [
  { key: "homepage", label: "Homepage" },
  { key: "privacy", label: "Privacy" },
  { key: "terms", label: "Terms" },
  { key: "sponsors", label: "Sponsors" },
  { key: "misc", label: "Misc" },
];

const inputCls =
  "w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls = "text-xs font-bold text-on-surface-variant block mb-1";
const iconBtnCls =
  "p-1.5 hover:bg-surface-container rounded-full text-primary disabled:opacity-30 disabled:hover:bg-transparent";

function BodyHint() {
  return (
    <p className="text-[10px] text-on-surface-variant mt-1">
      Blank line = new paragraph
    </p>
  );
}

/** "27 March 2026" → "2026-03-27" for a date input (local time, no TZ shift). */
function toDateInputValue(display: string): string {
  const d = new Date(display);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-03-27" → "27 March 2026", the display convention on the live pages. */
function fromDateInputValue(value: string): string {
  const d = new Date(`${value}T12:00:00`);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function HomepageEditor({
  content,
  markers,
  onChange,
}: {
  content: HomepageContent;
  markers: MarkerOption[];
  onChange: (c: HomepageContent) => void;
}) {
  const updateStep = (i: number, patch: Partial<HomepageContent["howItWorks"]["steps"][number]>) => {
    const steps = content.howItWorks.steps.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...content, howItWorks: { ...content.howItWorks, steps } });
  };
  const updateFeature = (i: number, patch: Partial<HomepageContent["wanderers"]["features"][number]>) => {
    const features = content.wanderers.features.map((f, j) => (j === i ? { ...f, ...patch } : f));
    onChange({ ...content, wanderers: { ...content.wanderers, features } });
  };
  const updateItem = (i: number, patch: Partial<HomepageContent["trailHighlights"]["items"][number]>) => {
    const items = content.trailHighlights.items.map((it, j) => (j === i ? { ...it, ...patch } : it));
    onChange({ ...content, trailHighlights: { ...content.trailHighlights, items } });
  };

  return (
    <>
      {/* How It Works */}
      <section className="bg-surface rounded-2xl p-6">
        <h2 className="font-headline font-bold text-primary text-lg mb-1">
          How It Works
        </h2>
        <p className="text-xs text-on-surface-variant mb-4">
          The three-step bento grid. Card colours and the big numbers are fixed
          by position.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kicker (small uppercase line)</label>
              <input
                value={content.howItWorks.sub}
                onChange={(e) =>
                  onChange({
                    ...content,
                    howItWorks: { ...content.howItWorks, sub: e.target.value },
                  })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Heading</label>
              <input
                value={content.howItWorks.heading}
                onChange={(e) =>
                  onChange({
                    ...content,
                    howItWorks: { ...content.howItWorks, heading: e.target.value },
                  })
                }
                className={inputCls}
              />
            </div>
          </div>
          {content.howItWorks.steps.map((step, i) => (
            <div key={i} className="rounded-lg bg-surface-container-low p-4 space-y-3">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                Step {i + 1}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Icon (material symbol name)</label>
                  <input
                    value={step.icon}
                    onChange={(e) => updateStep(i, { icon: e.target.value })}
                    placeholder="qr_code_scanner"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Title</label>
                  <input
                    value={step.title}
                    onChange={(e) => updateStep(i, { title: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Body</label>
                <textarea
                  value={step.body}
                  onChange={(e) => updateStep(i, { body: e.target.value })}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For the Wanderers */}
      <section className="bg-surface rounded-2xl p-6">
        <h2 className="font-headline font-bold text-primary text-lg mb-1">
          For the Wanderers
        </h2>
        <p className="text-xs text-on-surface-variant mb-4">
          The mid-page section with the photo. The photo itself is set in
          Settings (&ldquo;Wanderers image&rdquo;).
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Heading</label>
            <input
              value={content.wanderers.heading}
              onChange={(e) =>
                onChange({
                  ...content,
                  wanderers: { ...content.wanderers, heading: e.target.value },
                })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Body</label>
            <textarea
              value={content.wanderers.body}
              onChange={(e) =>
                onChange({
                  ...content,
                  wanderers: { ...content.wanderers, body: e.target.value },
                })
              }
              rows={4}
              className={`${inputCls} resize-none`}
            />
            <BodyHint />
          </div>
          <div>
            <label className={labelCls}>
              Photo card note (small line under &ldquo;X Local Stops&rdquo;)
            </label>
            <input
              value={content.wanderers.imageNote || ""}
              onChange={(e) =>
                onChange({
                  ...content,
                  wanderers: { ...content.wanderers, imageNote: e.target.value },
                })
              }
              className={inputCls}
            />
          </div>
          {content.wanderers.features.map((feature, i) => (
            <div key={i} className="rounded-lg bg-surface-container-low p-4 space-y-3">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                Feature {i + 1}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Icon (material symbol name)</label>
                  <input
                    value={feature.icon}
                    onChange={(e) => updateFeature(i, { icon: e.target.value })}
                    placeholder="restaurant"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Title</label>
                  <input
                    value={feature.title}
                    onChange={(e) => updateFeature(i, { title: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Body</label>
                <textarea
                  value={feature.body}
                  onChange={(e) => updateFeature(i, { body: e.target.value })}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trail Highlights */}
      <section className="bg-surface rounded-2xl p-6">
        <h2 className="font-headline font-bold text-primary text-lg mb-1">
          Trail Highlights
        </h2>
        <p className="text-xs text-on-surface-variant mb-4">
          The three story cards near the bottom of the homepage. Each card links
          to the chosen marker&apos;s page.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kicker (small uppercase line)</label>
              <input
                value={content.trailHighlights.sub}
                onChange={(e) =>
                  onChange({
                    ...content,
                    trailHighlights: {
                      ...content.trailHighlights,
                      sub: e.target.value,
                    },
                  })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Heading</label>
              <input
                value={content.trailHighlights.heading}
                onChange={(e) =>
                  onChange({
                    ...content,
                    trailHighlights: {
                      ...content.trailHighlights,
                      heading: e.target.value,
                    },
                  })
                }
                className={inputCls}
              />
            </div>
          </div>
          {content.trailHighlights.items.map((item, i) => (
            <div key={i} className="rounded-lg bg-surface-container-low p-4 space-y-3">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                Highlight {i + 1}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Name</label>
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Links to marker</label>
                  <select
                    value={item.markerId}
                    onChange={(e) => updateItem(i, { markerId: e.target.value })}
                    className={inputCls}
                  >
                    {item.markerId &&
                      !markers.some((m) => m.shortCode === item.markerId) && (
                        <option value={item.markerId}>{item.markerId}</option>
                      )}
                    {markers.map((m) => (
                      <option key={m.shortCode} value={m.shortCode}>
                        {m.shortCode} — {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Blurb</label>
                <textarea
                  value={item.blurb}
                  onChange={(e) => updateItem(i, { blurb: e.target.value })}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>Image URL (optional)</label>
                <input
                  value={item.imageUrl}
                  onChange={(e) => updateItem(i, { imageUrl: e.target.value })}
                  placeholder="https://..."
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function LegalEditor({
  title,
  content,
  onChange,
}: {
  title: string;
  content: LegalContent;
  onChange: (c: LegalContent) => void;
}) {
  const setSections = (sections: LegalContent["sections"]) =>
    onChange({ ...content, sections });

  const move = (i: number, delta: -1 | 1) => {
    const sections = [...content.sections];
    const j = i + delta;
    if (j < 0 || j >= sections.length) return;
    [sections[i], sections[j]] = [sections[j], sections[i]];
    setSections(sections);
  };

  return (
    <section className="bg-surface rounded-2xl p-6">
      <h2 className="font-headline font-bold text-primary text-lg mb-4">{title}</h2>
      <div className="space-y-4">
        <div className="max-w-xs">
          <label className={labelCls}>Last updated</label>
          <input
            type="date"
            value={toDateInputValue(content.lastUpdated)}
            onChange={(e) =>
              onChange({ ...content, lastUpdated: fromDateInputValue(e.target.value) })
            }
            className={inputCls}
          />
          <p className="text-[10px] text-on-surface-variant mt-1">
            Shown as &ldquo;Last updated: {content.lastUpdated}&rdquo;
          </p>
        </div>

        {content.sections.map((section, i) => (
          <div key={i} className="rounded-lg bg-surface-container-low p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                Section {i + 1}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className={iconBtnCls}
                  title="Move up"
                >
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === content.sections.length - 1}
                  className={iconBtnCls}
                  title="Move down"
                >
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                </button>
                <button
                  onClick={() => setSections(content.sections.filter((_, j) => j !== i))}
                  className="p-1.5 hover:bg-error-container rounded-full text-error"
                  title="Remove section"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
            <input
              value={section.heading}
              onChange={(e) =>
                setSections(
                  content.sections.map((s, j) =>
                    j === i ? { ...s, heading: e.target.value } : s
                  )
                )
              }
              placeholder="Section heading"
              className={inputCls}
            />
            <div>
              <textarea
                value={section.body}
                onChange={(e) =>
                  setSections(
                    content.sections.map((s, j) =>
                      j === i ? { ...s, body: e.target.value } : s
                    )
                  )
                }
                rows={6}
                placeholder="Section body"
                className={`${inputCls} resize-y`}
              />
              <BodyHint />
            </div>
          </div>
        ))}

        <button
          onClick={() => setSections([...content.sections, { heading: "", body: "" }])}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add section
        </button>
      </div>
    </section>
  );
}

function SponsorsEditor({
  content,
  onChange,
}: {
  content: SponsorsContent;
  onChange: (c: SponsorsContent) => void;
}) {
  const updateTier = (i: number, patch: Partial<SponsorsContent["tiers"][number]>) =>
    onChange({
      ...content,
      tiers: content.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)),
    });

  return (
    <>
      <section className="bg-surface rounded-2xl p-6">
        <h2 className="font-headline font-bold text-primary text-lg mb-4">Pitch</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Hero badge</label>
            <input
              value={content.heroBadge}
              onChange={(e) => onChange({ ...content, heroBadge: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Hero heading</label>
            <input
              value={content.heroHeading}
              onChange={(e) => onChange({ ...content, heroHeading: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Hero body</label>
            <textarea
              value={content.heroBody}
              onChange={(e) => onChange({ ...content, heroBody: e.target.value })}
              rows={3}
              className={`${inputCls} resize-none`}
            />
            <BodyHint />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Pricing heading</label>
              <input
                value={content.pricingHeading}
                onChange={(e) =>
                  onChange({ ...content, pricingHeading: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Pricing sub-line</label>
              <input
                value={content.pricingSub}
                onChange={(e) => onChange({ ...content, pricingSub: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface rounded-2xl p-6">
        <h2 className="font-headline font-bold text-primary text-lg mb-4">
          Pricing tiers
        </h2>
        <div className="space-y-4">
          {content.tiers.map((tier, i) => (
            <div key={i} className="rounded-lg bg-surface-container-low p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  Tier {i + 1}
                </p>
                <button
                  onClick={() =>
                    onChange({
                      ...content,
                      tiers: content.tiers.filter((_, j) => j !== i),
                    })
                  }
                  className="p-1.5 hover:bg-error-container rounded-full text-error"
                  title="Remove tier"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Name</label>
                  <input
                    value={tier.name}
                    onChange={(e) => updateTier(i, { name: e.target.value })}
                    placeholder="Trail Starter"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Price</label>
                  <input
                    value={tier.price}
                    onChange={(e) => updateTier(i, { price: e.target.value })}
                    placeholder="£45"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Period</label>
                  <input
                    value={tier.period}
                    onChange={(e) => updateTier(i, { period: e.target.value })}
                    placeholder="/yr"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Features — one per line</label>
                <textarea
                  value={tier.features.join("\n")}
                  onChange={(e) =>
                    updateTier(i, { features: e.target.value.split("\n") })
                  }
                  rows={4}
                  className={`${inputCls} resize-y`}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tier.highlighted === true}
                  onChange={(e) => updateTier(i, { highlighted: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="font-bold">
                  Highlighted (&ldquo;Most Popular&rdquo; styling)
                </span>
              </label>
            </div>
          ))}
          <button
            onClick={() =>
              onChange({
                ...content,
                tiers: [
                  ...content.tiers,
                  { name: "", price: "", period: "/yr", features: [] },
                ],
              })
            }
            className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add tier
          </button>
        </div>
      </section>
    </>
  );
}

function MiscEditor({
  content,
  onChange,
}: {
  content: MiscContent;
  onChange: (c: MiscContent) => void;
}) {
  return (
    <section className="bg-surface rounded-2xl p-6">
      <h2 className="font-headline font-bold text-primary text-lg mb-4">
        Odds &amp; ends
      </h2>
      <div>
        <label className={labelCls}>
          Rewards teaser (pill on the marker-page reward card while rewards are
          off)
        </label>
        <input
          value={content.rewardsTeaser}
          onChange={(e) => onChange({ ...content, rewardsTeaser: e.target.value })}
          placeholder="Launching Summer 2026"
          className={inputCls}
        />
      </div>
    </section>
  );
}

export default function ContentPage() {
  const [tab, setTab] = useState<PageKey>("homepage");
  const [contents, setContents] = useState<AllContent>({});
  const [markers, setMarkers] = useState<MarkerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      ...PAGE_TABS.map((t) =>
        fetch(`/api/content?page=${t.key}`).then((r) => (r.ok ? r.json() : null))
      ),
      fetch("/api/markers").then((r) => (r.ok ? r.json() : [])),
    ])
      .then((results) => {
        const markerList = results.pop();
        const next: AllContent = {};
        for (const result of results) {
          if (result?.page && result?.content) {
            next[result.page as PageKey] = result.content;
          }
        }
        setContents(next);
        if (Array.isArray(markerList)) {
          setMarkers(
            markerList
              .map((m: { shortCode?: string; name?: string }) => ({
                shortCode: m.shortCode || "",
                name: m.name || "",
              }))
              .filter((m: MarkerOption) => m.shortCode)
              .sort((a: MarkerOption, b: MarkerOption) =>
                a.shortCode.localeCompare(b.shortCode, undefined, { numeric: true })
              )
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    let content: unknown = contents[tab];
    if (!content) return;

    // Tidy the sponsors tiers: features are edited as raw textarea lines, so
    // drop blank lines before validating/saving.
    if (tab === "sponsors" && contents.sponsors) {
      content = {
        ...contents.sponsors,
        tiers: contents.sponsors.tiers.map((t) => ({
          ...t,
          features: t.features.map((f) => f.trim()).filter(Boolean),
        })),
      };
    }

    setSaving(true);
    setMessage("");
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: tab, content }),
    });

    if (res.ok) {
      setMessage("Saved — the live site picks this up within a few minutes");
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(
        `Error: ${
          Array.isArray(err.issues) ? err.issues.join(" · ") : err.error || "Save failed"
        }`
      );
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 5000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading page copy...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="bg-primary text-on-primary px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Pages &amp; Copy</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div
            className={`rounded-2xl p-4 text-sm font-bold ${
              message.startsWith("Error")
                ? "bg-error-container text-on-error-container"
                : "bg-tertiary-container text-on-tertiary-container"
            }`}
          >
            {message}
          </div>
        )}

        {/* Page picker */}
        <div className="flex gap-2 flex-wrap">
          {PAGE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                tab === t.key
                  ? "bg-primary text-on-primary"
                  : "bg-surface text-secondary hover:bg-surface-container"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "homepage" && contents.homepage && (
          <HomepageEditor
            content={contents.homepage}
            markers={markers}
            onChange={(c) => setContents((prev) => ({ ...prev, homepage: c }))}
          />
        )}
        {tab === "privacy" && contents.privacy && (
          <LegalEditor
            title="Privacy Policy"
            content={contents.privacy}
            onChange={(c) => setContents((prev) => ({ ...prev, privacy: c }))}
          />
        )}
        {tab === "terms" && contents.terms && (
          <LegalEditor
            title="Terms of Use"
            content={contents.terms}
            onChange={(c) => setContents((prev) => ({ ...prev, terms: c }))}
          />
        )}
        {tab === "sponsors" && contents.sponsors && (
          <SponsorsEditor
            content={contents.sponsors}
            onChange={(c) => setContents((prev) => ({ ...prev, sponsors: c }))}
          />
        )}
        {tab === "misc" && contents.misc && (
          <MiscEditor
            content={contents.misc}
            onChange={(c) => setContents((prev) => ({ ...prev, misc: c }))}
          />
        )}

        {!contents[tab] && (
          <div className="bg-surface rounded-2xl p-6 text-sm text-secondary">
            Could not load this page&apos;s copy — check you are signed in as an
            admin, then reload.
          </div>
        )}

        {contents[tab] && (
          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            >
              {saving
                ? "Saving..."
                : `Save ${PAGE_TABS.find((t) => t.key === tab)?.label}`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
