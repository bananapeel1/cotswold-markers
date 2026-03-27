"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const MARKER_VISIT_KEY = "trailtap-marker-visits";
const INSTALL_DISMISSED_KEY = "trailtap-install-dismissed";
const MIN_MARKER_VISITS = 2;

/** Track marker page visits and return the count */
function useMarkerVisitCount() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!pathname?.startsWith("/m/")) return;
    const visited: string[] = JSON.parse(
      localStorage.getItem(MARKER_VISIT_KEY) || "[]"
    );
    if (!visited.includes(pathname)) {
      visited.push(pathname);
      localStorage.setItem(MARKER_VISIT_KEY, JSON.stringify(visited));
    }
    setCount(visited.length);
  }, [pathname]);

  return count;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [fabVisible, setFabVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const markerVisits = useMarkerVisitCount();
  const pathname = usePathname();

  // Check if already installed
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
    }
  }, []);

  // Determine if user previously dismissed the banner
  const wasDismissed = useCallback(() => {
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    return (
      !!dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000
    );
  }, []);

  useEffect(() => {
    if (isStandalone) return;

    // iOS detection
    const ua = navigator.userAgent;
    const isiOS =
      /iPad|iPhone|iPod/.test(ua) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    if (isiOS) {
      setIsIos(true);
    }

    // Android/Desktop: listen for the browser's install prompt
    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, [isStandalone]);

  // Show banner after enough marker visits, or show FAB if dismissed
  useEffect(() => {
    if (isStandalone) return;
    if (markerVisits < MIN_MARKER_VISITS) return;

    if (wasDismissed()) {
      // User dismissed before — show the subtle FAB on marker pages instead
      if (pathname?.startsWith("/m/")) {
        setFabVisible(true);
      }
      return;
    }

    // For iOS show after 2+ visits, for Android/Desktop also need the prompt event
    if (isIos || deferredPrompt) {
      const timer = setTimeout(() => setBannerVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [markerVisits, isIos, deferredPrompt, isStandalone, wasDismissed, pathname]);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setBannerVisible(false);
        setFabVisible(false);
      }
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setBannerVisible(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
    // Show FAB instead if on a marker page
    if (pathname?.startsWith("/m/")) {
      setFabVisible(true);
    }
  }

  function handleFabClick() {
    if (isIos) {
      // Re-show the banner with iOS instructions
      setFabVisible(false);
      setBannerVisible(true);
    } else {
      handleInstall();
    }
  }

  if (isStandalone) return null;

  return (
    <>
      {/* ── Floating Action Button (shown after banner dismiss, on marker pages) ── */}
      {fabVisible && !bannerVisible && (
        <button
          onClick={handleFabClick}
          className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center animate-in fade-in duration-300"
          aria-label="Install TrailTap"
        >
          <span className="material-symbols-outlined text-xl">download</span>
          {/* Pulsing attention dot */}
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        </button>
      )}

      {/* ── Install Banner ── */}
      {bannerVisible && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300 md:left-auto md:right-6 md:max-w-sm">
          <div className="bg-surface-container border border-outline-variant/20 rounded-2xl shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">
                  download
                </span>
                {/* Pulsing attention dot */}
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">
                  Install TrailTap
                </p>
                {isIos ? (
                  <div className="mt-1.5 space-y-1.5">
                    <p className="text-xs text-secondary leading-relaxed">
                      Works offline. No app store needed.
                    </p>
                    <ol className="text-xs text-secondary leading-relaxed list-none space-y-1">
                      <li className="flex items-start gap-1.5">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          Tap the{" "}
                          <span className="inline-flex items-center">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="inline -mt-0.5"
                            >
                              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                            </svg>
                          </span>{" "}
                          Share button in Safari
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0 mt-0.5">
                          2
                        </span>
                        <span>Scroll down and tap &quot;Add to Home Screen&quot;</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0 mt-0.5">
                          3
                        </span>
                        <span>Tap &quot;Add&quot; to confirm</span>
                      </li>
                    </ol>
                  </div>
                ) : (
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Works offline. No app store needed. Get quick access,
                    offline maps, and a native app experience.
                  </p>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="text-secondary/60 hover:text-secondary p-1 -mt-1 -mr-1"
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            {!isIos && (
              <button
                onClick={handleInstall}
                className="mt-3 w-full bg-primary text-on-primary text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Install App
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
