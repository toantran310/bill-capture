import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/store/auth";
import { RequireAdmin, RequireUser } from "@/router";
import LoginPage from "@/pages/LoginPage";
import CapturePage from "@/pages/CapturePage";
import MyBillsPage from "@/pages/MyBillsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminBillsPage from "@/pages/admin/AdminBillsPage";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/bills" replace />;
  return <Navigate to="/capture" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* User routes */}
          <Route element={<RequireUser />}>
            <Route path="/capture" element={<CapturePage />} />
            <Route path="/my" element={<MyBillsPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/bills" element={<AdminBillsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

