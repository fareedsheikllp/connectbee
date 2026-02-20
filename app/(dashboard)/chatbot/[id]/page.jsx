"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Save, Loader2, Trash2, Play, Pause,
  MessageSquare, GitBranch, Clock, Zap, ChevronDown, X
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const NODE_TYPES = {
  message:  { label: "Send Message",    icon: MessageSquare, color: "bg-brand-50 border-brand-200 text-brand-700"  },
  condition:{ label: "Check Keyword",   icon: GitBranch,     color: "bg-amber-50 border-amber-200 text-amber-700"  },
  delay:    { label: "Wait / Delay",    icon: Clock,         color: "bg-blue-50 border-blue-200 text-blue-700"     },
  action:   { label: "Take Action",     icon: Zap,           color: "bg-purple-50 border-purple-200 text-purple-700"},
};

function NodeCard({ node, onEdit, onDelete, onConnect, isSelected, onClick }) {
  const type = NODE_TYPES[node.type] || NODE_TYPES.message;
  const Icon = type.icon;

  return (
    <div
      onClick={onClick}
      className={`absolute bg-white rounded-2xl border-2 shadow-soft cursor-pointer transition-all select-none ${isSelected ? "border-brand-500 shadow-brand-sm" : "border-surface-200 hover:border-brand-300"}`}
      style={{ left: node.x, top: node.y, width: 220, zIndex: isSelected ? 10 : 1 }}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl border-b ${type.color.split(" ").slice(0,2).join(" ")} border-opacity-50`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${type.color}`}>
          <Icon size={13} />
        </div>
        <span className="text-xs font-bold text-ink-700 flex-1 truncate">{type.label}</span>
        <button onClick={e => { e.stopPropagation(); onDelete(node.id); }} className="text-ink-300 hover:text-red-500 transition-colors">
          <X size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5">
        {node.type === "message" && (
          <p className="text-xs text-ink-600 line-clamp-3 min-h-[36px]">{node.data?.message || <span className="text-ink-300 italic">Click to add message...</span>}</p>
        )}
        {node.type === "condition" && (
          <p className="text-xs text-ink-600">{node.data?.keyword ? <>If message contains <span className="font-bold text-amber-700">"{node.data.keyword}"</span></> : <span className="text-ink-300 italic">Click to set keyword...</span>}</p>
        )}
        {node.type === "delay" && (
          <p className="text-xs text-ink-600">{node.data?.seconds ? `Wait ${node.data.seconds} seconds` : <span className="text-ink-300 italic">Click to set delay...</span>}</p>
        )}
        {node.type === "action" && (
          <p className="text-xs text-ink-600">{node.data?.action || <span className="text-ink-300 italic">Click to set action...</span>}</p>
        )}
      </div>

      {/* Connect button */}
      <div className="px-3 pb-2.5">
        <button
          onClick={e => { e.stopPropagation(); onConnect(node.id); }}
          className="w-full text-[11px] font-semibold text-ink-400 hover:text-brand-600 border border-dashed border-surface-200 hover:border-brand-300 rounded-lg py-1 transition-all"
        >
          + Connect next step
        </button>
      </div>

      {/* Node ID badge */}
      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-ink-800 flex items-center justify-center">
        <span className="text-[9px] text-white font-bold">{node.order + 1}</span>
      </div>
    </div>
  );
}

