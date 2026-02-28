"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { importPerfumesCsv } from "@/lib/actions/import";

export function CsvImporter() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        setResult(null);
        if (!selectedFile.name.endsWith(".csv")) {
            setResult({ success: false, message: "Please upload a valid .csv file." });
            setFile(null);
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await importPerfumesCsv(formData) as any;
            if (response?.error) {
                setResult({ success: false, message: response.error });
            } else if (response?.success) {
                setResult({ success: true, message: `Successfully imported ${response.count} perfumes.` });
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                throw new Error("Unknown error occurred");
            }
        } catch (err: any) {
            setResult({ success: false, message: err.message || "Failed to process the uploaded file." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[var(--bg-glass)] backdrop-blur-[12px] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.15)] flex items-center justify-center shrink-0">
                    <Database size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">CSV Import Engine</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Bulk upload perfumes via CSV format.</p>
                </div>
            </div>

            <div
                className={`relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${isDragging
                    ? "border-[var(--accent)] bg-[rgba(139,92,246,0.05)] shadow-[0_0_30px_rgba(139,92,246,0.15)] glow-pulse"
                    : file
                        ? "border-[#34D399]/50 bg-[#34D399]/5"
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

                {loading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 size={32} className="text-[var(--accent)] animate-spin mb-3" />
                        <span className="text-sm font-medium text-[var(--accent)] animate-pulse">Processing CSV...</span>
                    </div>
                ) : file ? (
                    <div className="flex flex-col items-center text-center">
                        <FileSpreadsheet size={36} className="text-[#34D399] mb-3" />
                        <span className="text-sm font-bold text-[var(--text-primary)]">{file.name}</span>
                        <span className="text-[11px] text-[var(--text-muted)] mt-1">{(file.size / 1024).toFixed(1)} KB</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                            className="mt-3 text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase font-bold tracking-wider"
                        >
                            Remove File
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center pointer-events-none">
                        <UploadCloud size={40} className="text-[var(--text-muted)] mb-4" />
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">Drag & Drop CSV or <span className="text-[var(--accent)] underline decoration-[rgba(139,92,246,0.4)] underline-offset-4">Click to Browse</span></span>
                        <span className="text-[11px] text-[var(--text-muted)] mt-2">Required columns: name, brand</span>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mt-4 p-4 rounded-lg flex items-start gap-3 border ${result.success
                            ? "bg-[#34D399]/10 border-[#34D399]/20"
                            : "bg-red-500/10 border-red-500/20"
                            }`}
                    >
                        {result.success ? (
                            <CheckCircle2 size={18} className="text-[#34D399] shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                        )}
                        <p className={`text-sm ${result.success ? "text-[#34D399]" : "text-red-400"}`}>
                            {result.message}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${file && !loading
                        ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white"
                        : "bg-[var(--bg-glass-border)] text-[var(--text-muted)] cursor-not-allowed"
                        }`}
                >
                    {loading ? "Importing..." : "Upload & Process"}
                </button>
            </div>
        </div>
    );
}
