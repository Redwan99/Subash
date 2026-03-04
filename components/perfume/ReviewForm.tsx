"use client";
// components/perfume/ReviewForm.tsx
// Phase 4.4 — Review Submission Form
//   - Session-gated (shows CTA if not signed in)
//   - Framer Motion sliders for Longevity + Sillage
//   - Toggle chips for Season + Time
//   - Calls submitReview server action

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Send, Star, LogIn, CheckCircle, AlertCircle, Briefcase, GlassWater,
  Heart, Coffee, ShieldCheck, Gem, Frown,
  Sun, Cloud, Snowflake, Droplets, Wind, CloudRain,
  Sunrise, SunMedium, Sunset, Moon, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { submitReview, type ReviewFormState } from "@/lib/actions/perfume";
import { BotShield } from "@/components/ui/BotShield";

// --- Types --------------------------------------------------------------------

type WeatherTag = "HOT" | "MILD" | "COLD" | "HUMID" | "DRY" | "RAINY";
type TimeTag = "morning" | "day" | "evening" | "night" | "anytime" | "both";

const WEATHER_CONDITIONS: { value: WeatherTag; label: string; icon: LucideIcon; desc: string }[] = [
  { value: "HOT", label: "Hot", icon: Sun, desc: "> 28\u00B0C" },
  { value: "MILD", label: "Mild", icon: Cloud, desc: "15\u201328\u00B0C" },
  { value: "COLD", label: "Cold", icon: Snowflake, desc: "< 15\u00B0C" },
  { value: "HUMID", label: "Humid", icon: Droplets, desc: "Humidity > 70%" },
  { value: "DRY", label: "Dry", icon: Wind, desc: "Humidity < 40%" },
  { value: "RAINY", label: "Rainy", icon: CloudRain, desc: "Rain / Drizzle" },
];

const TIME_OPTIONS: { value: TimeTag; label: string; icon: LucideIcon }[] = [
  { value: "morning", label: "Morning", icon: Sunrise },
  { value: "day", label: "Day", icon: SunMedium },
  { value: "evening", label: "Evening", icon: Sunset },
  { value: "night", label: "Night", icon: Moon },
  { value: "anytime", label: "Anytime", icon: Zap },
];

const LONGEVITY_LABELS = ["", "Fades in mins", "Under 2h", "2-3h", "3-4h", "4-5h", "5-6h", "6-8h", "8-12h", "12h+", "Eternal"];
const SILLAGE_LABELS = ["", "On skin only", "Intimate", "Personal", "Noticeable", "Soft aura", "Moderate", "Filling room", "Heavy", "Enormous", "Nuclear"];
const MAX_REVIEW_LENGTH = 800;

// --- Star Rating --------------------------------------------------------------

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
          className="transition-transform duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        >
          <Star
            size={24}
            fill={(hover || value) >= star ? "currentColor" : "none"}
            className={`transition-colors duration-150 ${(hover || value) >= star
              ? "text-[var(--accent)]"
              : "text-[var(--border-color)]"
              }`}
          />
        </button>
      ))}
    </div>
  );
}

// --- Range Slider ------------------------------------------------------------

const rangeThumbStyles = [
  "[&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:w-5",
  "[&::-webkit-slider-thumb]:h-5",
  "[&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:border-2",
  "[&::-webkit-slider-thumb]:border-white",
  "[&::-webkit-slider-thumb]:shadow-md",
  "[&::-webkit-slider-thumb]:cursor-grab",
  "[&::-webkit-slider-thumb]:active:cursor-grabbing",
  "[&::-webkit-slider-thumb]:transition-shadow",
  "[&::-webkit-slider-thumb]:hover:shadow-lg",
  "[&::-moz-range-thumb]:w-5",
  "[&::-moz-range-thumb]:h-5",
  "[&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:border-2",
  "[&::-moz-range-thumb]:border-white",
  "[&::-moz-range-thumb]:shadow-md",
  "[&::-moz-range-thumb]:cursor-grab",
  "[&::-moz-range-thumb]:active:cursor-grabbing",
].join(" ");

