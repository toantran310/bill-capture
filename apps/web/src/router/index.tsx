import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/store/auth";

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Đang tải...
    </div>
  );
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/capture" replace />;
  return <Outlet />;
}

export function RequireUser() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "user") return <Navigate to="/admin/bills" replace />;
  return <Outlet />;
}

