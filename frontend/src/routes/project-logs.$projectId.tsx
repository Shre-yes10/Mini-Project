import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Search, FileText, ChevronDown, ChevronRight, Download } from "lucide-react";

export const Route = createFileRoute("/project-logs/$projectId")({
    component: ProjectLogsPage,
});

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

type LogEntry = {
    level: LogLevel;
    message: string;
    timestamp?: string;
    date?: string;
    time?: string;
    [key: string]: unknown;
};

type LogFile = {
    filename: string;
    created_at: string;
    logs: LogEntry[];
};

const LEVEL_STYLES: Record<LogLevel | string, { bg: string; text: string; border: string }> = {
    ERROR: { bg: "rgba(248,113,113,0.15)", text: "#f87171", border: "rgba(248,113,113,0.4)" },
    WARN: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24", border: "rgba(251,191,36,0.4)" },
    INFO: { bg: "rgba(56,189,248,0.15)", text: "#38bdf8", border: "rgba(56,189,248,0.4)" },
    DEBUG: { bg: "rgba(167,139,250,0.15)", text: "#a78bfa", border: "rgba(167,139,250,0.4)" },
};

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function getLogTimestamp(log: LogEntry): string {
    if (log.timestamp) return log.timestamp;
    if (log.date && log.time) return `${log.date} ${log.time}`;
    return "—";
}

function ProjectLogsPage() {
    const { projectId } = useParams({ from: "/project-logs/$projectId" });

    const [files, setFiles] = useState<LogFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [levelFilter, setLevelFilter] = useState<string>("");
    const [keyword, setKeyword] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<string>("");

    // Collapsed files
    const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        fetch(`/api/project/${projectId}/logs`, { headers: getAuthHeaders() })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data: { files?: LogFile[] }) => {
                setFiles(data.files ?? []);
                setError(null);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to load logs. Please try again.");
            })
            .finally(() => setLoading(false));
    }, [projectId]);

    const uniqueFiles = useMemo(() => files.map((f) => f.filename), [files]);

    const filteredFiles = useMemo(() => {
        return files
            .filter((f) => !selectedFile || f.filename === selectedFile)
            .map((f) => ({
                ...f,
                logs: f.logs.filter((log) => {
                    const matchLevel = levelFilter ? log.level === levelFilter : true;
                    const matchKeyword = keyword
                        ? JSON.stringify(log).toLowerCase().includes(keyword.toLowerCase())
                        : true;
                    return matchLevel && matchKeyword;
                }),
            }))
            .filter((f) => f.logs.length > 0 || (!levelFilter && !keyword));
    }, [files, levelFilter, keyword, selectedFile]);

    const totalFiltered = useMemo(
        () => filteredFiles.reduce((sum, f) => sum + f.logs.length, 0),
        [filteredFiles]
    );

    const toggleFile = (filename: string) => {
        setCollapsedFiles((prev) => {
            const next = new Set(prev);
            next.has(filename) ? next.delete(filename) : next.add(filename);
            return next;
        });
    };

    const handleExportCSV = () => {
        const headers = ["Filename", "Timestamp", "Level", "Message"];
        const rows: string[] = [];
        rows.push(headers.join(","));

        filteredFiles.forEach((file) => {
            file.logs.forEach((log) => {
                const ts = getLogTimestamp(log) || "";
                const level = log.level || "";
                const msg = String(log.message ?? JSON.stringify(log)).replace(/"/g, '""');
                rows.push(`"${file.filename}","${ts}","${level}","${msg}"`);
            });
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `project_logs_${projectId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div
            className="min-h-screen text-gray-200 p-8"
            style={{
                background: `
          radial-gradient(circle at 20% 20%, rgba(37,99,235,0.12), transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(99,102,241,0.1), transparent 40%),
          radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
          #0B1120
        `,
                backgroundSize: "auto, auto, 24px 24px, auto",
            }}
        >
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to="/project/$projectId"
                        params={{ projectId }}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <FileText className="w-6 h-6 text-blue-400" />
                            <h1 className="text-3xl font-semibold text-white">Log Explorer</h1>
                        </div>
                        <p className="text-slate-400 text-sm font-mono ml-9">Project: {projectId}</p>
                    </div>
                    {!loading && (
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span><span className="text-white font-semibold">{files.length}</span> files</span>
                            <span><span className="text-white font-semibold">{totalFiltered}</span> entries shown</span>
                            <button
                                onClick={handleExportCSV}
                                disabled={totalFiltered === 0}
                                className="ml-2 flex items-center gap-2 px-3 py-1.5 border border-white/20 hover:bg-white/10 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-2xl bg-white/5 border border-white/10">
                    {/* Search */}
                    <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search messages, fields..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
                        />
                    </div>

                    {/* Level filter */}
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500/50"
                    >
                        <option value="">All Levels</option>
                        <option value="ERROR">ERROR</option>
                        <option value="WARN">WARN</option>
                        <option value="INFO">INFO</option>
                        <option value="DEBUG">DEBUG</option>
                    </select>

                    {/* File filter */}
                    <select
                        value={selectedFile}
                        onChange={(e) => setSelectedFile(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500/50"
                    >
                        <option value="">All Files</option>
                        {uniqueFiles.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>

                    {(levelFilter || keyword || selectedFile) && (
                        <button
                            onClick={() => { setLevelFilter(""); setKeyword(""); setSelectedFile(""); }}
                            className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-400 rounded-full animate-spin mb-4" />
                        <p>Loading logs...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400">{error}</div>
                ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No log entries match your filters.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredFiles.map((file) => {
                            const isCollapsed = collapsedFiles.has(file.filename);
                            return (
                                <div
                                    key={file.filename}
                                    className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-xl shadow-xl"
                                >
                                    {/* File header */}
                                    <button
                                        onClick={() => toggleFile(file.filename)}
                                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isCollapsed
                                                ? <ChevronRight className="w-4 h-4 text-slate-400" />
                                                : <ChevronDown className="w-4 h-4 text-slate-400" />
                                            }
                                            <FileText className="w-4 h-4 text-blue-400" />
                                            <span className="font-semibold text-white">{file.filename}</span>
                                            <span className="text-xs text-slate-500">
                                                uploaded {new Date(file.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-400 bg-white/10 px-2 py-1 rounded-full">
                                            {file.logs.length} entries
                                        </span>
                                    </button>

                                    {/* Log table */}
                                    {!isCollapsed && (
                                        <div className="overflow-x-auto border-t border-white/10">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-xs text-slate-400 border-b border-white/10 bg-white/3">
                                                        <th className="text-left px-5 py-3 w-44">Timestamp</th>
                                                        <th className="text-left px-3 py-3 w-20">Level</th>
                                                        <th className="text-left px-3 py-3">Message</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {file.logs.map((log, idx) => {
                                                        const style = LEVEL_STYLES[log.level] ?? LEVEL_STYLES["INFO"];
                                                        return (
                                                            <tr
                                                                key={idx}
                                                                className="border-b border-white/5 hover:bg-white/5 transition"
                                                            >
                                                                <td className="px-5 py-2.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                                                                    {getLogTimestamp(log)}
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    <span
                                                                        className="px-2 py-0.5 rounded text-xs font-bold"
                                                                        style={{
                                                                            background: style.bg,
                                                                            color: style.text,
                                                                            border: `1px solid ${style.border}`,
                                                                        }}
                                                                    >
                                                                        {log.level}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2.5 text-gray-300 max-w-xl">
                                                                    <span className="break-words">{log.message ?? JSON.stringify(log)}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
