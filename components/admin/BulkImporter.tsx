"use client";
import { useState, useTransition } from "react";
import { importBulkPerfumes } from "@/lib/actions/admin";
import { UploadCloud, Loader2, CheckCircle } from "lucide-react";

export default function BulkImporter() {
  const [jsonInput, setJsonInput] = useState("");
  const [result, setResult] = useState<{
    success?: boolean;
    count?: number;
    error?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleImport = () => {
    setResult(null);
    startTransition(async () => {
      const res = await importBulkPerfumes(jsonInput);
      setResult(res);
      if (res.success) setJsonInput(""); // Clear on success
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-2xl">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-brand-500" /> Bulk Import (JSON)
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Paste a JSON array of perfumes containing <code className="text-brand-400">name</code>,{" "}
        <code className="text-brand-400">brand</code>,{" "}
        <code className="text-brand-400">image_url</code>, and{" "}
        <code className="text-brand-400">main_accords</code> (array).
      </p>

      <textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder='[{"name": "Aventus", "brand": "Creed", "image_url": "..."}]'
        aria-label="Paste JSON array of perfumes to import"
        className="w-full h-48 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-brand-300 font-mono focus:border-brand-500 outline-none mb-4"
      />

      <button
        onClick={handleImport}
        disabled={isPending || !jsonInput.trim()}
        aria-label="Run bulk import"
        className="bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Run Import"
        )}
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-xl text-sm ${
            result.success
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {result.success ? (
            <>
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Successfully imported {result.count} perfumes!
            </>
          ) : (
            `Error: ${result.error}`
          )}
        </div>
      )}
    </div>
  );
}
