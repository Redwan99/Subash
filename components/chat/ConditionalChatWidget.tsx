"use client";

import { useFeatureToggles } from "@/components/providers/FeatureToggleProvider";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget").then((m) => ({ default: m.ChatWidget })),
  { ssr: false }
);

export function ConditionalChatWidget() {
  const { isEnabled } = useFeatureToggles();
  if (!isEnabled("ENABLE_AI_BOT")) return null;
  return <ChatWidget />;
}
