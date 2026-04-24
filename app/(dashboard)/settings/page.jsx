"use client";
import { useState, useEffect } from "react";
import {
  MessageSquare, Check, AlertCircle, Loader2, Save,
  Eye, EyeOff, ExternalLink, CheckCircle2, Circle,
  User, Bell, Shield, Zap, ChevronRight, Users, Plus,
  Trash2, X
} from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

const SETUP_STEPS = [
  { n: 1, label: "Create a Meta Developer account",     link: "https://developers.facebook.com", done: false },
  { n: 2, label: "Create a Meta App (type: Business)",  link: "https://developers.facebook.com/apps", done: false },
  { n: 3, label: "Add WhatsApp product to your app",    link: null, done: false },
  { n: 4, label: "Get your Phone Number ID & Token",    link: null, done: false },
  { n: 5, label: "Paste credentials below & save",      link: null, done: false },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
    webhookVerifyToken: "",
  });
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [team, setTeam] = useState({ members: [], channels: [] });
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", password: "", role: "AGENT" });
  const [newChannel, setNewChannel] = useState({ name: "", description: "", color: "#6366f1" });
  const [savingMember, setSavingMember] = useState(false);
  const [savingChannel, setSavingChannel] = useState(false);
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState({
    supervisor: { inbox: true, contacts: true, broadcasts: true, templates: true, analytics: true, integrations: false },
    agent:      { inbox: true, contacts: false, broadcasts: false, templates: false, analytics: false, integrations: false },
  });
  const [savingPermissions, setSavingPermissions] = useState(false);

  // TABS defined inside component so session is available
  const isAgent = session?.user?.role === "agent";
  const TABS = [
    { id: "profile",       label: "Profile",       icon: User    },
    { id: "notifications", label: "Notifications", icon: Bell    },
    { id: "security",      label: "Security",      icon: Shield  },
    ...(!isAgent ? [{ id: "team", label: "Team", icon: Users }] : []),
    ...(session?.user?.role === "owner" ? [{ id: "permissions", label: "Permissions", icon: Shield }] : []),
  ];

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { if (tab === "team") fetchTeam(); }, [tab]);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.whatsapp) {
        setForm({
          phoneNumberId:      data.whatsapp.phoneNumberId || "",
          accessToken:        data.whatsapp.accessToken || "",
          businessAccountId:  data.whatsapp.businessAccountId || "",
          webhookVerifyToken: data.whatsapp.webhookVerifyToken || "",
        });
        setConnected(data.whatsapp.verified || false);
      }
      if (data.profile) setProfile({ name: data.profile.name || "", email: data.profile.email || "" });
      const permRes = await fetch("/api/settings/permissions");
      const permData = await permRes.json();
      if (permData.permissions) setPermissions(permData.permissions);
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  }

  async function saveWhatsApp(e) {
    e.preventDefault();
    if (!form.phoneNumberId || !form.accessToken) {
      return toast.error("Phone Number ID and Access Token are required");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to save"); return; }
      toast.success("WhatsApp credentials saved!");
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  }

  async function testConnection() {
    if (!form.phoneNumberId || !form.accessToken) {
      return toast.error("Enter credentials first");
    }
    setTesting(true);
    try {
      const res = await fetch("/api/settings/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId: form.phoneNumberId, accessToken: form.accessToken }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Connected! Phone: ${data.phone || "verified"}`);
        setConnected(true);
      } else {
        toast.error(data.error || "Connection failed — check your credentials");
        setConnected(false);
      }
    } catch { toast.error("Test failed"); }
    finally { setTesting(false); }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) { toast.error("Failed to save"); return; }
      toast.success("Profile updated!");
    } catch { toast.error("Something went wrong"); }
    finally { setSavingProfile(false); }
  }

  async function fetchTeam() {
    setLoadingTeam(true);
    try {
      const [membersRes, channelsRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/channels"),
      ]);
      const membersData = await membersRes.json();
      const channelsData = await channelsRes.json();

      let channels = channelsData.channels || [];

      // Supervisors only see channels they belong to
      if (session?.user?.role === "supervisor") {
        channels = channels.filter(ch =>
          ch.members?.some(cm => cm.member?.id === session.user.id || cm.memberId === session.user.id)
        );
      }

      setTeam({
        members: membersData.members || [],
        channels,
      });
    } catch { toast.error("Failed to load team"); }
    finally { setLoadingTeam(false); }
  }

  async function createMember(e) {
    e.preventDefault();
    if (!newMember.name || !newMember.email || !newMember.password) {
      return toast.error("All fields required");
    }
    setSavingMember(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      toast.success("Member added!");
      setNewMember({ name: "", email: "", password: "", role: "AGENT" });
      setShowAddMember(false);
      fetchTeam();
    } catch { toast.error("Something went wrong"); }
    finally { setSavingMember(false); }
  }

  async function toggleMember(id, currentlyActive) {
    try {
      if (currentlyActive) {
        await fetch(`/api/members/${id}`, { method: "DELETE" });
        toast.success("Member deactivated");
      } else {
        await fetch(`/api/members/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
        toast.success("Member reactivated");
      }
      fetchTeam();
    } catch { toast.error("Failed"); }
  }

  async function createChannel(e) {
    e.preventDefault();
    if (!newChannel.name) return toast.error("Channel name required");
    setSavingChannel(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChannel),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      toast.success("Channel created!");
      setNewChannel({ name: "", description: "", color: "#6366f1" });
      setShowAddChannel(false);
      fetchTeam();
    } catch { toast.error("Something went wrong"); }
    finally { setSavingChannel(false); }
  }

  async function deleteChannel(id) {
    if (!confirm("Delete this channel? Conversations will be unassigned.")) return;
    try {
      await fetch(`/api/channels/${id}`, { method: "DELETE" });
      toast.success("Channel deleted");
      fetchTeam();
    } catch { toast.error("Failed"); }
  }

  async function assignMemberToChannel(channelId, memberId) {
    try {
      await fetch(`/api/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addMemberId: memberId }),
      });
      fetchTeam();
    } catch { toast.error("Failed"); }
  }

  async function removeMemberFromChannel(channelId, memberId) {
    try {
      await fetch(`/api/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeMemberId: memberId }),
      });
      fetchTeam();
    } catch { toast.error("Failed"); }
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-black text-ink-900">Settings</h1>
        <p className="text-ink-400 text-sm mt-1">Manage your account and integrations</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-brand-50 text-brand-700 font-semibold" : "text-ink-500 hover:bg-surface-100 hover:text-ink-800"}`}
            >
              <Icon size={16} />
              {label}
              {tab === id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Profile Tab */}
          {tab === "profile" && (
            <div className="card p-6">
              <h3 className="font-bold text-ink-800 mb-5">Profile Information</h3>
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="field-label">Full Name</label>
                  <input
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="field-input"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="field-label">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="field-input"
                    placeholder="you@company.com"
                    disabled
                  />
                  <p className="field-hint">Email cannot be changed</p>
                </div>
                <button type="submit" disabled={savingProfile} className="btn-primary gap-2">
                  {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save Profile
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {tab === "notifications" && (
            <div className="card p-6">
              <h3 className="font-bold text-ink-800 mb-5">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: "New incoming message",    desc: "Get notified when a contact sends you a message" },
                  { label: "Campaign delivered",     desc: "Notify when your campaign is fully delivered"   },
                  { label: "New contact added",       desc: "Alert when a new contact is added"               },
                  { label: "Weekly summary",          desc: "Get a weekly report of your activity"            },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{label}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-surface-200 peer-checked:bg-brand-500 rounded-full transition-all peer-checked:after:translate-x-5 after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow after:transition-all" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {tab === "security" && (
            <div className="space-y-5">
              <div className="card p-6">
                <h3 className="font-bold text-ink-800 mb-5">Change Password</h3>
                <form className="space-y-4">
                  <div>
                    <label className="field-label">Current Password</label>
                    <input type="password" className="field-input" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="field-label">New Password</label>
                    <input type="password" className="field-input" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="field-label">Confirm New Password</label>
                    <input type="password" className="field-input" placeholder="••••••••" />
                  </div>
                  <button type="submit" className="btn-primary gap-2">
                    <Shield size={15} /> Update Password
                  </button>
                </form>
              </div>
              <div className="card p-6 border-red-100">
                <h3 className="font-bold text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-ink-500 mb-4">Permanently delete your account and all data. This cannot be undone.</p>
                <button className="btn-danger btn-sm">Delete Account</button>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {tab === "team" && (
            <div className="space-y-6">

              {/* Channels Section */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-ink-800">Channels</h3>
                    <p className="text-xs text-ink-400 mt-0.5">Departments like Sales, Support, Billing</p>
                  </div>
                  {session?.user?.role !== "supervisor" && (
                    <button onClick={() => setShowAddChannel(p => !p)} className="btn-primary btn-sm gap-1.5">
                      <Plus size={14} /> New Channel
                    </button>
                  )}
                </div>

                {/* Add Channel Form */}
                {showAddChannel && (
                  <form onSubmit={createChannel} className="mb-5 p-4 bg-surface-50 rounded-xl border border-surface-200 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-ink-700">New Channel</p>
                      <button type="button" onClick={() => setShowAddChannel(false)}><X size={15} className="text-ink-400" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="field-label">Name <span className="text-red-400">*</span></label>
                        <input value={newChannel.name} onChange={e => setNewChannel(p => ({ ...p, name: e.target.value }))} className="field-input" placeholder="e.g. Sales" />
                      </div>
                      <div>
                        <label className="field-label">Color</label>
                        <input type="color" value={newChannel.color} onChange={e => setNewChannel(p => ({ ...p, color: e.target.value }))} className="h-10 w-full rounded-xl border border-surface-200 cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Description</label>
                      <input value={newChannel.description} onChange={e => setNewChannel(p => ({ ...p, description: e.target.value }))} className="field-input" placeholder="Optional description" />
                    </div>
                    <button type="submit" disabled={savingChannel} className="btn-primary btn-sm gap-2">
                      {savingChannel ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create Channel
                    </button>
                  </form>
                )}

                {loadingTeam ? (
                  <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-brand-500" /></div>
                ) : team.channels.length === 0 ? (
                  <p className="text-sm text-ink-400 text-center py-6">No channels yet — create one above</p>
                ) : (
                  <div className="space-y-3">
                    {team.channels.map(channel => (
                      <div key={channel.id} className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: channel.color }} />
                            <div>
                              <p className="text-sm font-semibold text-ink-800">{channel.name}</p>
                              {channel.description && <p className="text-xs text-ink-400">{channel.description}</p>}
                            </div>
                            <span className="text-xs text-ink-400 bg-surface-100 px-2 py-0.5 rounded-full">
                              {channel._count?.conversations || 0} convos
                            </span>
                          </div>
                          {session?.user?.role !== "supervisor" && (
                            <button onClick={() => deleteChannel(channel.id)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Members in this channel */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {channel.members.map(({ member }) => (
                            <div key={member.id} className="flex items-center gap-1 bg-white border border-surface-200 rounded-full px-2.5 py-1 text-xs">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-[9px] font-bold">
                                {member.name[0].toUpperCase()}
                              </div>
                              <span className="text-ink-700">{member.name}</span>
                              {session?.user?.role !== "supervisor" && (
                                <button onClick={() => removeMemberFromChannel(channel.id, member.id)} className="text-ink-300 hover:text-red-400 ml-0.5">
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add member to channel */}
                        {session?.user?.role !== "supervisor" && (
                          <select
                            onChange={e => { if (e.target.value) { assignMemberToChannel(channel.id, e.target.value); e.target.value = ""; }}}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-ink-500 bg-white"
                            defaultValue=""
                          >
                            <option value="" disabled>+ Add member</option>
                            {team.members
                              .filter(m => !channel.members.some(cm => cm.member.id === m.id))
                              .map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                              ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Members Section */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-ink-800">Team Members</h3>
                    <p className="text-xs text-ink-400 mt-0.5">Agents and supervisors who can log in</p>
                  </div>
                  {session?.user?.role !== "supervisor" && (
                    <button onClick={() => setShowAddMember(p => !p)} className="btn-primary btn-sm gap-1.5">
                      <Plus size={14} /> Add Member
                    </button>
                  )}
                </div>

                {/* Add Member Form */}
                {showAddMember && (
                  <form onSubmit={createMember} className="mb-5 p-4 bg-surface-50 rounded-xl border border-surface-200 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-ink-700">New Member</p>
                      <button type="button" onClick={() => setShowAddMember(false)}><X size={15} className="text-ink-400" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="field-label">Full Name <span className="text-red-400">*</span></label>
                        <input value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} className="field-input" placeholder="Sara Ahmed" />
                      </div>
                      <div>
                        <label className="field-label">Email <span className="text-red-400">*</span></label>
                        <input type="email" value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} className="field-input" placeholder="sara@company.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="field-label">Password <span className="text-red-400">*</span></label>
                        <input type="password" value={newMember.password} onChange={e => setNewMember(p => ({ ...p, password: e.target.value }))} className="field-input" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="field-label">Role</label>
                        <select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))} className="field-input">
                          <option value="AGENT">Agent</option>
                          <option value="SUPERVISOR">Supervisor</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" disabled={savingMember} className="btn-primary btn-sm gap-2">
                      {savingMember ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add Member
                    </button>
                  </form>
                )}

                {loadingTeam ? (
                  <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-brand-500" /></div>
                ) : team.members.length === 0 ? (
                  <p className="text-sm text-ink-400 text-center py-6">No team members yet — add one above</p>
                ) : (
                  <div className="space-y-2">
                    {team.members.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-200 bg-surface-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
                            {member.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink-800">{member.name}</p>
                            <p className="text-xs text-ink-400">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${member.role === "SUPERVISOR" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                            {member.role}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${member.isActive ? "bg-brand-50 text-brand-600" : "bg-surface-100 text-ink-400"}`}>
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                          {session?.user?.role !== "supervisor" && (
                            <button
                              onClick={() => toggleMember(member.id, member.isActive)}
                              className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-all ${
                                member.isActive
                                  ? "text-red-500 border-red-100 hover:bg-red-50"
                                  : "text-green-600 border-green-100 hover:bg-green-50"
                              }`}
                            >
                              {member.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
          {tab === "permissions" && (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-bold text-ink-800">Role Permissions</h3>
                <p className="text-xs text-ink-400 mt-0.5">Control which pages each role can access. This does not change what they can do inside a page.</p>
              </div>
              {["supervisor", "agent"].map(role => (
                <div key={role} className="space-y-3">
                  <p className="text-sm font-bold text-ink-700 capitalize">{role}</p>
                  <div className="rounded-xl border border-surface-200 overflow-hidden">
                    {["inbox", "contacts", "Campaigns", "templates", "chatbot","catalog", "analytics", "integrations"].map((page, i, arr) => (
                      <div key={page} className={`flex items-center justify-between px-4 py-3 ${i !== arr.length - 1 ? "border-b border-surface-100" : ""}`}>
                        <p className="text-sm text-ink-700 capitalize">{page}</p>
                        <label className="relative inline-flex cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions[role]?.[page] ?? false}
                            onChange={e => setPermissions(prev => ({
                              ...prev,
                              [role]: { ...prev[role], [page]: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-surface-200 peer-checked:bg-brand-500 rounded-full transition-all peer-checked:after:translate-x-5 after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow after:transition-all" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={async () => {
                  setSavingPermissions(true);
                  try {
                    const res = await fetch("/api/settings/permissions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ permissions }),
                    });
                    if (!res.ok) { toast.error("Failed to save"); return; }
                    toast.success("Permissions saved!");
                    localStorage.removeItem("cb_permissions");
                    window.dispatchEvent(new Event("permissions-updated"));

                  } catch { toast.error("Something went wrong"); }
                  finally { setSavingPermissions(false); }
                }}
                disabled={savingPermissions}
                className="btn-primary gap-2"
              >
                {savingPermissions ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Permissions
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}