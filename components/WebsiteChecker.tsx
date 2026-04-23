"use client";

import { useState } from "react";

type ApiIssue = {
  severity: string;
  endpoint: string;
  method: string;
  status: number;
  title: string;
  detail: string;
  responseSnippet: string;
};
type FormIssue = {
  severity: string;
  formIndex: number;
  title: string;
  detail: string;
  submissionStatus: string;
  errorMessages: string[];
  suggestedFix: string;
};
type GeneralIssue = { severity: string; title: string; detail: string };
type Report = {
  score: number;
  summary: string;
  apiIssues: ApiIssue[];
  formIssues: FormIssue[];
  generalIssues: GeneralIssue[];
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700",
  warning: "bg-yellow-50 text-yellow-700",
  info: "bg-blue-50 text-blue-600",
  pass: "bg-green-50 text-green-700",
};

const STATUS_COLOR: Record<string, string> = {
  success: "text-green-600",
  error: "text-red-600",
  validation_blocked: "text-yellow-600",
  no_response: "text-gray-400",
};

export default function WebsiteChecker() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"api" | "forms" | "general">("api");

  async function runScan() {
    if (!url.startsWith("http")) {
      setError("Enter a valid URL.");
      return;
    }
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const res = await fetch("/api/check-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReport(data);
      setTab("api");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-600" : s >= 55 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-1">API & Form Bug Checker</h1>
      <p className="text-sm text-gray-500 mb-5">
        Fills your forms, fires your APIs, and lets Gemma find the bugs.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runScan()}
          placeholder="https://your-site.com"
        />
        <button
          onClick={runScan}
          disabled={loading}
          className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 whitespace-nowrap"
        >
          {loading ? "Scanning..." : "Run check →"}
        </button>
      </div>

      {loading && (
        <div className="text-sm text-gray-400 mb-4 animate-pulse">
          Playwright is filling forms and watching your API calls...
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {report && (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Score
              </p>
              <p className={`text-2xl font-bold ${scoreColor(report.score)}`}>
                {report.score}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                API issues
              </p>
              <p className="text-2xl font-bold text-red-500">
                {report.apiIssues?.length ?? 0}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Form issues
              </p>
              <p className="text-2xl font-bold text-yellow-500">
                {report.formIssues?.length ?? 0}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                General
              </p>
              <p className="text-2xl font-bold text-blue-500">
                {report.generalIssues?.length ?? 0}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            {report.summary}
          </p>

          {/* Tabs */}
          <div className="flex gap-1 border-b mb-4">
            {(["api", "forms", "general"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? "border-black text-black"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "api"
                  ? "API calls"
                  : t === "forms"
                    ? "Forms"
                    : "General"}
              </button>
            ))}
          </div>

          {/* API Issues */}
          {tab === "api" && (
            <div className="space-y-3">
              {(report.apiIssues ?? []).length === 0 && (
                <p className="text-sm text-green-600">
                  No API issues detected.
                </p>
              )}
              {(report.apiIssues ?? []).map((issue, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[issue.severity]}`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {issue.method} {issue.status}
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-1">{issue.title}</p>
                  <p className="text-xs text-gray-400 font-mono mb-2 truncate">
                    {issue.endpoint}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">
                    {issue.detail}
                  </p>
                  {issue.responseSnippet && (
                    <pre className="text-xs bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                      {issue.responseSnippet}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Form Issues */}
          {tab === "forms" && (
            <div className="space-y-3">
              {(report.formIssues ?? []).length === 0 && (
                <p className="text-sm text-green-600">
                  No form issues detected.
                </p>
              )}
              {(report.formIssues ?? []).map((issue, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[issue.severity]}`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-xs text-gray-400">
                      Form #{issue.formIndex + 1} ·{" "}
                      <span
                        className={
                          STATUS_COLOR[issue.submissionStatus] ||
                          "text-gray-400"
                        }
                      >
                        {issue.submissionStatus.replace(/_/g, " ")}
                      </span>
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-1">{issue.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">
                    {issue.detail}
                  </p>
                  {issue.errorMessages?.length > 0 && (
                    <div className="bg-red-50 rounded p-2 mb-2">
                      <p className="text-xs font-medium text-red-700 mb-1">
                        Errors shown on screen:
                      </p>
                      {issue.errorMessages.map((m, j) => (
                        <p key={j} className="text-xs text-red-600">
                          · {m}
                        </p>
                      ))}
                    </div>
                  )}
                  {issue.suggestedFix && (
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs font-medium text-blue-700 mb-1">
                        Suggested fix:
                      </p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        {issue.suggestedFix}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* General Issues */}
          {tab === "general" && (
            <div className="space-y-3">
              {(report.generalIssues ?? []).length === 0 && (
                <p className="text-sm text-green-600">
                  No general issues detected.
                </p>
              )}
              {(report.generalIssues ?? []).map((issue, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[issue.severity]}`}
                    >
                      {issue.severity}
                    </span>
                    <p className="font-medium text-sm">{issue.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {issue.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
