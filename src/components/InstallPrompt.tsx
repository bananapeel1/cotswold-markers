"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if dismissed recently (7 days)
    const dismissed = localStorage.getItem("trailtap-install-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // iOS detection (no beforeinstallprompt support)
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (isiOS) {
      setIsIos(true);
      // Show after a short delay
      const timer = setTimeout(() => setVisible(true), 5000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: listen for the browser's install prompt
    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay so it's not jarring
      setTimeout(() => setVisible(true), 3000);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem("trailtap-install-dismissed", String(Date.now()));
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300 md:left-auto md:right-6 md:max-w-sm">
      <div className="bg-surface-container border border-outline-variant/20 rounded-2xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-xl">
              download
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface">
              Add TrailTap to Home Screen
            </p>
            {isIos ? (
              <p className="text-xs text-secondary mt-1 leading-relaxed">
                Tap{" "}
                <span className="inline-flex items-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline -mt-0.5">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                  </svg>
                </span>{" "}
                Share, then &quot;Add to Home Screen&quot; for offline access and quick launch.
              </p>
            ) : (
              <p className="text-xs text-secondary mt-1 leading-relaxed">
                Get quick access, offline maps, and a native app experience.
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
            className="mt-3 w-full bg-primary text-on-primary text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-transform"
          >
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
