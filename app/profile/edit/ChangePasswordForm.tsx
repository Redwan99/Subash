"use client";
// app/profile/edit/ChangePasswordForm.tsx
// Client form to change password with current password verification.

import { useState } from "react";
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { changePassword, type ChangePasswordState } from "@/lib/actions/profile";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<ChangePasswordState | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setState({ success: false, error: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setState({ success: false, error: "New password must be at least 8 characters." });
      return;
    }
    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setState(result);
    setLoading(false);
    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] space-y-4"
    >
      {/* Feedback */}
      {state && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
            state.success
              ? "bg-[#F783AC]/15 border-[#F783AC]/30 text-[#F783AC]"
              : "bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]"
          }`}
        >
          {state.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span>{state.success ? "Password changed successfully." : state.error}</span>
        </div>
      )}

      {/* Current password */}
      <div>
        <label
          htmlFor="currentPassword"
          className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]"
        >
          Current Password
        </label>
        <div className="relative">
          <input
            id="currentPassword"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] focus:border-[#E84393]/50"
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div>
        <label
          htmlFor="newPassword"
          className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] focus:border-[#E84393]/50"
            placeholder="Minimum 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Confirm new password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]"
        >
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] focus:border-[#E84393]/50"
          placeholder="Re-enter new password"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
          loading
            ? "bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed"
            : "bg-[linear-gradient(135deg,#D6336C,#E84393)] text-black shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
        }`}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Lock size={14} />
        )}
        {loading ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}
