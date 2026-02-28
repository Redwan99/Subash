import { LayoutShell } from "@/components/layout/LayoutShell";
import { getFeatureMap } from "@/lib/features";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const featureToggles = await getFeatureMap();

    return (
        <LayoutShell featureToggles={featureToggles}>
            {children}
        </LayoutShell>
    );
}
