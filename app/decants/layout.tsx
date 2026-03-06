import { getFeatureMap } from "@/lib/features";
import { redirect } from "next/navigation";

export default async function DecantsLayout({ children }: { children: React.ReactNode }) {
  const features = await getFeatureMap();
  if (features.ENABLE_DECANTS === false) redirect("/");
  return <>{children}</>;
}
