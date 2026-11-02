import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { api, type AdminUserGroup, type Bill } from "@/api/client";
import { openinaryUrl, openinaryThumbnailUrl, IMAGE_MIMES } from "@/lib/utils";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import BillLightbox, { useBillLightbox } from "@/components/BillLightbox";


export default function AdminBillsPage() {
  const [groups, setGroups] = useState<AdminUserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>(
    {}
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const lightbox = useBillLightbox();

  useEffect(() => {
    api.admin.bills
      .list()
      .then((data) => {
        setGroups(data);
        if (data.length > 0)
          setExpandedUsers({ [data[0].user.id]: true });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleUser = (userId: string) =>
    setExpandedUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));

  const handleDelete = async (bill: Bill) => {
    if (!confirm(`Xoá hóa đơn "${bill.originalName}"?`)) return;
    setDeleting(bill._id);
    setError(null);
    try {
      await api.admin.bills.delete(bill._id);
      setGroups((prev) =>
        prev
          .map((g) => ({
            ...g,
            days: g.days
              .map((d) => ({
                ...d,
                bills: d.bills.filter((b) => b._id !== bill._id),
              }))
              .filter((d) => d.bills.length > 0),
          }))
          .filter((g) => g.days.length > 0)
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16 text-muted-foreground">
          Đang tải...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Tất cả hóa đơn</h1>

        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {groups.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            Chưa có hóa đơn nào.
          </div>
        )}

        {groups.map((group) => (
          <div
            key={group.user.id}
            className="rounded-xl border border-border bg-white overflow-hidden"
          >
            {/* User header */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 font-medium text-sm hover:bg-accent transition-colors"
              onClick={() => toggleUser(group.user.id)}
            >
              <span>
                👤 {group.user.displayName}
                <span className="text-muted-foreground font-normal ml-1">
                  @{group.user.username}
                </span>
                {group.user.company && (
                  <span className="text-muted-foreground font-normal ml-1">
                    · {group.user.company}
                  </span>
                )}
              </span>
              {expandedUsers[group.user.id] ? (
                <ChevronUp className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </button>

            {expandedUsers[group.user.id] && (
              <div className="border-t border-border divide-y divide-border">
                {group.days.map((day) => (
                  <div key={day.dayKey} className="p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      📅 {day.dayKey} ({day.bills.length} ảnh)
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {day.bills.map((bill) => (
                        <div key={bill._id} className="relative group">
                          {IMAGE_MIMES.includes(bill.mimeType) ? (
                            <button
                              type="button"
                              className="block w-full"
                              aria-label={`Xem ${bill.originalName}`}
                              onClick={() => lightbox.openAt(day.bills, bill)}
                            >
                              <img
                                src={openinaryThumbnailUrl(bill.path)}
                                alt={bill.originalName}
                                loading="lazy"
                                className="w-full rounded-lg object-cover aspect-[3/4]"
                              />
                            </button>
                          ) : (
                            <a
                              href={openinaryUrl(bill.path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center aspect-[3/4] rounded-lg bg-muted text-xs text-center p-2 text-primary underline"
                            >
                              {bill.originalName}
                            </a>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => void handleDelete(bill)}
                            disabled={deleting === bill._id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <BillLightbox state={lightbox.state} onClose={lightbox.close} />
    </Layout>
  );
}

