import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api, type User } from "@/api/client";
import { Copy, Check } from "lucide-react";

export default function LoginLinkDialog({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [enabled, setEnabled] = useState(!!user.loginLinkEnabled);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/l/${user.id}`;

  const toggle = async () => {
    setError(null);
    try {
      await api.admin.users.update(user.id, { loginLinkEnabled: !enabled });
      setEnabled(!enabled);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard needs HTTPS; the field below is selectable as fallback */
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-lg">Link đăng nhập</h2>
        <p className="text-sm text-muted-foreground">
          {user.displayName} · @{user.username}
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={() => void toggle()} />
          Cho phép đăng nhập bằng link
        </label>

        {enabled && (
          <>
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full border border-input rounded-lg px-3 py-2 text-xs"
            />
            <Button className="w-full gap-1" onClick={() => void copy()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Đã chép" : "Sao chép link"}
            </Button>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button variant="outline" className="w-full" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}