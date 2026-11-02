import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { api, type DayGroup, type Bill } from "@/api/client";
import { openinaryUrl, openinaryThumbnailUrl, IMAGE_MIMES } from "@/lib/utils";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import BillLightbox, { useBillLightbox } from "@/components/BillLightbox";

export default function MyBillsPage() {
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lightbox = useBillLightbox();

  useEffect(() => {
    api.bills
      .mine()
      .then((data) => {
        setGroups(data);
        if (data.length > 0) setExpanded({ [data[0].dayKey]: true });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (dayKey: string) =>
    setExpanded((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }));

  const handleDelete = async (bill: Bill) => {
    if (!confirm(`Xoá hóa đơn "${bill.originalName}"?`)) return;
    setDeleting(bill._id);
    setError(null);
    try {
      await api.bills.delete(bill._id);
      setGroups((prev) =>
        prev
          .map((g) => ({
            ...g,
            bills: g.bills.filter((b) => b._id !== bill._id),
          }))
          .filter((g) => g.bills.length > 0)
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
        <h1 className="text-xl font-bold">Hóa đơn của tôi</h1>

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
            key={group.dayKey}
            className="rounded-xl border border-border bg-white overflow-hidden"
          >
            <button
              className="w-full flex items-center justify-between px-4 py-3 font-medium text-sm hover:bg-accent transition-colors"
              onClick={() => toggleDay(group.dayKey)}
            >
              <span>
                📅 {group.dayKey}{" "}
                <span className="text-muted-foreground font-normal">
                  ({group.bills.length} ảnh)
                </span>
              </span>
              {expanded[group.dayKey] ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expanded[group.dayKey] && (
              <div className="grid grid-cols-2 gap-2 p-3 border-t border-border">
                {group.bills.map((bill) => (
                  <div key={bill._id} className="relative group">
                    {IMAGE_MIMES.includes(bill.mimeType) ? (
                      <button
                        type="button"
                        className="block w-full"
                        aria-label={`Xem ${bill.originalName}`}
                        onClick={() => lightbox.openAt(group.bills, bill)}
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
            )}
          </div>
        ))}
      </div>
      <BillLightbox state={lightbox.state} onClose={lightbox.close} />
    </Layout>
  );
}

