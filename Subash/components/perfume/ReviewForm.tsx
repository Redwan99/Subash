"use client";
// components/perfume/ReviewForm.tsx
// Phase 4.4 — Review Submission Form
//   · Session-gated (shows CTA if not signed in)
//   · Framer Motion sliders for Longevity + Sillage
//   · Toggle chips for Season + Time
//   · Calls submitReview server action

import { useState, useRef, useCallback } from "react";
import { motion, useReducedMotion, PanInfo } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Send, Star, LogIn, CheckCircle, AlertCircle } from "lucide-react";
import { submitReview, type ReviewFormState } from "@/lib/actions/perfume";

// ─── Types ────────────────────────────────────────────────────────────────────

type WeatherTag = "HOT" | "MILD" | "COLD" | "HUMID" | "DRY" | "RAINY";
type TimeTag = "DAY" | "NIGHT" | "BOTH";

const WEATHER_CONDITIONS: { value: WeatherTag; label: string; emoji: string; desc: string }[] = [
  { value: "HOT",   label: "Hot",   emoji: "☀️",  desc: "> 28°C"       },
  { value: "MILD",  label: "Mild",  emoji: "⛅",   desc: "15–28°C"      },
  { value: "COLD",  label: "Cold",  emoji: "❄️",  desc: "< 15°C"       },
  { value: "HUMID", label: "Humid", emoji: "💧",  desc: "Humidity > 70%" },
  { value: "DRY",   label: "Dry",   emoji: "🏜️",  desc: "Humidity < 40%" },
  { value: "RAINY", label: "Rainy", emoji: "🌧️",  desc: "Rain / Drizzle" },
];

const TIMES: { value: TimeTag; label: string; emoji: string }[] = [
  { value: "DAY",   label: "Day",       emoji: "🌤️" },
  { value: "NIGHT", label: "Night",     emoji: "🌙" },
  { value: "BOTH",  label: "Anytime",   emoji: "⚡" },
];

const LONGEVITY_LABELS = ["", "Very Weak", "Weak", "Moderate", "Strong", "Eternal"];
const SILLAGE_LABELS   = ["", "Intimate", "Soft", "Moderate", "Strong", "Enormous"];

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1" role="group" aria-label="Overall rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${star} stars`}
        >
          <Star
            size={24}
            fill={(hover || value) >= star ? "currentColor" : "none"}
            className={`transition-colors duration-150 ${
              (hover || value) >= star
                ? "text-[var(--accent)]"
                : "text-[var(--border-color)]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Liquid Slider ────────────────────────────────────────────────────────────

function LiquidSlider({
  label,
  sublabel,
  value,
  onChange,
  labelMap,
  valueClass,
  barClass,
  knobClass,
}: {
  label: string;
  sublabel: string;
  value: number; // 1–5
  onChange: (v: number) => void;
  labelMap: string[];
  valueClass: string;
  barClass: string;
  knobClass: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const calcValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newVal = Math.round(pct * 4) + 1; // maps 0..1 → 1..5
    onChange(newVal);
  }, [onChange]);

  const handleDrag = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    calcValue(info.point.x);
  };

  const pct = ((value - 1) / 4) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {label}
          </span>
          <span className="text-xs ml-2 text-[var(--text-muted)]">
            {sublabel}
          </span>
        </div>
        <span className={`text-sm font-bold ${valueClass}`}>
          {value}/5 — {labelMap[value]}
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-4 rounded-full cursor-pointer select-none bg-[var(--border-color)]"
        onClick={(e) => calcValue(e.clientX)}
      >
        {/* Fill */}
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26 }}
          className={`absolute left-0 top-0 h-full rounded-full min-w-4 ${barClass}`}
        />

        {/* Draggable knob */}
        <motion.div
          drag="x"
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          onDrag={handleDrag}
          animate={{ left: `calc(${pct}% - 10px)` }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26 }}
          whileDrag={{ scale: 1.25 }}
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing border-2 border-white ${knobClass}`}
          aria-label={`${label}: ${value}`}
          role="slider"
          aria-valuenow={value}
          aria-valuemin={1}
          aria-valuemax={5}
        />
      </div>

      {/* Step markers */}
      <div className="flex justify-between mt-1 px-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className="text-[9px] text-[var(--text-muted)]">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Toggle Chip ──────────────────────────────────────────────────────────────

function ToggleChip({
  label,
  emoji,
  active,
  onToggle,
  shouldReduceMotion,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onToggle: () => void;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer select-none border transition-colors duration-150 ${
        active
          ? "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[var(--accent)]"
          : "bg-[var(--border-color)] border-transparent text-[var(--text-muted)]"
      }`}
      aria-pressed={active}
    >
      <span>{emoji}</span>
      {label}
    </motion.button>
  );
}

// ─── Sign-in CTA ──────────────────────────────────────────────────────────────

