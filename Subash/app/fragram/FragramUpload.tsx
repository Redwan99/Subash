"use client";
// app/fragram/FragramUpload.tsx

import { useEffect, useMemo, useState, useActionState } from "react";
import { SmartSearch } from "@/components/ui/SmartSearch";
import { createFragramPost, type FragramFormState } from "@/lib/actions/fragram";
import { X, UploadCloud } from "lucide-react";
import Link from "next/link";

const initialState: FragramFormState = { success: false };

export function FragramUpload({
  isAuthed,
  callbackUrl,
}: {
  isAuthed: boolean;
  callbackUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: string; name: string; brand: string } | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [state, formAction] = useActionState(createFragramPost, initialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setSelected(null);
      setUploadedUrl("");
    }
  }, [state.success]);

  const errorList = useMemo(() => {
    const errs: string[] = [];
    if (state.error) errs.push(state.error);
    if (state.fieldErrors) {
      Object.values(state.fieldErrors).forEach((arr) => arr?.forEach((msg) => errs.push(msg)));
    }
    return errs;
  }, [state.error, state.fieldErrors]);

  if (!isAuthed) {
    return (
      <Link
        href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)] text-white"
      >
        <UploadCloud size={16} />
        Sign in to upload
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)] text-white"
      >
        <UploadCloud size={16} />
        Upload SOTD
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[rgba(0,0,0,0.45)]"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-3xl p-6 md:p-7 bg-[var(--bg-glass)] backdrop-blur-[20px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  Fragram Upload
                </p>
                <h3 className="text-lg font-display font-semibold text-[var(--text-primary)]">
                  Share your Scent of the Day
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full bg-[var(--border-color)] text-[var(--text-muted)]"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            <form action={formAction} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Perfume
                </label>
                <SmartSearch
                  onSelectResult={(result) => setSelected({ id: result.id, name: result.name, brand: result.brand })}
                  placeholder="Search and select a perfume"
                  autoNavigate={false}
                />
                <input type="hidden" name="perfumeId" value={selected?.id ?? ""} />
                {selected && (
                  <div className="mt-2 text-xs text-[var(--accent)]">
                    Selected: {selected.name} · {selected.brand}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);

                    try {
                      // Optionally show a loading state here
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.success) {
                        setUploadedUrl(data.url);
                      } else {
                        alert(data.error || "Upload failed");
                      }
                    } catch (err) {
                      alert("Upload failed");
                    }
                  }}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl text-sm outline-none bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#8B5CF6]/10 file:text-[#8B5CF6] hover:file:bg-[#8B5CF6]/20"
                />
                <input type="hidden" name="imageUrl" value={uploadedUrl} />
                {uploadedUrl && (
                  <div className="mt-2 text-xs text-[#34D399]">
                    Photo uploaded successfully!
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Caption (optional)
                </label>
                <textarea
                  name="caption"
                  rows={3}
                  placeholder="What are you wearing today?"
                  className="w-full mt-2 px-4 py-2.5 rounded-xl text-sm outline-none bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)]"
                />
              </div>

              {errorList.length > 0 && (
                <div className="text-xs text-[#EF4444]">
                  {errorList.map((msg, idx) => (
                    <div key={idx}>{msg}</div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)] text-white"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
