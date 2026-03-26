"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Business } from "@/data/types";
import { getBusinessTypeEmoji } from "@/data/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface BusinessRewardState {
  offer: string;
  offerExpiry: string;
  discountCode: string;
  offerActive: boolean;
  saveStatus: SaveStatus;
}

export default function AdminRewardsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [rewardStates, setRewardStates] = useState<
    Record<string, BusinessRewardState>
  >({});
  const [loading, setLoading] = useState(true);
  const [rewardsLive, setRewardsLive] = useState(false);
  const [globalSaveStatus, setGlobalSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    Promise.all([
      fetch("/api/businesses").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([bizData, settingsData]) => {
        const bizList = bizData as Business[];
        setBusinesses(bizList);
        setRewardsLive(settingsData.rewardsLive ?? false);

        const states: Record<string, BusinessRewardState> = {};
        for (const b of bizList) {
          states[b.id] = {
            offer: b.offer || "",
            offerExpiry: b.offerExpiry || "",
            discountCode: b.discountCode || "",
            offerActive: !!b.offer,
            saveStatus: "idle",
          };
        }
        setRewardStates(states);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function updateReward(
    id: string,
    patch: Partial<BusinessRewardState>
  ) {
    setRewardStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  async function saveBusiness(business: Business) {
    const state = rewardStates[business.id];
    if (!state) return;

    updateReward(business.id, { saveStatus: "saving" });

    const res = await fetch("/api/businesses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business: {
          id: business.id,
          offer: state.offerActive ? state.offer || null : null,
          offerExpiry: state.offerActive ? state.offerExpiry || null : null,
          discountCode: state.offerActive ? state.discountCode || undefined : undefined,
        },
      }),
    });

    updateReward(business.id, {
      saveStatus: res.ok ? "saved" : "error",
    });
    setTimeout(() => updateReward(business.id, { saveStatus: "idle" }), 2000);
  }

  async function toggleRewardsLive() {
    const newValue = !rewardsLive;
    setRewardsLive(newValue);
    setGlobalSaveStatus("saving");

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { rewardsLive: newValue } }),
    });

    setGlobalSaveStatus(res.ok ? "saved" : "error");
    setTimeout(() => setGlobalSaveStatus("idle"), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading rewards...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">
              Rewards Management
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Global toggle */}
        <section className="bg-surface rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline font-bold text-primary text-lg">
                Rewards System
              </h2>
              <p className="text-sm text-secondary mt-1">
                Toggle the entire rewards system on or off for all users.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {globalSaveStatus === "saving" && (
                <span className="text-xs text-secondary">Saving...</span>
              )}
              {globalSaveStatus === "saved" && (
                <span className="text-xs text-primary font-bold">Saved!</span>
              )}
              <button
                onClick={toggleRewardsLive}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  rewardsLive ? "bg-primary" : "bg-surface-container-highest"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    rewardsLive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-bold uppercase ${
                  rewardsLive ? "text-primary" : "text-secondary"
                }`}
              >
                {rewardsLive ? "Live" : "Off"}
              </span>
            </div>
          </div>
        </section>

        {/* Business reward cards */}
        {businesses.length === 0 ? (
          <div className="bg-surface rounded-2xl p-6 text-center">
            <p className="text-secondary">No businesses found.</p>
          </div>
        ) : (
          businesses.map((biz) => {
            const state = rewardStates[biz.id];
            if (!state) return null;

            return (
              <section key={biz.id} className="bg-surface rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-headline font-bold text-primary text-lg flex items-center gap-2">
                      <span>{getBusinessTypeEmoji(biz.type)}</span>
                      {biz.name}
                    </h3>
                    <p className="text-xs text-secondary capitalize mt-0.5">
                      {biz.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-secondary">Offer active</span>
                    <button
                      onClick={() =>
                        updateReward(biz.id, {
                          offerActive: !state.offerActive,
                        })
                      }
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                        state.offerActive
                          ? "bg-primary"
                          : "bg-surface-container-highest"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          state.offerActive
                            ? "translate-x-5"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${
                    state.offerActive ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                      Offer
                    </label>
                    <input
                      value={state.offer}
                      onChange={(e) =>
                        updateReward(biz.id, { offer: e.target.value })
                      }
                      disabled={!state.offerActive}
                      placeholder="e.g. 10% off your first drink"
                      className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                      Offer Expiry
                    </label>
                    <input
                      type="date"
                      value={state.offerExpiry}
                      onChange={(e) =>
                        updateReward(biz.id, { offerExpiry: e.target.value })
                      }
                      disabled={!state.offerActive}
                      className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                      Discount Code
                    </label>
                    <input
                      value={state.discountCode}
                      onChange={(e) =>
                        updateReward(biz.id, { discountCode: e.target.value })
                      }
                      disabled={!state.offerActive}
                      placeholder="e.g. TRAIL10"
                      className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => saveBusiness(biz)}
                    disabled={state.saveStatus === "saving"}
                    className="bg-primary text-on-primary px-6 py-2 rounded-full text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {state.saveStatus === "saving"
                      ? "Saving..."
                      : state.saveStatus === "saved"
                      ? "Saved!"
                      : state.saveStatus === "error"
                      ? "Error"
                      : "Save"}
                  </button>
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
