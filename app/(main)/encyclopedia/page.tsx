import EncyclopediaMatrix from "@/components/encyclopedia/EncyclopediaMatrix";
import { searchEncyclopedia } from "@/lib/actions/encyclopedia";

export const revalidate = 3600; // Cache the initial load

export default async function EncyclopediaPage() {
  const initialData = await searchEncyclopedia({ sort: 'trending' });

  return (
    <div className="w-full max-w-[1600px] mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">Fragrance Matrix</h1>
        <p className="text-gray-500">Discover your signature scent using our advanced database filters.</p>
      </div>

      <EncyclopediaMatrix initialData={initialData} />
    </div>
  );
}