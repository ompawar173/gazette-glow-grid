import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { Download, Search, Trash2, Mail, Users, RefreshCw, Plus, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/subscribers")({
  ssr: false,
  component: SubscribersAdmin,
});

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

function SubscribersAdmin() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      console.error("Failed to load subscribers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) =>
      sub.email.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [subscribers, searchTerm]);

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToAdd = newEmail.trim().toLowerCase();
    if (!emailToAdd || !emailToAdd.includes("@")) {
      setAddMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setAddLoading(true);
    setAddMessage(null);

    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .insert([{ email: emailToAdd }])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("This email is already subscribed.");
        }
        throw error;
      }

      setSubscribers((prev) => [data, ...prev]);
      setNewEmail("");
      setAddMessage({ type: "success", text: `Added ${emailToAdd} to Executive Brief list.` });
    } catch (err: any) {
      setAddMessage({ type: "error", text: err.message || "Failed to add subscriber." });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove "${email}" from the subscriber list?`)) return;

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubscribers((prev) => prev.filter((sub) => sub.id !== id));
    } catch (err: any) {
      alert("Failed to delete subscriber: " + (err.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const exportCSV = () => {
    if (!subscribers.length) return;
    const csvContent =
      "ID,Email,Subscribed At\n" +
      filteredSubscribers
        .map((s) => `"${s.id}","${s.email}","${s.subscribed_at}"`)
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `executive_brief_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminGate title="Newsletter & Executive Brief Subscribers">
      <div className="space-y-6">
        {/* Header Stats & Quick Add */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#071A2F] text-white p-5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#16A9E8]/10 text-[#16A9E8] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Active Subscribers</div>
              <div className="text-2xl font-bold font-mono text-white">{subscribers.length}</div>
            </div>
          </div>

          {/* Quick Add Subscriber Form */}
          <div className="md:col-span-2 bg-white p-4 rounded-xl border border-border shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Add Subscriber Manually</h3>
            <form onSubmit={handleAddSubscriber} className="flex gap-2">
              <input
                type="email"
                placeholder="subscriber@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1267C7]"
              />
              <button
                type="submit"
                disabled={addLoading}
                className="px-4 py-2 bg-[#071A2F] hover:bg-[#1267C7] text-white font-medium text-sm rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4 text-[#16A9E8]" /> Add
              </button>
            </form>
            {addMessage && (
              <div
                className={`mt-2 text-xs flex items-center gap-1 ${
                  addMessage.type === "success" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {addMessage.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {addMessage.text}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1267C7]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchSubscribers}
              className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={exportCSV}
              disabled={!subscribers.length}
              className="px-4 py-2 bg-[#071A2F] hover:bg-[#1267C7] text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#16A9E8]" /> Export CSV ({filteredSubscribers.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-border text-xs uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">Subscriber Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Subscribed Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      Loading subscribers list...
                    </td>
                  </tr>
                ) : filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      {searchTerm ? "No subscribers match your search." : "No newsletter subscribers found."}
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#1267C7]" />
                        {sub.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(sub.subscribed_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                          disabled={deletingId === sub.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Remove subscriber"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminGate>
  );
}
