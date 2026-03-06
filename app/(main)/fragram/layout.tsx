import { getFeatureMap } from "@/lib/features";
import { redirect } from "next/navigation";

export default async function FragramLayout({ children }: { children: React.ReactNode }) {
  const features = await getFeatureMap();
  if (features.ENABLE_FRAGRAM === false) redirect("/");
  return <>{children}</>;
}
