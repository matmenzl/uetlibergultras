import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { X, Download, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/uu_logo.svg";

const DISMISS_KEY = "install-prompt-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Capacitor.isNativePlatform()) return;

    // Already installed?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY)) return;

    const ua = window.navigator.userAgent;
    const iOS = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);
    const android = /Android/.test(ua);
    setIsAndroid(android);

    if (iOS) {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    // Fallback: if Android Chrome doesn't fire beforeinstallprompt
    // (e.g. no service worker), show manual instructions after 2s.
    const fallbackTimer = android
      ? window.setTimeout(() => setVisible(true), 2000)
      : null;

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!isMobile || !visible) return null;

  const showNativeButton = !!deferredPrompt;
  const showAndroidInstructions = isAndroid && !deferredPrompt;

  return (
    <div
      className="fixed bottom-4 inset-x-4 z-40 md:hidden animate-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-label="App installieren"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-lg p-3 shadow-lg">
        <img src={logo} alt="" className="h-10 w-10 shrink-0" />
        <div className="flex-1 min-w-0">
          {isIOS ? (
            <>
              <p className="text-sm font-semibold leading-tight">App installieren</p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5 flex items-center gap-1 flex-wrap">
                Tippe auf <Share className="h-3 w-3 inline" strokeWidth={2} /> und «Zum Home-Bildschirm»
              </p>
            </>
          ) : showAndroidInstructions ? (
            <>
              <p className="text-sm font-semibold leading-tight">App installieren</p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5 flex items-center gap-1 flex-wrap">
                Tippe auf <MoreVertical className="h-3 w-3 inline" strokeWidth={2} /> und «App installieren»
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold leading-tight">Uetliberg Ultras installieren</p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                Schneller Zugriff vom Homescreen
              </p>
            </>
          )}
        </div>
        {showNativeButton && (
          <Button size="sm" onClick={handleInstall} className="shrink-0 gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Installieren
          </Button>
        )}
        <button
          onClick={dismiss}
          aria-label="Schliessen"
          className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}