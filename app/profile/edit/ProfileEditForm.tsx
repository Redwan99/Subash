"use client";
// app/profile/edit/ProfileEditForm.tsx
// Client form to update name and bio with server action.

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, Save } from "lucide-react";
import { updateProfile, type UpdateProfileState } from "@/lib/actions/profile";

const initialState: UpdateProfileState = { success: false };

export function ProfileEditForm({
  initialName,
  initialBio,
}: {
  initialName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  useEffect(() => {
    if (state.success) {
      setTimeout(() => router.push("/profile"), 1200);
    }
  }, [state.success, router]);

  return (
    <form
      action={formAction}
      className="rounded-2xl p-5 bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] space-y-4"
    >
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]"
        >
          Display Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialName}
          maxLength={60}
          required
          className={`w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] ${
            state.fieldErrors?.name
              ? "border-[#EF4444]"
              : "border-[var(--border-color)] focus:border-[#8B5CF6]/50"
          }`}
          placeholder="Your display name"
        />
        {state.fieldErrors?.name && (
          <p className="text-xs mt-1 text-[#EF4444]">{state.fieldErrors.name}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]"
        >
          Bio (optional)
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={initialBio}
          maxLength={200}
          className={`w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border outline-none transition-colors resize-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] ${
            state.fieldErrors?.bio
              ? "border-[#EF4444]"
              : "border-[var(--border-color)] focus:border-[#8B5CF6]/50"
          }`}
          placeholder="Tell the community about your fragrance journey…"
        />
        {state.fieldErrors?.bio && (
          <p className="text-xs mt-1 text-[#EF4444]">{state.fieldErrors.bio}</p>
        )}
      </div>

      {/* Error banner */}
      {!state.success && state.error && !state.fieldErrors && (
        <p className="text-xs px-3 py-2 rounded-xl text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/25">
          {state.error}
        </p>
      )}

      {/* Success banner */}
      {state.success && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#34D399]/10 border border-[#34D399]/25 text-[#34D399] text-sm">
          <CheckCircle size={14} /> Profile updated! Redirecting…
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] shadow-[0_4px_14px_rgba(139,92,246,0.3)]"
      >
        {isPending ? (
          <><Loader2 size={14} className="animate-spin" /> Saving…</>
        ) : (
          <><Save size={14} /> Save Changes</>
        )}
      </button>
    </form>
  );
}
