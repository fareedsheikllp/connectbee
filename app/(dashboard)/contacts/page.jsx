"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, Users, Trash2, Pencil, X,
  UsersRound, ChevronDown, ChevronUp, Check, UserPlus, Upload, Download, AlertCircle, CheckCircle2, Bell, BellOff,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-large w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="font-semibold text-ink-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-surface-100 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-ink-800 placeholder-ink-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all bg-white";

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-ink-600">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-300 mt-1">{hint}</p>}
    </div>
  );
}
// ── CSV Import Modal ───────────────────────────────────────────────────────
function CSVImportModal({ groups = [], onClose, onImportDone }) {
  const [step, setStep] = useState("upload"); // "upload" | "preview" | "group" | "importing" | "done"
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [groupAction, setGroupAction] = useState("none"); // "none" | "new" | "existing"
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const TEMPLATE_HEADERS = ["name", "phone", "email", "company", "notes"];

  const downloadTemplate = () => {
    const csv = [
      TEMPLATE_HEADERS.join(","),
      "Jane Smith,16471234567,jane@example.com,Acme Corp,VIP customer",
      "John Doe,14165550123,john@example.com,,",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row."] };

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const nameIdx = headers.indexOf("name");
    const phoneIdx = headers.indexOf("phone");
    const emailIdx = headers.indexOf("email");
    const companyIdx = headers.indexOf("company");
    const notesIdx = headers.indexOf("notes");

    if (nameIdx === -1 || phoneIdx === -1) {
      return { rows: [], errors: ["CSV must have 'name' and 'phone' columns."] };
    }

    const parsed = [];
    const errs = [];

    lines.slice(1).forEach((line, i) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const name = cols[nameIdx] || "";
      const phone = cols[phoneIdx] || "";
      if (!name || !phone) {
        errs.push(`Row ${i + 2}: missing name or phone — skipped`);
        return;
      }
      parsed.push({
        name,
        phone,
        email: emailIdx !== -1 ? cols[emailIdx] || "" : "",
        company: companyIdx !== -1 ? cols[companyIdx] || "" : "",
        notes: notesIdx !== -1 ? cols[notesIdx] || "" : "",
      });
    });

    return { rows: parsed, errors: errs };
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows: parsed, errors: errs } = parseCSV(ev.target.result);
      setRows(parsed);
      setErrors(errs);
      if (parsed.length > 0) setStep("preview");
      else toast.error(errs[0] || "No valid rows found");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setStep("importing");
    let created = 0, skipped = 0, failed = 0;

    for (const row of rows) {
      try {
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        if (res.ok) created++;
        else if (res.status === 409) skipped++;
        else failed++;
      } catch { failed++; }
    }

    // Handle group assignment
    if (groupAction !== "none" && created > 0) {
      try {
        // Fetch all contacts to find the ones we just created
        const allRes = await fetch("/api/contacts");
        const allContacts = await allRes.json();
        const phones = new Set(rows.map((r) => r.phone));
        const newContactIds = allContacts
          .filter((c) => phones.has(c.phone))
          .map((c) => c.id);

        if (groupAction === "new" && newGroupName.trim()) {
          await fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newGroupName.trim(), description: "", contactIds: newContactIds }),
          });
        } else if (groupAction === "existing" && selectedGroupId) {
          const grpRes = await fetch(`/api/groups/${selectedGroupId}`);
          const grp = await grpRes.json();
          const existingIds = (grp.members || []).map((m) => m.contactId || m.contact?.id);
          const mergedIds = [...new Set([...existingIds, ...newContactIds])];
          await fetch(`/api/groups/${selectedGroupId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactIds: mergedIds }),
          });
        }
      } catch (e) {
        console.error("Group assignment failed:", e);
      }
    }

    setResult({ created, skipped, failed });
    setImporting(false);
    setStep("done");
    onImportDone();
  };

  return (
    <Modal title="Import Contacts from CSV" onClose={onClose}>
      {/* STEP: Upload */}
      {step === "upload" && (
        <div className="space-y-5">
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
            <p className="text-xs text-brand-700 leading-relaxed">
              Your CSV must have <strong>name</strong> and <strong>phone</strong> columns. Optional: email, company, notes.
            </p>
          </div>
          <button onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-surface-200 text-sm font-medium text-ink-600 hover:border-brand-300 hover:text-brand-600 transition-colors">
            <Download size={14} />
            Download Template CSV
          </button>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-surface-200 rounded-xl py-10 flex flex-col items-center gap-3 cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-all">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
              <Upload size={20} className="text-ink-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink-700">Click to upload your CSV</p>
              <p className="text-xs text-ink-400 mt-0.5">or drag and drop</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        </div>
      )}

      {/* STEP: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
            <span><strong>{rows.length}</strong> contacts ready to import</span>
          </div>
          {errors.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-1">
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />{e}
                </p>
              ))}
            </div>
          )}
          {/* Preview table */}
          <div className="border border-surface-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  {["Name", "Phone", "Email", "Company"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-ink-400 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="hover:bg-surface-50">
                    <td className="px-3 py-2 text-ink-800 font-medium truncate max-w-[80px]">{r.name}</td>
                    <td className="px-3 py-2 text-ink-600">{r.phone}</td>
                    <td className="px-3 py-2 text-ink-500 truncate max-w-[80px]">{r.email || "—"}</td>
                    <td className="px-3 py-2 text-ink-500 truncate max-w-[80px]">{r.company || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="text-center text-xs text-ink-400 py-2">...and {rows.length - 20} more</p>
            )}
          </div>

          {/* Group assignment */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-ink-600">Add imported contacts to a group? (optional)</p>
            <div className="space-y-2">
              {[
                { value: "none", label: "No group" },
                { value: "new", label: "Create a new group" },
                { value: "existing", label: "Add to existing group" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${groupAction === opt.value ? "border-brand-500 bg-brand-500" : "border-surface-300"}`}>
                    {groupAction === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-ink-700" onClick={() => setGroupAction(opt.value)}>{opt.label}</span>
                </label>
              ))}
            </div>

            {groupAction === "new" && (
              <input
                className={inputCls}
                placeholder="Group name e.g. Imported March 2025"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            )}
            {groupAction === "existing" && (
              <select
                className={inputCls}
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">Select a group...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("upload")}
              className="flex-1 py-2.5 rounded-xl border border-surface-200 text-sm font-medium text-ink-600 hover:bg-surface-50 transition-colors">
              Back
            </button>
            <button onClick={handleImport}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
              Import {rows.length} Contacts
            </button>
          </div>
        </div>
      )}

      {/* STEP: Importing */}
      {step === "importing" && (
        <div className="py-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center animate-pulse">
            <Upload size={20} className="text-brand-500" />
          </div>
          <p className="text-sm font-medium text-ink-700">Importing contacts...</p>
          <p className="text-xs text-ink-400">Please don't close this window</p>
        </div>
      )}

      {/* STEP: Done */}
      {step === "done" && result && (
        <div className="space-y-5">
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-green-500" />
            </div>
            <p className="text-sm font-semibold text-ink-800">Import complete!</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-green-50 border border-green-100 py-3 text-center">
              <p className="text-2xl font-bold text-green-600">{result.created}</p>
              <p className="text-[11px] text-green-700 font-medium mt-0.5">Added</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 py-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">Skipped</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 py-3 text-center">
              <p className="text-2xl font-bold text-red-500">{result.failed}</p>
              <p className="text-[11px] text-red-600 font-medium mt-0.5">Failed</p>
            </div>
          </div>
          {result.skipped > 0 && (
            <p className="text-xs text-ink-400 text-center">Skipped = phone number already exists</p>
          )}
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
// ── Contact Form ───────────────────────────────────────────────────────────
function ContactForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    phone: initial.phone || "",
    email: initial.email || "",
    company: initial.company || "",
    notes: initial.notes || "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const handle = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error("Name and phone are required");
    onSubmit(form);
  };
  return (
    <form onSubmit={handle} className="space-y-4">
      <Field label="Full Name *">
        <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Jane Smith" />
      </Field>
      <Field label="Phone Number *" hint="Include country code without (+) — e.g. 16471234567">
        <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="16471234567" />
      </Field>
      <Field label="Email">
        <input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" />
      </Field>
      <Field label="Company">
        <input className={inputCls} value={form.company} onChange={set("company")} placeholder="Company Name" />
      </Field>
      <Field label="Notes">
        <textarea className={`${inputCls} resize-none`} rows={3} value={form.notes} onChange={set("notes")} placeholder="Any notes about this contact..." />
      </Field>
      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 shadow-brand-sm">
        {loading ? "Saving..." : initial.id ? "Save Changes" : "Add Contact"}
      </button>
    </form>
  );
}

