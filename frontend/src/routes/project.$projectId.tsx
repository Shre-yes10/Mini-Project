import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Send, Bot, User, AlertTriangle, Info, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Level = "INFO" | "WARN" | "ERROR" | "DEBUG";

type LogType = {
  level: Level;
  message: string;
  timestamp?: string;
  date?: string;
  time?: string;
  [key: string]: unknown;
};

// Matches actual backend Alert shape from alert_engine.py
type AlertType = {
  name: string;
  reason: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  stats: {
    count: number;
    time_window_minutes: number;
    latest_timestamp: string;
  };
  logs: LogType[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type LineDataType = {
  time: string;
  INFO: number;
  WARN: number;
  ERROR: number;
  DEBUG: number;
};

type PieDataType = {
  name: Level;
  value: number;
};

const LEVEL_COLORS: Record<Level, string> = {
  INFO: "#38bdf8",
  WARN: "#fbbf24",
  ERROR: "#f87171",
  DEBUG: "#a78bfa",
};

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: "#f87171",
  MEDIUM: "#fbbf24",
  LOW: "#38bdf8",
};

const LEVELS: Level[] = ["INFO", "WARN", "ERROR", "DEBUG"];

export const Route = createFileRoute("/project/$projectId")({
  component: ProjectDashboard,
});

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function ProjectDashboard() {
  const { projectId } = useParams({ from: "/project/$projectId" });

  const [logs, setLogs] = useState<LogType[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<"ALL" | Level>("ALL");

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch logs
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/project/${projectId}/logs`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data: { files?: Array<{ logs: LogType[] }> }) => {
        const allLogs = (data.files ?? []).flatMap((f) => f.logs ?? []);
        setLogs(allLogs);
      })
      .catch((err) => console.error("Failed to load logs:", err));
  }, [projectId]);

  // Fetch alerts
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/project/${projectId}/alerts`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data: { alerts?: AlertType[] }) => {
        setAlerts(data.alerts ?? []);
      })
      .catch((err) => console.error("Failed to load alerts:", err));
  }, [projectId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Pie chart data
  const pieData: PieDataType[] = useMemo(() => {
    const counts: Record<Level, number> = { INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 };
    logs.forEach((log) => {
      if (log.level && counts[log.level] !== undefined) counts[log.level] += 1;
    });
    return LEVELS.map((level) => ({ name: level, value: counts[level] }));
  }, [logs]);

  // Line chart data — group by date+time bucket
  const lineData: LineDataType[] = useMemo(() => {
    const timeMap: Record<string, LineDataType> = {};
    logs.forEach((log) => {
      const key = log.date
        ? `${log.date} ${(log.time ?? "").slice(0, 5)}`
        : (log.timestamp ?? "").slice(0, 16);
      if (!key) return;
      if (!timeMap[key]) {
        timeMap[key] = { time: key, INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 };
      }
      if (log.level && timeMap[key][log.level] !== undefined) {
        timeMap[key][log.level] += 1;
      }
    });

    const data = Object.values(timeMap).sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    if (selectedLevel === "ALL") return data;

    return data.map((entry) => ({
      time: entry.time,
      INFO: selectedLevel === "INFO" ? entry.INFO : 0,
      WARN: selectedLevel === "WARN" ? entry.WARN : 0,
      ERROR: selectedLevel === "ERROR" ? entry.ERROR : 0,
      DEBUG: selectedLevel === "DEBUG" ? entry.DEBUG : 0,
    }));
  }, [logs, selectedLevel]);

  // Severe alerts sorted by severity (HIGH first, then MEDIUM, then LOW, then by timestamp desc)
  const topSevereAlerts = useMemo(() => {
    const SEVERITY_RANK: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return [...alerts].sort((a, b) => {
      const diff = (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0);
      if (diff !== 0) return diff;
      return (b.stats?.latest_timestamp ?? "").localeCompare(a.stats?.latest_timestamp ?? "");
    });
  }, [alerts]);

  const handlePieClick = (entry: PieDataType) => {
    setSelectedLevel(entry.name);
  };

  // Send chat message
  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`/api/project/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.response ?? "Sorry, I couldn't get a response.",
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Failed to reach the AI. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-gray-200 p-10"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(37,99,235,0.15), transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(99,102,241,0.12), transparent 40%),
          radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(15,15,15,0.4), rgba(15,15,15,0.95)),
          #0B1120
        `,
        backgroundSize: "auto, auto, 24px 24px, 100% 100%, auto",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            Project Dashboard
          </h1>
          <p className="text-slate-400 mt-2 font-mono text-sm">ID: {projectId}</p>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-slate-400 text-sm">{logs.length} log entries</span>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}
          >
            {alerts.length} alerts
          </span>
          <Link
            to="/project-logs/$projectId"
            params={{ projectId }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
            style={{ background: "linear-gradient(to right, #3b82f6, #6366f1)", color: "#fff" }}
          >
            View Logs
          </Link>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Line chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Log Volume Over Time</h2>
            <div className="flex gap-2">
              {(["ALL", ...LEVELS] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl === "ALL" ? "ALL" : lvl)}
                  className="px-2 py-1 rounded text-xs font-semibold transition"
                  style={{
                    background: selectedLevel === lvl
                      ? lvl === "ALL" ? "rgba(255,255,255,0.15)" : `${LEVEL_COLORS[lvl as Level]}33`
                      : "transparent",
                    color: lvl === "ALL" ? "#fff" : LEVEL_COLORS[lvl as Level],
                    border: `1px solid ${lvl === "ALL" ? "rgba(255,255,255,0.2)" : `${LEVEL_COLORS[lvl as Level]}55`}`,
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lineData}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="time" stroke="#cbd5e1" tick={{ fontSize: 11 }} />
              <YAxis stroke="#cbd5e1" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              />
              {(selectedLevel === "ALL" ? LEVELS : [selectedLevel]).map((level) => (
                <Line
                  key={level}
                  type="monotone"
                  dataKey={level}
                  stroke={LEVEL_COLORS[level]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-semibold mb-4 text-white">Logs by Level</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                onClick={handlePieClick}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={LEVEL_COLORS[entry.name]}
                    cursor="pointer"
                    opacity={selectedLevel === "ALL" || selectedLevel === entry.name ? 1 : 0.3}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts + Chat grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 5 Most Severe Alerts */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Top Severe Alerts</h2>
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Info className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No alerts triggered for this project.</p>
            </div>
          ) : topSevereAlerts.length === 0 ? (
            <div className="text-slate-500 text-sm py-8 text-center">No alerts to display.</div>
          ) : (
            <div className="space-y-3">
              {topSevereAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border"
                  style={{
                    background: `${SEVERITY_COLOR[alert.severity] ?? "#94a3b8"}11`,
                    borderColor: `${SEVERITY_COLOR[alert.severity] ?? "#94a3b8"}33`,
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-white text-sm">{alert.name}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${SEVERITY_COLOR[alert.severity] ?? "#94a3b8"}22`,
                        color: SEVERITY_COLOR[alert.severity] ?? "#94a3b8",
                        border: `1px solid ${SEVERITY_COLOR[alert.severity] ?? "#94a3b8"}44`,
                      }}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{alert.reason}</p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span>{alert.stats?.count} logs</span>
                    <span>·</span>
                    <span>{alert.stats?.time_window_minutes}m window</span>
                    <span>·</span>
                    <span>
                      {alert.stats?.latest_timestamp
                        ? new Date(alert.stats.latest_timestamp).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Chat Panel */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col" style={{ height: "480px" }}>
          <div className="flex items-center gap-2 p-5 border-b border-white/10">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">AI Log Assistant</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {chatMessages.length === 0 && (
              <div className="text-center text-slate-500 pt-10">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Ask me anything about your logs.</p>
                <p className="text-xs mt-1 opacity-60">e.g. "What errors occurred most often?"</p>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: msg.role === "user"
                      ? "rgba(99,102,241,0.3)"
                      : "rgba(37,99,235,0.3)",
                  }}
                >
                  {msg.role === "user"
                    ? <User className="w-4 h-4 text-indigo-300" />
                    : <Bot className="w-4 h-4 text-blue-300" />
                  }
                </div>
                <div
                  className="max-w-[80%] text-sm rounded-xl px-4 py-3 leading-relaxed"
                  style={{
                    background: msg.role === "user"
                      ? "rgba(99,102,241,0.2)"
                      : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e2e8f0",
                  }}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-body text-sm space-y-2 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&_strong]:text-white">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-900/30">
                  <Bot className="w-4 h-4 text-blue-300" />
                </div>
                <div className="flex items-center gap-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                placeholder="Ask about your logs..."
                disabled={chatLoading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-50"
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                style={{ background: "linear-gradient(to right, #4f46e5, #3b82f6)" }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
