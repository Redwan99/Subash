import { Lock } from "lucide-react";

export function FeatureFallback({ featureName }: { featureName: string }) {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] glass shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <Lock size={36} className="text-[rgba(255,255,255,0.3)] drop-shadow-md" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
                Maintenance Mode
            </h1>
            <p className="text-[14px] text-[rgba(255,255,255,0.5)] max-w-md mx-auto leading-relaxed">
                The <strong className="text-white">{featureName}</strong> module is currently down for maintenance and platform polishing. Please check back later!
            </p>
        </div>
    );
}