// ── Group Form ─────────────────────────────────────────────────────────────
function GroupForm({ initial = {}, contacts = [], onSubmit, loading }) {
  const [name, setName] = useState(initial.name || "");
  const [description, setDescription] = useState(initial.description || "");
  const [channelId, setChannelId] = useState(initial.channelId || "");
  const [channels, setChannels] = useState([]);
  const [selected, setSelected] = useState(
    initial.members ? initial.members.map((m) => m.contactId || m.contact?.id) : []
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/channels").then(r => r.json()).then(d => setChannels(d.channels || [])).catch(() => {});
  }, []);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const visible = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handle = (e) => {
    e.preventDefault();
    if (!name) return toast.error("Group name is required");
    if (!selected.length) return toast.error("Select at least one contact");
    onSubmit({ name, description, contactIds: selected, channelId: channelId || null });
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <Field label="Group Name *">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP Customers" />
      </Field>
      <Field label="Description">
        <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this group for?" />
      </Field>
      {channels.length > 0 && (
        <Field label="Assign to Channel" hint="Supervisors of this channel will see conversations from this group">
          <select className={inputCls} value={channelId} onChange={(e) => setChannelId(e.target.value)}>
            <option value="">No channel</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </select>
        </Field>
      )}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-ink-600">
          Members <span className="font-normal text-ink-400">({selected.length} selected)</span>
        </label>
        <div className="relative mb-2">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
          <input className={`${inputCls} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." />
        </div>
        <div className="border border-surface-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto divide-y divide-surface-100">
          {contacts.length === 0 ? (
            <p className="text-xs text-ink-400 text-center py-8">No contacts yet — add some first</p>
          ) : visible.length === 0 ? (
            <p className="text-xs text-ink-400 text-center py-8">No contacts match</p>
          ) : (
            visible.map((c) => {
              const on = selected.includes(c.id);
              return (
                <div key={c.id} onClick={() => toggle(c.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${on ? "bg-brand-50" : "hover:bg-surface-50"}`}>
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${on ? "bg-brand-500 border-brand-500" : "border-surface-300"}`}>
                    {on && <Check size={9} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 truncate">{c.name}</p>
                    <p className="text-xs text-ink-400">{c.phone}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Note:</strong> Messages are sent individually — no group chat is created and members won't see each other.
        </p>
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 shadow-brand-sm">
        {loading ? "Saving..." : initial.id ? "Save Changes" : "Create Group"}
      </button>
    </form>
  );
}

// ── Group Card ─────────────────────────────────────────────────────────────
function GroupCard({ group, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const members = group.members || [];
  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <UsersRound size={18} className="text-brand-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-ink-800 truncate">{group.name}</p>
              {group.description && <p className="text-xs text-ink-400 truncate mt-0.5">{group.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(group)} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(group)} className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
          {members.length > 0 && (
            <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600 transition-colors">
              {open ? "Hide" : "Show"} members
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>
      {open && members.length > 0 && (
        <div className="border-t border-surface-100 px-5 py-3 space-y-2.5">
          {members.map((m) => (
            <div key={m.id || m.contactId} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-[11px] font-bold text-brand-600 flex-shrink-0">
                {(m.contact?.name || "?")[0].toUpperCase()}
              </div>
              <span className="text-sm text-ink-700 flex-1 truncate">{m.contact?.name}</span>
              <div className="flex items-center gap-4">
                {m.contact?.subscribed === false && (
                  <span className="text-[10px] font-semibold bg-red-100 text-red-500 px-2 py-0.5 rounded-full">
                    Unsubscribed
                  </span>
                )}
                <span className="text-xs text-ink-400">{m.contact?.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────
function DeleteConfirm({ name, onCancel, onConfirm }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-600 leading-relaxed">
        Are you sure you want to delete <strong className="text-ink-800">{name}</strong>? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-surface-200 text-sm font-medium text-ink-600 hover:bg-surface-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("contacts");
  const [modal, setModal] = useState(null);
  const close = () => setModal(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((c) => c.id));

  const bulkToggleSubscribed = async (subscribedValue) => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/contacts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscribed: subscribedValue }),
          })
        )
      );
      toast.success(`${selectedIds.length} contact${selectedIds.length > 1 ? "s" : ""} ${subscribedValue ? "resubscribed" : "unsubscribed"}`);
      setSelectedIds([]);
      fetchAll();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cr, gr] = await Promise.all([fetch("/api/contacts"), fetch("/api/groups")]);
      const [c, g] = await Promise.all([cr.json(), gr.json()]);
      setContacts(Array.isArray(c) ? c : []);
      setGroups(Array.isArray(g) ? g : []);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const addContact = async (form) => {
    setSaving(true);
    try {
      const res = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Contact added!"); close(); fetchAll();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const editContact = async (form) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${modal.data.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Contact updated!"); close(); fetchAll();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const deleteContact = async () => {
    try {
      const res = await fetch(`/api/contacts/${modal.data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Contact deleted"); close(); fetchAll();
    } catch (e) { toast.error(e.message); }
  };

  const addGroup = async (form) => {
    setSaving(true);
    try {
      const res = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Group created!"); close(); fetchAll();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const editGroup = async (form) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${modal.data.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Group updated!"); close(); fetchAll();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const deleteGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${modal.data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Group deleted"); close(); fetchAll();
    } catch (e) { toast.error(e.message); }
  };
  const toggleSubscribed = async (contact) => {
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribed: !contact.subscribed }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(contact.subscribed ? "Contact unsubscribed" : "Contact resubscribed");
      fetchAll();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 font-display">Contacts</h1>
          <p className="text-sm text-ink-400 mt-0.5">Manage your contacts and groups</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal({ type: "addGroup" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-200 text-ink-700 rounded-xl text-sm font-medium hover:border-brand-300 hover:text-brand-600 transition-colors"
          >
            <UsersRound size={15} />
            New Group
          </button>
          <button
            onClick={() => setModal({ type: "importCSV" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-200 text-ink-700 rounded-xl text-sm font-medium hover:border-brand-300 hover:text-brand-600 transition-colors"
          >
            <Upload size={15} />
            Import CSV
          </button>
          <button
            onClick={() => setModal({ type: "addContact" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-brand-sm"
          >
            <UserPlus size={15} />
            Add Contact
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-surface-200 px-5 py-4 shadow-soft">
          <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-1">Total Contacts</p>
          <p className="text-3xl font-bold text-ink-900">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 px-5 py-4 shadow-soft">
          <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-1">Groups</p>
          <p className="text-3xl font-bold text-ink-900">{groups.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {[
          { key: "contacts", label: `Contacts (${contacts.length})` },
          { key: "groups", label: `Groups (${groups.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "bg-white text-ink-800 shadow-soft" : "text-ink-500 hover:text-ink-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contacts Tab */}
      {tab === "contacts" && (
        <div className="space-y-4">
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-brand-700">
                {selectedIds.length} contact{selectedIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => bulkToggleSubscribed(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">
                  <Bell size={12} />
                  Resubscribe
                </button>
                <button
                  onClick={() => bulkToggleSubscribed(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors">
                  <BellOff size={12} />
                  Unsubscribe
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-100 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white text-sm text-ink-800 placeholder-ink-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-2xl bg-white border border-surface-200 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-surface-200 py-16 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
                <Users size={28} className="text-surface-300" />
              </div>
              <p className="font-medium text-ink-500">
                {contacts.length === 0 ? "No contacts yet" : "No contacts match your search"}
              </p>
              {contacts.length === 0 && (
                <button onClick={() => setModal({ type: "addContact" })}
                  className="mt-1 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
                  Add your first contact
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50">
                    <th className="px-5 py-3 w-10">
                      <div
                        onClick={toggleSelectAll}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                          filtered.length > 0 && selectedIds.length === filtered.length
                            ? "bg-brand-500 border-brand-500"
                            : "border-surface-300 hover:border-brand-400"
                        }`}>
                        {filtered.length > 0 && selectedIds.length === filtered.length && (
                          <Check size={9} className="text-white" strokeWidth={3} />
                        )}
                      </div>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider hidden md:table-cell">Company</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                    <th className="w-24 px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filtered.map((c) => (
                      <tr key={c.id} className={`hover:bg-surface-50 transition-colors group ${selectedIds.includes(c.id) ? "bg-brand-50" : ""}`}>
                        <td className="px-5 py-3.5 w-10">
                          <div
                            onClick={() => toggleSelect(c.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                              selectedIds.includes(c.id)
                                ? "bg-brand-500 border-brand-500"
                                : "border-surface-200 hover:border-brand-400"
                            }`}>
                            {selectedIds.includes(c.id) && (
                              <Check size={9} className="text-white" strokeWidth={3} />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0">
                            {c.name[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-ink-800">{c.name}</span>
                          {!c.subscribed && (
                            <span className="ml-2 text-[10px] font-semibold bg-red-100 text-red-500 px-2 py-0.5 rounded-full">
                              Unsubscribed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">{c.phone}</td>
                      <td className="px-5 py-3.5 text-ink-500 hidden md:table-cell">{c.email || "—"}</td>
                      <td className="px-5 py-3.5 text-ink-500 hidden md:table-cell">{c.company || "—"}</td>
                      <td className="px-5 py-3.5 text-ink-400 text-xs hidden lg:table-cell">
                        <span className="block max-w-[160px] truncate">{c.notes || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={() => toggleSubscribed(c)}
                          title={c.subscribed ? "Unsubscribe" : "Resubscribe"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.subscribed
                              ? "text-ink-400 hover:text-amber-500 hover:bg-amber-50"
                              : "text-red-400 hover:text-green-500 hover:bg-green-50"
                          }`}>
                          {c.subscribed ? <BellOff size={14} /> : <Bell size={14} />}
                        </button>
                        <button onClick={() => setModal({ type: "editContact", data: c })}
                          className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setModal({ type: "deleteContact", data: c })}
                          className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {tab === "groups" && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white border border-surface-200 animate-pulse" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-surface-200 py-16 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
                <UsersRound size={28} className="text-surface-300" />
              </div>
              <p className="font-medium text-ink-500">No groups yet</p>
              <p className="text-sm text-ink-400">Group contacts to broadcast to multiple people at once</p>
              <button onClick={() => setModal({ type: "addGroup" })}
                className="mt-1 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
                Create your first group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  onEdit={(data) => setModal({ type: "editGroup", data })}
                  onDelete={(data) => setModal({ type: "deleteGroup", data })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {modal?.type === "addContact" && (
        <Modal title="Add Contact" onClose={close}>
          <ContactForm onSubmit={addContact} loading={saving} />
        </Modal>
      )}
      {modal?.type === "editContact" && (
        <Modal title="Edit Contact" onClose={close}>
          <ContactForm initial={modal.data} onSubmit={editContact} loading={saving} />
        </Modal>
      )}
      {modal?.type === "deleteContact" && (
        <Modal title="Delete Contact" onClose={close}>
          <DeleteConfirm name={modal.data.name} onCancel={close} onConfirm={deleteContact} />
        </Modal>
      )}
      {modal?.type === "addGroup" && (
        <Modal title="Create Group" onClose={close}>
          <GroupForm contacts={contacts} onSubmit={addGroup} loading={saving} />
        </Modal>
      )}
      {modal?.type === "editGroup" && (
        <Modal title="Edit Group" onClose={close}>
          <GroupForm initial={modal.data} contacts={contacts} onSubmit={editGroup} loading={saving} />
        </Modal>
      )}
      {modal?.type === "deleteGroup" && (
        <Modal title="Delete Group" onClose={close}>
          <DeleteConfirm name={modal.data.name} onCancel={close} onConfirm={deleteGroup} />
        </Modal>
      )}
      {modal?.type === "importCSV" && (
        <CSVImportModal
          groups={groups}
          onClose={close}
          onImportDone={() => { close(); fetchAll(); }}
        />
      )}
    </div>
  );
}