function EditPanel({ node, onChange, onClose }) {
  const [data, setData] = useState(node.data || {});

  function save() {
    onChange(node.id, data);
    onClose();
  }

  return (
    <div className="w-80 flex-shrink-0 border-l border-surface-200 bg-surface-0 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
        <h3 className="font-bold text-ink-800 text-sm">Edit Node</h3>
        <button onClick={onClose} className="btn-ghost btn-icon"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {node.type === "message" && (
          <div>
            <label className="field-label">Message Text</label>
            <textarea
              value={data.message || ""}
              onChange={e => setData(p => ({ ...p, message: e.target.value }))}
              placeholder="Type the message to send..."
              rows={5}
              className="field-input resize-none text-sm"
            />
            <p className="field-hint">Use {"{name}"} to insert contact's name</p>
          </div>
        )}
        {node.type === "condition" && (
          <>
            <div>
              <label className="field-label">Keyword to match</label>
              <input
                value={data.keyword || ""}
                onChange={e => setData(p => ({ ...p, keyword: e.target.value }))}
                placeholder="e.g. price, hello, buy"
                className="field-input"
              />
              <p className="field-hint">If the customer's message contains this word</p>
            </div>
            <div>
              <label className="field-label">Match type</label>
              <select value={data.matchType || "contains"} onChange={e => setData(p => ({ ...p, matchType: e.target.value }))} className="field-input">
                <option value="contains">Contains keyword</option>
                <option value="exact">Exact match</option>
                <option value="starts">Starts with</option>
              </select>
            </div>
          </>
        )}
        {node.type === "delay" && (
          <div>
            <label className="field-label">Wait duration (seconds)</label>
            <input
              type="number"
              min={1}
              max={86400}
              value={data.seconds || 5}
              onChange={e => setData(p => ({ ...p, seconds: parseInt(e.target.value) }))}
              className="field-input"
            />
            <p className="field-hint">Bot will pause before the next step</p>
          </div>
        )}
        {node.type === "action" && (
          <div>
            <label className="field-label">Action to perform</label>
            <select value={data.action || ""} onChange={e => setData(p => ({ ...p, action: e.target.value }))} className="field-input">
              <option value="">Select an action...</option>
              <option value="Assign to human agent">Assign to human agent</option>
              <option value="Mark conversation as resolved">Mark as resolved</option>
              <option value="Add tag to contact">Add tag to contact</option>
              <option value="Send to broadcast list">Add to broadcast list</option>
              <option value="Subscribe contact">Subscribe contact</option>
              <option value="Unsubscribe contact">Unsubscribe contact</option>
            </select>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-surface-200">
        <button onClick={save} className="btn-primary w-full">Save Node</button>
      </div>
    </div>
  );
}

export default function ChatbotFlowPage() {
  const { id } = useParams();
  const router = useRouter();
  const [chatbot, setChatbot] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => { fetchChatbot(); }, [id]);

  async function fetchChatbot() {
    setLoading(true);
    try {
      const res = await fetch(`/api/chatbot/${id}`);
      const data = await res.json();
      if (!res.ok) { toast.error("Not found"); router.push("/chatbot"); return; }
      setChatbot(data.chatbot);
      setNodes(data.chatbot.flow?.nodes || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  function addNode(type) {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      order: nodes.length,
      x: 60 + (nodes.length % 3) * 260,
      y: 60 + Math.floor(nodes.length / 3) * 200,
      data: {},
      connections: [],
    };
    setNodes(p => [...p, newNode]);
    setShowAddMenu(false);
    setSelectedNode(newNode.id);
  }

  function updateNodeData(nodeId, data) {
    setNodes(p => p.map(n => n.id === nodeId ? { ...n, data } : n));
  }

  function deleteNode(nodeId) {
    setNodes(p => p.filter(n => n.id !== nodeId).map((n, i) => ({ ...n, order: i })));
    if (selectedNode === nodeId) setSelectedNode(null);
  }

  function handleConnect(fromId) {
    if (connecting === fromId) { setConnecting(null); return; }
    if (connecting) {
      setNodes(p => p.map(n => n.id === connecting
        ? { ...n, connections: [...(n.connections || []).filter(c => c !== fromId), fromId] }
        : n
      ));
      setConnecting(null);
      toast.success("Nodes connected!");
    } else {
      setConnecting(fromId);
      toast("Now click the node to connect to", { icon: "👆" });
    }
  }

  async function saveFlow() {
    setSaving(true);
    try {
      const res = await fetch(`/api/chatbot/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow: { nodes } }),
      });
      if (!res.ok) { toast.error("Failed to save"); return; }
      toast.success("Flow saved!");
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  }

  const selectedNodeObj = nodes.find(n => n.id === selectedNode);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-128px)] -m-6 lg:-m-8 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-surface-0 border-b border-surface-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/chatbot" className="btn-ghost btn-icon"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="font-bold text-ink-900 text-sm">{chatbot?.name}</h1>
            <p className="text-xs text-ink-400">{nodes.length} nodes · {chatbot?.active ? "Active" : "Paused"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {connecting && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-semibold text-amber-700">Connecting... click target node</span>
              <button onClick={() => setConnecting(null)} className="text-amber-500"><X size={13} /></button>
            </div>
          )}
          <div className="relative">
            <button onClick={() => setShowAddMenu(p => !p)} className="btn-secondary gap-2">
              <Plus size={15} /> Add Node <ChevronDown size={13} />
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-surface-0 border border-surface-200 rounded-2xl shadow-large overflow-hidden z-20">
                {Object.entries(NODE_TYPES).map(([type, { label, icon: Icon, color }]) => (
                  <button key={type} onClick={() => addNode(type)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors text-left">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${color}`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-sm font-medium text-ink-700">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={saveFlow} disabled={saving} className="btn-primary gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Flow
          </button>
        </div>
      </div>

      {/* Canvas + Panel */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="flex-1 relative overflow-auto bg-surface-50" style={{ backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-3xl bg-surface-200 flex items-center justify-center mb-4">
                <GitBranch size={36} className="text-ink-300" />
              </div>
              <p className="font-semibold text-ink-600 mb-1">Your canvas is empty</p>
              <p className="text-sm text-ink-400 mb-6 max-w-xs">Add nodes to build your chatbot flow. Start with a message node.</p>
              <button onClick={() => addNode("message")} className="btn-primary gap-2">
                <Plus size={15} /> Add first node
              </button>
            </div>
          ) : (
            <div className="relative" style={{ minWidth: 800, minHeight: 600 }}>
              {/* Connection lines SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {nodes.flatMap(node =>
                  (node.connections || []).map(targetId => {
                    const target = nodes.find(n => n.id === targetId);
                    if (!target) return null;
                    const x1 = node.x + 110;
                    const y1 = node.y + 80;
                    const x2 = target.x + 110;
                    const y2 = target.y;
                    return (
                      <path key={`${node.id}-${targetId}`}
                        d={`M ${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}`}
                        fill="none" stroke="#22c55e" strokeWidth={2} strokeDasharray="6 3" opacity={0.6}
                      />
                    );
                  })
                )}
              </svg>

              {nodes.map(node => (
                <NodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNode === node.id}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  onEdit={(nodeId, data) => updateNodeData(nodeId, data)}
                  onDelete={deleteNode}
                  onConnect={handleConnect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit panel */}
        {selectedNodeObj && (
          <EditPanel
            node={selectedNodeObj}
            onChange={updateNodeData}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
