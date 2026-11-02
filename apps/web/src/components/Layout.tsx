import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Camera, Images, Users, Receipt, LogOut } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <span className="font-semibold text-primary text-lg">📸 Bill Capture</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.displayName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto max-w-lg px-4 py-4">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="sticky bottom-0 bg-white border-t border-border safe-area-inset-bottom">
        {user?.role === "user" ? (
          <div className="flex">
            <Link
              to="/capture"
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                isActive("/capture") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Camera className="h-5 w-5" />
              Chụp
            </Link>
            <Link
              to="/my"
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                isActive("/my") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Images className="h-5 w-5" />
              Của tôi
            </Link>
          </div>
        ) : (
          <div className="flex">
            <Link
              to="/admin/bills"
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                isActive("/admin/bills") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Receipt className="h-5 w-5" />
              Hóa đơn
            </Link>
            <Link
              to="/admin/users"
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                isActive("/admin/users") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Users className="h-5 w-5" />
              Nhân viên
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}

