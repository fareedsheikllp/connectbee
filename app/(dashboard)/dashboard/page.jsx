import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TrendingUp, Users, MessageSquare, Megaphone, ArrowUpRight, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

async function getDashboardData(userId) {
  const workspace = await db.workspace.findUnique({ where: { userId } });
  if (!workspace) return { contacts: 0, conversations: 0, broadcasts: 0, sentBroadcasts: 0, recentConversations: [] };

  const [contacts, conversations, broadcasts, sentBroadcasts, recentConversations] = await Promise.all([
    db.contact.count({ where: { workspaceId: workspace.id } }),
    db.conversation.count({ where: { workspaceId: workspace.id } }),
    db.broadcast.count({ where: { workspaceId: workspace.id } }),
    db.broadcast.count({ where: { workspaceId: workspace.id, status: "SENT" } }),
    db.conversation.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { contact: true },
    }),
  ]);

  return { contacts, conversations, broadcasts, sentBroadcasts, recentConversations, workspace };
}

const QUICK_ACTIONS = [
  { label: "Import Contacts",  desc: "Upload a CSV file",        href: "/contacts",       emoji: "🗂️" },
  { label: "Send Broadcast",   desc: "Reach all your contacts",  href: "/broadcasts/new", emoji: "📣" },
  { label: "Build a Chatbot",  desc: "Automate your responses",  href: "/chatbot",        emoji: "⚡" },
  { label: "Add Products",     desc: "Set up your catalog",      href: "/catalog",        emoji: "📦" },
];

export default async function DashboardPage() {
  const session = await auth();
  const name = session?.user?.name?.split(" ")?.[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const data = await getDashboardData(session.user.id);

  const STATS = [
    { label: "Total Contacts",     value: data.contacts,      icon: Users,         color: "brand" },
    { label: "Conversations",      value: data.conversations, icon: MessageSquare, color: "blue"  },
    { label: "Broadcasts Sent",    value: data.sentBroadcasts,icon: Megaphone,     color: "amber" },
    { label: "Total Broadcasts",   value: data.broadcasts,    icon: TrendingUp,    color: "brand" },
  ];

  return (
    <div className="space-y-8 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink-900">
            {greeting}, {name} 👋
          </h1>
          <p className="text-ink-400 text-sm mt-1">
            Here's what's happening with your WhatsApp business today.
          </p>
        </div>
        <div className="badge-yellow gap-2 py-2 px-4">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse-soft" />
          14-day trial active
        </div>
        </div>

      {/* WhatsApp Setup Banner */}
      {!data.workspace?.waVerified && (
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(34,197,94,0.12) 0%, transparent 60%)" }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
                <Zap size={13} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Setup Required</span>
            </div>
            <h3 className="font-sans text-lg font-bold text-white mb-1">Connect your WhatsApp Business account</h3>
            <p className="text-ink-400 text-sm max-w-md">
              Link your official WhatsApp API to start sending messages, broadcasts, and running chatbots.
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <Link href="/settings" className="btn-primary">
              Connect WhatsApp <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">{label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                color === "brand" ? "bg-brand-50" : color === "blue" ? "bg-blue-50" : "bg-amber-50"
              }`}>
                <Icon size={17} className={
                  color === "brand" ? "text-brand-600" : color === "blue" ? "text-blue-600" : "text-amber-600"
                } />
              </div>
            </div>
            <p className="font-display text-3xl font-black text-ink-900">{value}</p>
            <p className="text-xs text-ink-400 mt-1">All time</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-sans text-sm font-bold text-ink-600 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(({ label, desc, href, emoji }) => (
            <Link key={label} href={href} className="card-hover p-5 group">
              <div className="text-3xl mb-3">{emoji}</div>
              <p className="font-semibold text-sm text-ink-800 mb-1">{label}</p>
              <p className="text-xs text-ink-400 mb-3">{desc}</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:gap-2 transition-all">
                Get started <ArrowUpRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Conversations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-sm font-bold text-ink-600 uppercase tracking-wider">Recent Conversations</h2>
          <Link href="/inbox" className="text-xs text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="card overflow-hidden">
          {data.recentConversations.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-ink-300" />
              </div>
              <p className="font-semibold text-ink-700 mb-1">No conversations yet</p>
              <p className="text-sm text-ink-400 max-w-xs">
                Once you connect WhatsApp, conversations will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="th">Contact</th>
                  <th className="th">Last Message</th>
                  <th className="th">Status</th>
                  <th className="th">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recentConversations.map(c => (
                  <tr key={c.id} className="hover:bg-surface-50 transition-colors">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                          {(c.contact?.name?.[0] || c.contact?.phone?.[0] || "?").toUpperCase()}
                        </div>
                        <span className="font-semibold text-ink-800">{c.contact?.name || c.contact?.phone}</span>
                      </div>
                    </td>
                    <td className="td"><p className="text-ink-500 truncate max-w-[200px]">{c.lastMessage || "—"}</p></td>
                    <td className="td">
                      <span className={c.status === "OPEN" ? "badge-green" : c.status === "BOT" ? "badge-blue" : "badge-gray"}>
                        {c.status}
                      </span>
                    </td>
                    <td className="td text-ink-400 text-xs">{new Date(c.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
