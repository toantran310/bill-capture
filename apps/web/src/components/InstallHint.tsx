import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const DISMISS_KEY = "install-hint-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallHint() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(
    null
  );
  const [hidden, setHidden] = useState(() => {
    if (isStandalone()) return true;
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (hidden || (!promptEvent && !isIOS)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage unavailable: just hide for this session */
    }
    setHidden(true);
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    setPromptEvent(null);
  };

  return (
    <div className="w-full rounded-xl border border-border bg-white p-3 flex items-start gap-3">
      <div className="flex-1 text-sm">
        {promptEvent ? (
          <>
            <p className="font-medium">Cài ứng dụng để mở nhanh hơn</p>
            <Button size="sm" className="mt-2 gap-1" onClick={() => void install()}>
              <Download className="h-4 w-4" />
              Cài đặt
            </Button>
          </>
        ) : (
          <p>
            Để mở nhanh hơn: bấm <Share className="inline h-4 w-4 align-text-bottom" />{" "}
            rồi chọn “Thêm vào Màn hình chính”.
          </p>
        )}
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dismiss} title="Đóng">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

