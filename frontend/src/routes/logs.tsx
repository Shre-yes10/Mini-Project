import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

export const Route = createFileRoute("/logs")({
  component: LogsPage,
});

type Log = {
  raw: string;
  level: "INFO" | "WARN" | "ERROR";
  timestamp: string;
  service: string;
  message: string;
};

function LogsPage() {
  const [level, setLevel] = useState("");
  const [service, setService] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [seconds, setSeconds] = useState("");
  const [milliseconds, setMilliseconds] = useState("");

  const logs: Log[] = [
    {
      raw: "2026-02-19 19:06:35.430 WARN ... MeshDataService : Failed to return account details for accountId=568",
      level: "WARN",
      timestamp: "2026-02-19T19:06:35.430",
      service: "MeshDataService",
      message: "Failed to return account details for accountId=568",
    },
    {
      raw: "2026-02-19 19:06:36.430 ERROR ... MeshDataService : DB connection timeout while processing paymentId=892",
      level: "ERROR",
      timestamp: "2026-02-19T19:06:36.430",
      service: "MeshDataService",
      message: "DB connection timeout while processing paymentId=892",
    },
    {
      raw: "2026-02-19 19:10:10.120 ERROR ... MeshDataService : DB connection timeout while processing paymentId=999",
      level: "ERROR",
      timestamp: "2026-02-19T19:10:10.120",
      service: "MeshDataService",
      message: "DB connection timeout while processing paymentId=999",
    },
    {
      raw: "2026-02-19 19:12:44.200 WARN ... MeshDataService : Slow response detected for accountId=222",
      level: "WARN",
      timestamp: "2026-02-19T19:12:44.200",
      service: "MeshDataService",
      message: "Slow response detected for accountId=222",
    },
    {
      raw: "2026-02-19 20:00:00.000 INFO ... MeshDataController : Fetching account details for accountId=376",
      level: "INFO",
      timestamp: "2026-02-19T20:00:00.000",
      service: "MeshDataController",
      message: "Fetching account details for accountId=376",
    },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = level ? log.level === level : true;
    const matchesService = service ? log.service === service : true;
    const matchesKeyword = keyword
      ? log.message.toLowerCase().includes(keyword.toLowerCase())
      : true;
    const matchesFrom = from ? new Date(log.timestamp) >= new Date(from) : true;
    const matchesTo = to ? new Date(log.timestamp) <= new Date(to) : true;

    const logDate = new Date(log.timestamp);
    const logSeconds = logDate.getSeconds();
    const logMilliseconds = logDate.getMilliseconds();

    const matchesSeconds = seconds ? logSeconds === Number(seconds) : true;
    const matchesMilliseconds = milliseconds
      ? logMilliseconds === Number(milliseconds)
      : true;

    return (
      matchesLevel &&
      matchesService &&
      matchesKeyword &&
      matchesFrom &&
      matchesTo &&
      matchesSeconds &&
      matchesMilliseconds
    );
  });

  const uniqueServices = [...new Set(logs.map((log) => log.service))];

  return (
    <div className="min-h-screen bg-black text-gray-300 p-10">
      <div className="flex justify-center mb-10">
        <div className="relative flex w-full max-w-3xl items-end justify-between overflow-hidden rounded-3xl border border-transparent px-6 py-6 shadow ring-1 shadow-black/10 ring-black/5 dark:shadow-white/10 dark:ring-white/5">
          <div className="relative z-20 space-y-1 backdrop-blur-[2px]">
            <p className="text-xs font-normal text-neutral-400 md:text-sm">
              Log explorer
            </p>
            <p className="text-base font-semibold text-white md:text-lg">
              Filter and inspect your application logs
            </p>
          </div>
          <p className="relative z-20 text-xs font-normal text-neutral-400 md:text-sm">
            &rarr;
          </p>

          <DottedGlowBackground
            className="mask-radial-to-90% mask-radial-at-center"
            opacity={1}
            gap={10}
            radius={1.6}
            colorLightVar="--color-neutral-500"
            glowColorLightVar="--color-neutral-600"
            colorDarkVar="--color-neutral-500"
            glowColorDarkVar="--color-sky-800"
            backgroundOpacity={0}
            speedMin={0.3}
            speedMax={1.6}
            speedScale={1}
          />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-10 text-center text-white">
        📜 Logs Dashboard
      </h1>

      {/* Filters */}
      <div className="space-y-6 mb-10 max-w-6xl mx-auto">
        <div className="flex flex-wrap gap-4 justify-center">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
          >
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
          >
            <option value="">All Services</option>
            {uniqueServices.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search keyword..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
          />
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
          />
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
          />
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <input
            type="number"
            placeholder="Seconds"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200 w-28"
          />
          <input
            type="number"
            placeholder="Milliseconds"
            value={milliseconds}
            onChange={(e) => setMilliseconds(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200 w-36"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-w-6xl mx-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="text-left px-4 py-3">Timestamp</th>
              <th className="text-left px-4 py-3">Level</th>
              <th className="text-left px-4 py-3">Service</th>
              <th className="text-left px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr
                key={index}
                className="border-b border-gray-800 hover:bg-gray-900 transition"
              >
                <td className="px-4 py-3">{log.timestamp}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      log.level === "ERROR"
                        ? "bg-red-600 text-white"
                        : log.level === "WARN"
                        ? "bg-yellow-500 text-black"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {log.level}
                  </span>
                </td>
                <td className="px-4 py-3">{log.service}</td>
                <td className="px-4 py-3 text-gray-400">
                  {log.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="mt-10 text-center text-red-400">
          🚫 No logs found
        </div>
      )}
    </div>
  );
}