function RangeSlider({
  label,
  sublabel,
  value,
  onChange,
  min = 1,
  max = 10,
  labelMap,
  accentColor = "#E84393",
}: {
  label: string;
  sublabel: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  labelMap: string[];
  accentColor?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

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
        <span className="text-sm font-bold" style={{ color: accentColor }}>
          {value}/{max} · {labelMap[value]}
        </span>
      </div>

      {/* Native range input with gradient fill */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`${label}: ${value}`}
          className={`w-full h-3 rounded-full appearance-none cursor-pointer outline-none transition-shadow review-range-slider ${rangeThumbStyles}`}
          style={{
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, var(--border-color) ${pct}%, var(--border-color) 100%)`,
            ["--slider-accent" as string]: accentColor,
          }}
        />
      </div>

      {/* Step markers */}
      <div className="flex justify-between mt-1 px-0.5">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((s) => (
          <span
            key={s}
            className={`text-[9px] transition-colors ${
              s <= value ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
            }`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Toggle Chip --------------------------------------------------------------

function ToggleChip({
  label,
  icon: Icon,
  active,
  onToggle,
  shouldReduceMotion,
}: {
  label: string;
  icon: LucideIcon;
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer select-none border transition-colors duration-150 ${active
        ? "bg-brand-500/20 border-brand-500/40 text-brand-400"
        : "bg-[var(--border-color)] border-transparent text-[var(--text-muted)]"
        }`}
      aria-pressed={active}
    >
      <Icon className="w-4 h-4" />
      {label}
    </motion.button>
  );
}

// --- Sign-in CTA --------------------------------------------------------------

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
      <Link href="/login">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-[linear-gradient(135deg,#D6336C,#E84393)] text-black shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
        >
          <LogIn size={15} />
          Sign In to Review
        </motion.div>
      </Link>
    </div>
  );
}

// --- Review Form --------------------------------------------------------------

