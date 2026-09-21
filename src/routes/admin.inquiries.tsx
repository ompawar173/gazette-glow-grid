import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { Search, Mail, Eye, Trash2, CheckCircle, MailOpen, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inquiries")({
  ssr: false,
  component: InquiriesPage,
});

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  company: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
}

function InquiriesPage() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const loadInquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Could not load contact inquiries.");
    } else {
      setRows((data as Inquiry[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const toggleReadStatus = async (inquiry: Inquiry, status: boolean) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: status })
      .eq("id", inquiry.id);

    if (error) {
      toast.error("Could not update status.");
    } else {
      toast.success(status ? "Marked as read." : "Marked as unread.");
      setRows((prev) => prev.map((r) => (r.id === inquiry.id ? { ...r, is_read: status } : r)));
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, is_read: status } : null));
      }
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;

    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete inquiry.");
    } else {
      toast.success("Inquiry deleted.");
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesFilter =
        filter === "all" ? true : filter === "unread" ? !r.is_read : r.is_read;
      const searchStr = `${r.name} ${r.email} ${r.subject ?? ""} ${r.company ?? ""} ${r.message}`.toLowerCase();
      const matchesQuery = !q || searchStr.includes(q.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [rows, filter, q]);

  const unreadCount = rows.filter((r) => !r.is_read).length;

  return (
    <AdminGate title="Contact Inquiries">
      <div className="space-y-6">
        {/* Controls header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded ${
                filter === "all" ? "bg-navy text-white" : "bg-secondary text-foreground hover:bg-accent"
              }`}
            >
              All ({rows.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 ${
                filter === "unread" ? "bg-brand text-white" : "bg-secondary text-foreground hover:bg-accent"
              }`}
            >

              <span>New / Unread</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded ${
                filter === "read" ? "bg-navy text-white" : "bg-secondary text-foreground hover:bg-accent"
              }`}
            >
              Read ({rows.length - unreadCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search inquiries..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-border bg-background outline-none focus:border-navy"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-background border border-border overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-secondary text-xs font-bold uppercase tracking-wider text-navy border-b border-border">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Sender Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Subject / Company</th>
                <th className="p-3">Received Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-border hover:bg-muted/40 transition-colors ${
                    !r.is_read ? "bg-blue-50/40 font-medium" : ""
                  }`}
                >
                  <td className="p-3">
                    {!r.is_read ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-brand text-brand-foreground px-2 py-0.5 rounded-full">
                        New
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full">
                        Read
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-navy">{r.name}</td>
                  <td className="p-3 text-muted-foreground">{r.email}</td>
                  <td className="p-3">
                    <div className="truncate max-w-xs">{r.subject || "No Subject"}</div>
                    {r.company && <div className="text-xs text-muted-foreground">{r.company}</div>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedInquiry(r)}
                        className="p-1.5 text-navy hover:bg-navy hover:text-white rounded transition-colors"
                        title="View Full Message"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => toggleReadStatus(r, !r.is_read)}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                        title={r.is_read ? "Mark as Unread" : "Mark as Read"}
                      >
                        {r.is_read ? <Mail size={16} /> : <MailOpen size={16} />}
                      </button>
                      <button
                        onClick={() => deleteInquiry(r.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete Inquiry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {loading ? "Loading contact inquiries..." : "No contact inquiries found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedInquiry && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-2xl bg-background border border-border p-6 shadow-2xl rounded-lg space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-navy">
                    {selectedInquiry.subject || "Contact Inquiry"}
                  </h2>
                  {!selectedInquiry.is_read && (
                    <span className="text-[10px] bg-brand text-brand-foreground px-2 py-0.5 font-bold uppercase rounded-full">
                      New
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <Clock size={14} />
                  <span>
                    Submitted on{" "}
                    {new Date(selectedInquiry.created_at).toLocaleString("en-US", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold px-2"
              >
                ✕
              </button>
            </div>

            {/* Sender Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-secondary/50 p-4 border border-border rounded">
              <div>
                <span className="font-bold text-navy uppercase tracking-wider block">Sender Name</span>
                <span className="text-sm font-medium">{selectedInquiry.name}</span>
              </div>
              <div>
                <span className="font-bold text-navy uppercase tracking-wider block">Email Address</span>
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {selectedInquiry.email}
                </a>
              </div>
              {selectedInquiry.company && (
                <div>
                  <span className="font-bold text-navy uppercase tracking-wider block">Company</span>
                  <span className="text-sm font-medium">{selectedInquiry.company}</span>
                </div>
              )}
            </div>

            {/* Full Message */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Full Message Content</span>
              <div className="p-4 bg-card border border-border rounded text-sm leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <button
                onClick={() => toggleReadStatus(selectedInquiry, !selectedInquiry.is_read)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-border text-xs font-bold uppercase tracking-wider hover:bg-accent rounded"
              >
                {selectedInquiry.is_read ? (
                  <>
                    <Mail size={14} /> Mark as Unread
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} className="text-brand" /> Mark as Read
                  </>
                )}
              </button>
              <div className="flex gap-2">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(
                    selectedInquiry.subject || "CIO Media World Inquiry"
                  )}`}
                  className="bg-brand text-brand-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider rounded inline-flex items-center gap-1"
                >
                  Reply via Email
                </a>
                <button
                  onClick={() => deleteInquiry(selectedInquiry.id)}
                  className="bg-red-600 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminGate>
  );
}
