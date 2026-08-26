import { useEffect, useState, useCallback } from "react";
import { X, Share, Plus, Download } from "lucide-react";

const STORAGE_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOs = /Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOs;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** Android install prompt + iOS Add to Home Screen instructions */
export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (wasDismissedRecently()) return;

    const onIos = isIos();
    setIos(onIos);

    if (onIos) {
      const t = window.setTimeout(() => setVisible(true), 1800);
      return () => window.clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    markDismissed();
  }, []);

  const installAndroid = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setVisible(false);
    } catch {
      /* closed */
    }
    setDeferred(null);
  }, [deferred]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Campus Connect"
      className="fixed bottom-4 left-1/2 z-[9999] w-[min(92vw,420px)] -translate-x-1/2"
    >
      <div className="rounded-2xl border border-border bg-card p-4 shadow-elevated">
        <div className="flex items-start gap-3">
          <img
            src="/pwa-192.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">Campus Connect</h3>
            {ios ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">iPhone / iPad:</span> tap{" "}
                <Share className="inline h-3.5 w-3.5 align-text-bottom text-primary" />{" "}
                <strong>Share</strong>, then{" "}
                <Plus className="inline h-3.5 w-3.5 align-text-bottom text-primary" />{" "}
                <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Install the app for faster access and a full-screen experience.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Later
          </button>
          {!ios && deferred && (
            <button
              type="button"
              onClick={installAndroid}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
          )}
          {ios && (
            <span className="text-[11px] text-muted-foreground">Use Safari Share menu</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PwaInstallPrompt;
