// app/perfume/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfume = await prisma.perfume.findUnique({
    where: { slug: id },
    select: { name: true, brand: true, image_url: true },
  });

  const name = perfume?.name ?? "Subash Fragrance";
  const brand = perfume?.brand ?? "Bangladesh's Fragrance Community";
  const imageUrl = perfume?.image_url ?? "";

  return new ImageResponse(
    (
      <div tw="w-full h-full flex flex-col justify-between p-12 text-[#E6EDF3] bg-[linear-gradient(135deg,#0D1117_0%,#1C2333_45%,#0D1117_100%)]">
        <div tw="flex items-center justify-between">
          <div tw="text-[28px] font-bold tracking-[1px]">Subash</div>
          <div tw="px-3.5 py-2 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/35 text-[#C7B7FF] text-sm font-semibold">
            See BD Prices & Reviews
          </div>
        </div>

        <div tw="flex items-center gap-8">
          <div tw="w-[260px] h-[360px] rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={name} tw="w-full h-full object-contain" />
            ) : (
              <div tw="text-[64px]">🧴</div>
            )}
          </div>

          <div tw="flex-1">
            <div tw="text-[18px] text-[#C7B7FF] font-semibold mb-2.5">{brand}</div>
            <div tw="text-[52px] font-bold leading-[1.1]">{name}</div>
            <div tw="mt-4 text-[16px] text-[#9AA4B2]">
              Bangladesh&apos;s fragrance community — discover, review, and buy authentic perfumes.
            </div>
          </div>
        </div>

        <div tw="flex items-center justify-between text-[14px] text-[#9AA4B2]">
          <div>subash.com.bd</div>
          <div>Share to Facebook groups</div>
        </div>
      </div>
    ),
    size
  );
}
