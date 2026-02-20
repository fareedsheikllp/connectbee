"use client";

import { useState, useEffect } from "react";
import {
  Search, Users, Trash2, Pencil, X,
  UsersRound, ChevronDown, ChevronUp, Check, UserPlus,
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

// ── Contact Form ───────────────────────────────────────────────────────────
function ContactForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    phone: initial.phone || "",
    email: initial.email || "",
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
      <Field label="Phone Number *" hint="Include country code — e.g. +16471234567">
        <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="+16471234567" />
      </Field>
      <Field label="Email">
        <input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" />
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
  const [selected, setSelected] = useState(
    initial.members ? initial.members.map((m) => m.contactId || m.contact?.id) : []
  );
  const [search, setSearch] = useState("");

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
    onSubmit({ name, description, contactIds: selected });
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <Field label="Group Name *">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP Customers" />
      </Field>
      <Field label="Description">
        <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this group for?" />
      </Field>
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
              <span className="text-xs text-ink-400">{m.contact?.phone}</span>
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
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                    <th className="w-24 px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0">
                            {c.name[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-ink-800">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">{c.phone}</td>
                      <td className="px-5 py-3.5 text-ink-500 hidden md:table-cell">{c.email || "—"}</td>
                      <td className="px-5 py-3.5 text-ink-400 text-xs hidden lg:table-cell">
                        <span className="block max-w-[160px] truncate">{c.notes || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
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
    </div>
  );
}