export function ReviewForm({
  perfumeId,
  onSubmitted,
}: {
  perfumeId: string;
  onSubmitted?: () => void;
}) {
  const { data: session } = useSession();
  const shouldReduceMotion = useReducedMotion();

  const [text, setText] = useState("");
  const [rating, setRating] = useState(3);
  const [longevity, setLongevity] = useState(5);
  const [sillage, setSillage] = useState(5);
  const [weatherTags, setWeatherTags] = useState<WeatherTag[]>([]);
  const [times, setTimes] = useState<TimeTag[]>([]);
  const [genderLeaning, setGenderLeaning] = useState<number>(3);
  const [occasion, setOccasion] = useState<string>("");
  const [valueRating, setValueRating] = useState<number>(2);
  const [blindBuySafe, setBlindBuySafe] = useState<boolean>(true);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [state, setState] = useState<ReviewFormState | null>(null);
  const [loading, setLoading] = useState(false);

  if (!session?.user) return <SignInCTA />;

  const toggleWeather = (w: WeatherTag) =>
    setWeatherTags((prev) => prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]);

  const toggleTime = (t: TimeTag) =>
    setTimes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedTimes = times.map((t) => t.toUpperCase()) as Array<
      "MORNING" | "DAY" | "EVENING" | "NIGHT" | "ANYTIME" | "BOTH"
    >;

    const result = await submitReview({
      perfumeId,
      text,
      overall_rating: rating,
      longevity_score: longevity,
      sillage_score: sillage,
      time_tags: normalizedTimes,
      weather_tags: weatherTags,
      genderLeaning,
      occasion: occasion || null,
      valueRating,
      blindBuySafe,
      turnstileToken,
    });
    setState(result);
    setLoading(false);
    if (result.success) {
      setText(""); setRating(3); setLongevity(5); setSillage(5);
      setWeatherTags([]); setTimes([]); setTurnstileToken("");
      onSubmitted?.();
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
          className={`flex items-start gap-2 p-3 rounded-xl mb-5 text-sm border ${state.success
            ? "bg-[#F783AC]/15 border-[#F783AC]/30 text-[#F783AC]"
            : "bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]"
            }`}
        >
          {state.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{state.success ? "Review submitted! Thank you." : state.error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-6">
        {/* Overall rating */}
        <div>
          <label className="text-sm font-semibold block mb-2 text-[var(--text-secondary)]">
            Overall Rating
          </label>
            <p className="text-xs mb-2 text-[var(--text-muted)]">
              Tap to rate from 1 (dislike) to 5 (love).
            </p>
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
            placeholder="Describe the fragrance, how it wore on your skin, occasions you'd suggest it for..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] caret-[var(--accent)] transition-colors focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
            required
            minLength={10}
            maxLength={MAX_REVIEW_LENGTH}
          />
          <div className="mt-1 flex items-center justify-between text-[11px]">
            {state?.fieldErrors?.text && (
              <p className="text-[#EF4444]">
                {state.fieldErrors.text[0]}
              </p>
            )}
            <span className="ml-auto text-[var(--text-muted)]">
              {text.length}/{MAX_REVIEW_LENGTH} characters
            </span>
          </div>
        </div>

        {/* Longevity slider */}
        <RangeSlider
          label="Longevity"
          sublabel="How long does it last?"
          value={longevity}
          onChange={setLongevity}
          labelMap={LONGEVITY_LABELS}
          accentColor="#E84393"
        />

        {/* Sillage slider */}
        <RangeSlider
          label="Sillage"
          sublabel="How far does it project?"
          value={sillage}
          onChange={setSillage}
          labelMap={SILLAGE_LABELS}
          accentColor="#F783AC"
        />
        </div>

        <div className="space-y-6">
        {/* Weather chips */}
        <div>
          <label className="text-sm font-semibold block mb-2 text-[var(--text-secondary)]">
            Best Weather to Wear
          </label>
          <div className="flex flex-wrap gap-2">
            {WEATHER_CONDITIONS.map(({ value, label, icon: Icon, desc }) => (
              <motion.button
                key={value}
                type="button"
                onClick={() => toggleWeather(value)}
                whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                title={desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer select-none border transition-all duration-150 ${weatherTags.includes(value)
                  ? "bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)] shadow-[0_0_8px_var(--accent-glow,rgba(232,67,147,0.25))]"
                  : "bg-[var(--border-color)] border-transparent text-[var(--text-muted)] hover:border-[var(--accent)]/30"
                  }`}
                aria-pressed={weatherTags.includes(value)}
              >
                <Icon className="w-4 h-4" />
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
            {TIME_OPTIONS.map(({ value, label, icon }) => (
              <ToggleChip
                key={value}
                label={label}
                icon={icon}
                active={times.includes(value)}
                onToggle={() => toggleTime(value)}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
          </div>
        </div>

        {/* 1. Gender Leaning */}
        <RangeSlider
          label="Gender Leaning"
          sublabel="How does it actually smell?"
          value={genderLeaning}
          onChange={setGenderLeaning}
          min={1}
          max={5}
          labelMap={["", "Very Masculine", "Leans Masculine", "True Unisex", "Leans Feminine", "Very Feminine"]}
          accentColor="#E84393"
        />

        {/* 2. Occasion Pills */}
        <div>
          <label className="text-sm font-semibold text-[var(--text-secondary)]">Best Occasion</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { id: "office", label: "Office/Work", icon: Briefcase },
              { id: "date", label: "Date Night", icon: Heart },
              { id: "casual", label: "Casual/Daily", icon: Coffee },
              { id: "formal", label: "Formal/Event", icon: GlassWater },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setOccasion(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                  occasion === opt.id
                    ? "bg-brand-500/10 border-brand-500 text-brand-500"
                    : "border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <opt.icon className="w-4 h-4" /> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Value & Blind Buy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-[var(--text-secondary)]">Value for Money</label>
            <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl mt-2 border border-[var(--border-color)]">
              {[
                { val: 1, label: "Overpriced", icon: Frown },
                { val: 2, label: "Fair", icon: ShieldCheck },
                { val: 3, label: "A Steal!", icon: Gem },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setValueRating(opt.val)}
                  className={`flex-1 flex flex-col items-center py-2 rounded-lg text-xs font-medium transition-all ${
                    valueRating === opt.val
                      ? "bg-brand-500 text-white shadow-md"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <opt.icon className="w-4 h-4 mb-1" /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--text-secondary)]">Blind Buy Safe?</label>
            <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl mt-2 border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setBlindBuySafe(true)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  blindBuySafe ? "bg-brand-500 text-white shadow-md" : "text-[var(--text-muted)]"
                }`}
              >
                Yes, safe
              </button>
              <button
                type="button"
                onClick={() => setBlindBuySafe(false)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  !blindBuySafe ? "bg-red-500 text-white shadow-md" : "text-[var(--text-muted)]"
                }`}
              >
                No, sample first
              </button>
            </div>
          </div>
        </div>
        </div>
        </div>

        <div className="mt-6 space-y-4">
        <BotShield onVerify={setTurnstileToken} />

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={!turnstileToken || loading || text.trim().length < 10}
          whileHover={shouldReduceMotion || !turnstileToken || loading ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion || !turnstileToken || loading ? {} : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${loading
            ? "bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed"
            : "bg-[linear-gradient(135deg,#D6336C,#E84393)] text-black shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
            }`}
        >
          <Send size={15} />
          {loading ? "Submitting..." : "Submit Review"}
        </motion.button>
        <p className="text-center text-[11px] text-[var(--text-muted)]">
          {!turnstileToken
            ? "Complete the bot check above to enable submit."
            : text.trim().length < 10
            ? "Write at least 10 characters to share a helpful review."
            : "Thank you for sharing an honest, helpful review."}
        </p>
        </div>
      </form>
    </div>
  );
}

