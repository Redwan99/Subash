"use client";
/**
 * components/admin/AsyncCsvImporter.tsx
 * Universal CSV import UI with live progress tracking.
 *
 * Supports:
 *  - fra_cleaned.csv   (semicolons, latin-1, Perfume/Brand/Top/Middle/Base)
 *  - fra_perfumes.csv  (commas, UTF-8, urls/Main Accords/Perfumers)
 *  - Generic CSVs      (commas, name/brand minimum)
 *
 * Shows real-time progress bar by polling getImportJobStatus().
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Clock,
  ArrowRight,
  History,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileWarning,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  startCsvImport,
  getImportJobStatus,
  getImportHistory,
} from "@/lib/actions/async-import";

// ── Types ─────────────────────────────────────────────────────────────────────

type JobStatus = Awaited<ReturnType<typeof getImportJobStatus>>;
type HistoryItem = Awaited<ReturnType<typeof getImportHistory>>[number];

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="relative w-full h-3 rounded-full bg-[var(--bg-glass-border)] overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#E84393] to-[#F783AC]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
    </div>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Database;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)]">
      <Icon size={13} className={color} />
      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      <span className="text-xs font-bold text-[var(--text-primary)] ml-auto">
        {value}
      </span>
    </div>
  );
}

// ── Format Badge ──────────────────────────────────────────────────────────────

function FormatBadge({ format }: { format: string | null }) {
  if (!format) return null;
  const labels: Record<string, string> = {
    fra_cleaned: "Fragrantica Cleaned",
    fra_perfumes: "Fragrantica Perfumes",
    generic: "Generic CSV",
  };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[rgba(232,67,147,0.12)] text-[#F783AC] border border-[rgba(232,67,147,0.2)]">
      <FileSpreadsheet size={10} />
      {labels[format] ?? format}
    </span>
  );
}

// ── Time Formatter ────────────────────────────────────────────────────────────

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return "--";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diff = Math.floor((e - s) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  const sec = diff % 60;
  return `${m}m ${sec}s`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AsyncCsvImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Polling ───────────────────────────────────────────────────────────────

  const pollJob = useCallback(async (id: string) => {
    try {
      const status = await getImportJobStatus(id);
      setJob(status);
      if (status?.status === "completed" || status?.status === "failed") {
        // Stop polling
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        // Refresh history
        const h = await getImportHistory();
        setHistory(h);
      }
    } catch {
      // Silently retry on next poll
    }
  }, []);

  useEffect(() => {
    if (jobId) {
      // Initial fetch
      pollJob(jobId);
      // Start polling every 1.5s
      pollRef.current = setInterval(() => pollJob(jobId), 1500);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId, pollJob]);

  // Load history on mount
  useEffect(() => {
    getImportHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);

  // ── File Handling ─────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a valid .csv file.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const resetState = () => {
    setFile(null);
    setJobId(null);
    setJob(null);
    setError(null);
    setUploading(false);
    setShowErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await startCsvImport(formData);
      if (result.error) {
        setError(result.error);
        setUploading(false);
      } else {
        setJobId(result.jobId);
        setUploading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start import."
      );
      setUploading(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isProcessing = job?.status === "processing";
  const isComplete = job?.status === "completed";
  const isFailed = job?.status === "failed";
  const pct =
    job && job.totalRows > 0
      ? Math.round((job.processedRows / job.totalRows) * 100)
      : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[var(--bg-glass)] backdrop-blur-[12px] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[rgba(232,67,147,0.15)] flex items-center justify-center shrink-0">
          <Database size={20} className="text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Universal CSV Import
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Auto-detects fra_cleaned.csv, fra_perfumes.csv, or generic CSV
            formats.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory((p) => !p)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-glass)] border border-[var(--border-color)] transition-colors"
          >
            <History size={13} />
            History
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* ── Active Job Panel ─────────────────────────────────────────────── */}
      {job && jobId ? (
        <div className="space-y-5">
          {/* Format & File */}
          <div className="flex items-center gap-3 flex-wrap">
            <FormatBadge format={job.format} />
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {job.filename}
            </span>
            <span className="text-xs text-[var(--text-muted)] ml-auto flex items-center gap-1">
              <Clock size={11} />
              {formatDuration(job.startedAt, job.completedAt)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                {isProcessing
                  ? "Processing..."
                  : isComplete
                    ? "Import Complete"
                    : "Import Failed"}
              </span>
              <span className="text-xs font-mono text-[var(--accent)]">
                {job.processedRows.toLocaleString()} /{" "}
                {job.totalRows.toLocaleString()} rows ({pct}%)
              </span>
            </div>
            <ProgressBar value={job.processedRows} max={job.totalRows} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill
              icon={Database}
              label="Inserted"
              value={job.insertedRows.toLocaleString()}
              color="text-green-400"
            />
            <StatPill
              icon={ArrowRight}
              label="Skipped"
              value={job.skippedRows.toLocaleString()}
              color="text-yellow-400"
            />
            <StatPill
              icon={AlertCircle}
              label="Errors"
              value={job.errorRows.toLocaleString()}
              color="text-red-400"
            />
            <StatPill
              icon={BarChart3}
              label="Total"
              value={job.totalRows.toLocaleString()}
              color="text-[var(--accent)]"
            />
          </div>

          {/* Error Log */}
          {job.errorLog.length > 0 && (
            <div>
              <button
                onClick={() => setShowErrors((p) => !p)}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
              >
                <FileWarning size={12} />
                {job.errorLog.length} Error
                {job.errorLog.length !== 1 ? "s" : ""} (click to{" "}
                {showErrors ? "hide" : "show"})
              </button>
              <AnimatePresence>
                {showErrors && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-red-500/5 border border-red-500/10 p-3 space-y-1"
                  >
                    {job.errorLog.map((err, i) => (
                      <p
                        key={i}
                        className="text-[11px] text-red-400/80 font-mono leading-relaxed"
                      >
                        {err}
                      </p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Status Banner */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
            >
              <CheckCircle2 size={20} className="text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-green-400">
                  Import completed successfully
                </p>
                <p className="text-[11px] text-green-400/60 mt-0.5">
                  {job.insertedRows.toLocaleString()} perfumes imported in{" "}
                  {formatDuration(job.startedAt, job.completedAt)}
                </p>
              </div>
            </motion.div>
          )}

          {isFailed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <XCircle size={20} className="text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-400">Import failed</p>
                <p className="text-[11px] text-red-400/60 mt-0.5">
                  {job.errorRows} errors encountered. Check the error log for
                  details.
                </p>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          {(isComplete || isFailed) && (
            <div className="flex justify-end">
              <button
                onClick={resetState}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:shadow-[0_0_20px_rgba(232,67,147,0.3)] text-white transition-all"
              >
                <RefreshCw size={14} />
                Import Another File
              </button>
            </div>
          )}

          {/* Processing Animation */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-1">
              <Loader2 size={14} className="text-[var(--accent)] animate-spin" />
              <span className="text-xs text-[var(--text-muted)] animate-pulse">
                Processing batch {Math.ceil(job.processedRows / 250)} of{" "}
                {Math.ceil(job.totalRows / 250)}...
              </span>
            </div>
          )}
        </div>
      ) : (
        /* ── Upload Zone ───────────────────────────────────────────────── */
        <>
          <div
            className={`relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              isDragging
                ? "border-[var(--accent)] bg-[rgba(232,67,147,0.05)] shadow-[0_0_30px_rgba(232,67,147,0.15)]"
                : file
                  ? "border-[#F783AC]/50 bg-[#F783AC]/5"
                  : "border-[var(--border-color)] hover:border-[rgba(255,255,255,0.2)]"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2
                  size={32}
                  className="text-[var(--accent)] animate-spin mb-3"
                />
                <span className="text-sm font-medium text-[var(--accent)] animate-pulse">
                  Uploading & detecting format...
                </span>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center text-center">
                <FileSpreadsheet size={36} className="text-[#F783AC] mb-3" />
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {file.name}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                  {file.size > 1024 * 1024 &&
                    ` (${(file.size / (1024 * 1024)).toFixed(1)} MB)`}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setError(null);
                  }}
                  className="mt-3 text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase font-bold tracking-wider"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center pointer-events-none">
                <UploadCloud
                  size={40}
                  className="text-[var(--text-muted)] mb-4"
                />
                <span className="text-sm font-semibold text-[var(--text-secondary)]">
                  Drag & Drop CSV or{" "}
                  <span className="text-[var(--accent)] underline decoration-[rgba(232,67,147,0.4)] underline-offset-4">
                    Click to Browse
                  </span>
                </span>
                <span className="text-[11px] text-[var(--text-muted)] mt-2">
                  Supports fra_cleaned.csv, fra_perfumes.csv, or any
                  name/brand CSV
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 rounded-lg flex items-start gap-3 border bg-red-500/10 border-red-500/20"
              >
                <AlertCircle
                  size={18}
                  className="text-red-400 shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Format Guide */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                name: "fra_cleaned.csv",
                desc: "Semicolons, Latin-1, Perfume/Brand/Gender/Year/Top/Middle/Base columns",
              },
              {
                name: "fra_perfumes.csv",
                desc: "Commas, UTF-8, URL-based with Main Accords/Perfumers/Description",
              },
              {
                name: "Generic CSV",
                desc: "Commas, UTF-8, minimum name + brand columns",
              },
            ].map((fmt) => (
              <div
                key={fmt.name}
                className="p-3 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)]"
              >
                <p className="text-[11px] font-bold text-[var(--text-primary)] mb-1">
                  {fmt.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                  {fmt.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                file && !uploading
                  ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:shadow-[0_0_20px_rgba(232,67,147,0.3)] text-white"
                  : "bg-[var(--bg-glass-border)] text-[var(--text-muted)] cursor-not-allowed"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Starting Import...
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  Upload & Import
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── Import History ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 border-t border-[var(--border-color)] pt-5"
          >
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <History size={14} className="text-[var(--accent)]" />
              Recent Imports
            </h3>
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)]"
                >
                  {h.status === "completed" ? (
                    <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                  ) : h.status === "failed" ? (
                    <XCircle size={14} className="text-red-400 shrink-0" />
                  ) : (
                    <Loader2 size={14} className="text-[var(--accent)] animate-spin shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {h.filename}
                      </span>
                      <FormatBadge format={h.format} />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {h.insertedRows.toLocaleString()} inserted
                      {h.skippedRows > 0 &&
                        ` / ${h.skippedRows.toLocaleString()} skipped`}
                      {h.errorRows > 0 &&
                        ` / ${h.errorRows.toLocaleString()} errors`}
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                    {formatDuration(h.createdAt, h.completedAt)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
