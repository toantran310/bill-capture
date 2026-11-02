import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";

export default function LinkWelcomePage() {
  const { userId = "" } = useParams();
  const { loginWithLink } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState<{ displayName: string; company: string } | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.auth.linkPreview(userId).then(setInfo).catch(() => setInvalid(true));
  }, [userId]);

  const handleLogin = async () => {
    setBusy(true);
    setError("");
    try {
      await loginWithLink(userId);
      navigate("/capture", { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-5xl">📸</div>

        {invalid ? (
          <>
            <h1 className="text-xl font-bold">Link không còn hiệu lực</h1>
            <p className="text-sm text-muted-foreground">
              Vui lòng liên hệ quản trị viên để nhận link mới.
            </p>
            <Link to="/login" className="text-sm text-primary underline">
              Đăng nhập bằng tài khoản
            </Link>
          </>
        ) : !info ? (
          <p className="text-muted-foreground">Đang tải...</p>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold">Xin chào, {info.displayName}!</h1>
              {info.company && (
                <p className="text-muted-foreground text-sm mt-1">{info.company}</p>
              )}
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <Button
              size="xl"
              className="w-full h-16 text-lg rounded-2xl"
              onClick={() => void handleLogin()}
              disabled={busy}
            >
              {busy ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}