function SignInCTA() {
  return (
    <div className="rounded-2xl p-6 text-center bg-[var(--bg-glass)] backdrop-blur-[10px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
      <LogIn size={28} className="mx-auto mb-3 text-[var(--accent)]" />
      <h3 className="text-base font-bold mb-1 text-[var(--text-primary)]">
        Share Your Impression
      </h3>
      <p className="text-sm mb-4 text-[var(--text-muted)]">
        Sign in to leave a review for this fragrance.
      </p>
      <Link href="/auth/signin">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] text-white"
        >
          <LogIn size={15} />
          Sign In to Review
        </motion.div>
      </Link>
    </div>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────

export function ReviewForm({ perfumeId }: { perfumeId: string }) {
  const { data: session }   = useSession();
  const shouldReduceMotion  = useReducedMotion();

  const [text,     setText]     = useState("");
  const [rating,   setRating]   = useState(3);
  const [longevity, setLongevity] = useState(3);
  const [sillage,  setSillage]  = useState(3);
  const [weatherTags, setWeatherTags] = useState<WeatherTag[]>([]);
  const [times,    setTimes]    = useState<TimeTag[]>([]);
  const [state,    setState]    = useState<ReviewFormState | null>(null);
  const [loading,  setLoading]  = useState(false);

  if (!session?.user) return <SignInCTA />;

  const toggleWeather = (w: WeatherTag) =>
    setWeatherTags((prev) => prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]);

  const toggleTime = (t: TimeTag) =>
    setTimes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await submitReview({
      perfumeId,
      text,
      overall_rating: rating,
      longevity_score: longevity,
      sillage_score: sillage,
      time_tags: times,
      weather_tags: weatherTags,
    });
    setState(result);
    setLoading(false);
    if (result.success) {
      setText(""); setRating(3); setLongevity(3); setSillage(3);
      setWeatherTags([]); setTimes([]);
    }
  };

  return (
    <div className="rounded-2xl p-6 bg-[var(--bg-glass)] backdrop-blur-[10px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
      <h2 className="text-lg font-bold mb-5 text-[var(--text-primary)]">
        Write a Review
      </h2>

      {/* Status feedback */}
      {state && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-2 p-3 rounded-xl mb-5 text-sm border ${
            state.success
              ? "bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]"
              : "bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]"
          }`}
        >
          {state.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{state.success ? "Review submitted! Thank you." : state.error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall rating */}
        <div>
          <label className="text-sm font-semibold block mb-2 text-[var(--text-secondary)]">
            Overall Rating
          </label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* Text area */}
        <div>
          <label className="text-sm font-semibold block mb-2 text-[var(--text-secondary)]">
            Your Thoughts
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe the fragrance, how it wore on your skin, occasions you'd suggest it for…"
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] caret-[var(--accent)] transition-colors focus:border-[rgba(139,92,246,0.5)]"
            required
            minLength={10}
          />
          {state?.fieldErrors?.text && (
            <p className="text-xs mt-1 text-[#EF4444]">
              {state.fieldErrors.text[0]}
            </p>
          )}
        </div>

        {/* Longevity slider */}
        <LiquidSlider
          label="Longevity"
          sublabel="How long does it last?"
          value={longevity}
          onChange={setLongevity}
          labelMap={LONGEVITY_LABELS}
          valueClass="text-[#F59E0B]"
          barClass="bg-[linear-gradient(90deg,rgba(245,158,11,0.5),#F59E0B)] shadow-[0_0_10px_rgba(245,158,11,0.35)]"
          knobClass="bg-[#F59E0B] shadow-[0_2px_8px_rgba(245,158,11,0.55)]"
        />

        {/* Sillage slider */}
        <LiquidSlider
          label="Sillage"
          sublabel="How far does it project?"
          value={sillage}
          onChange={setSillage}
          labelMap={SILLAGE_LABELS}
          valueClass="text-[#A78BFA]"
          barClass="bg-[linear-gradient(90deg,rgba(167,139,250,0.5),#A78BFA)] shadow-[0_0_10px_rgba(167,139,250,0.35)]"
          knobClass="bg-[#A78BFA] shadow-[0_2px_8px_rgba(167,139,250,0.55)]"
        />

        {/* Weather chips */}
        <div>
          <label className="text-sm font-semibold block mb-2 text-[var(--text-secondary)]">
            Best Weather to Wear
          </label>
          <div className="flex flex-wrap gap-2">
            {WEATHER_CONDITIONS.map(({ value, label, emoji, desc }) => (
              <motion.button
                key={value}
                type="button"
                onClick={() => toggleWeather(value)}
                whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                title={desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer select-none border transition-all duration-150 ${
                  weatherTags.includes(value)
                    ? "bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)] shadow-[0_0_8px_var(--accent-glow,rgba(139,92,246,0.25))]"
                    : "bg-[var(--border-color)] border-transparent text-[var(--text-muted)] hover:border-[var(--accent)]/30"
                }`}
                aria-pressed={weatherTags.includes(value)}
              >
                <span>{emoji}</span>
                {label}
                <span className="text-[10px] opacity-60 ml-0.5">{desc}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time chips */}
        <div>
          <label className="text-sm font-semibold block mb-2 text-[var(--text-secondary)]">
            Best Time of Day
          </label>
          <div className="flex flex-wrap gap-2">
            {TIMES.map(({ value, label, emoji }) => (
              <ToggleChip
                key={value}
                label={label}
                emoji={emoji}
                active={times.includes(value)}
                onToggle={() => toggleTime(value)}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading || text.trim().length < 10}
          whileHover={shouldReduceMotion || loading ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion  || loading ? {} : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
            loading
              ? "bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed"
              : "bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] text-white"
          }`}
        >
          <Send size={15} />
          {loading ? "Submitting…" : "Submit Review"}
        </motion.button>
      </form>
    </div>
  );
}
