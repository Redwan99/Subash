"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, X, Loader2 } from "lucide-react";
import { createFragramPost } from "@/lib/actions/fragram";
import { SmartSearch } from "@/components/ui/SmartSearch";

export default function FragramCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [perfumeId, setPerfumeId] = useState<string | null>(null);
  const [perfumeName, setPerfumeName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }
    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const clearImage = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!file) {
      setError("Please select an image.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("image", file);
      if (caption.trim()) formData.append("caption", caption.trim());
      if (perfumeId) formData.append("perfumeId", perfumeId);

      const result = await createFragramPost(formData);
      if (result.success) {
        router.push("/fragram");
        router.refresh();
      } else {
        setError(result.error || "Failed to create post. Please try again.");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 animate-fade-in-up">
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">
        New Fragram Post
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Share a beautiful fragrance photo with the community.
      </p>

      {/* Image Upload */}
      <div className="mb-6">
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="relative w-full aspect-[3/4]">
              <Image src={preview} alt="Preview" fill className="object-cover" />
            </div>
            <button
              onClick={clearImage}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[3/4] max-h-[400px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 flex flex-col items-center justify-center gap-3 hover:border-brand-400 hover:bg-brand-500/5 transition-colors cursor-pointer"
          >
            <Camera size={40} className="text-gray-400" />
            <span className="text-sm text-gray-500">Tap to select a photo</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Caption */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Caption (optional)
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Describe the vibe..."
          maxLength={500}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
        />
      </div>

      {/* Perfume Tag */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tag a perfume (optional)
        </label>
        {perfumeName ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-500/30 bg-brand-500/5">
            <span className="text-sm text-gray-900 dark:text-white font-medium flex-1">{perfumeName}</span>
            <button
              onClick={() => { setPerfumeId(null); setPerfumeName(null); }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <SmartSearch
            id="fragram-perfume-search"
            className="h-12 px-4 text-sm"
            autoNavigate={false}
            onSelectResult={(item) => {
              setPerfumeId(item.id);
              setPerfumeName(item.name);
            }}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!file || isPending}
        className="w-full h-12 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Posting...
          </>
        ) : (
          "Post to Fragram"
        )}
      </button>
    </div>
  );
}
