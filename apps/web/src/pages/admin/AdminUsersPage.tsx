import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { api, type User } from "@/api/client";
import { Plus, Pencil, Lock, Unlock } from "lucide-react";

interface UserFormData {
  username: string;
  displayName: string;
  company: string;
  password: string;
  role: "user" | "admin";
}

const emptyForm: UserFormData = {
  username: "",
  displayName: "",
  company: "",
  password: "",
  role: "user",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    api.admin.users
      .list()
      .then(setUsers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      username: u.username,
      displayName: u.displayName,
      company: u.company,
      password: "",
      role: u.role,
    });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editUser) {
        const update: Partial<{
          displayName: string;
          company: string;
          password: string;
        }> = {
          displayName: form.displayName,
          company: form.company,
        };
        if (form.password) update.password = form.password;
        await api.admin.users.update(editUser.id, update);
      } else {
        await api.admin.users.create({
          username: form.username,
          displayName: form.displayName,
          company: form.company,
          password: form.password,
          role: form.role,
        });
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await api.admin.users.update(u.id, { isActive: !u.isActive });
      fetchUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Nhân viên</h1>
          <Button size="sm" onClick={openCreate} className="gap-1">
            <Plus className="h-4 w-4" />
            Thêm
          </Button>
        </div>

        {error && !showForm && (
          <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Modal form */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <form
              className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => void handleSubmit(e)}
            >
              <h2 className="font-semibold text-lg">
                {editUser ? "Sửa nhân viên" : "Thêm nhân viên"}
              </h2>

              {!editUser && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Username
                  </label>
                  <input
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                    required
                    autoCapitalize="none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên hiển thị
                </label>
                <input
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Công ty
                </label>
                <input
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.company}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {editUser
                    ? "Mật khẩu mới (để trống nếu không đổi)"
                    : "Mật khẩu"}
                </label>
                <input
                  type="password"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required={!editUser}
                />
              </div>

              {!editUser && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vai trò
                  </label>
                  <select
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        role: e.target.value as "user" | "admin",
                      }))
                    }
                  >
                    <option value="user">Nhân viên</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  Huỷ
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* User list */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Đang tải...
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className={`rounded-xl border border-border bg-white p-4 flex items-center gap-3 ${
                  !u.isActive ? "opacity-50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{u.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    @{u.username}
                    {u.company && ` · ${u.company}`}
                  </div>
                  <div className="text-xs mt-0.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        u.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.role === "admin" ? "Admin" : "Nhân viên"}
                    </span>
                    {!u.isActive && (
                      <span className="ml-1 inline-block px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive">
                        Đã khoá
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(u)}
                    title="Sửa"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void toggleActive(u)}
                    title={u.isActive ? "Khoá tài khoản" : "Mở khoá"}
                  >
                    {u.isActive ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

