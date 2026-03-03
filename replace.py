import sys

with open('app/(main)/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

start = c.find('<div className="lg:col-span-2 space-y-4">')
end = c.find('<div className="space-y-4">', start)

if start != -1 and end != -1:
    new_c = c[:start] + '<HomeFeedSection trendingPerfumes={trendingPerfumes} followingFeed={followingFeed} hasUser={!!session?.user?.id} />\n\n        ' + c[end:]
    with open('app/(main)/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_c)
    print("Replaced successfully")
else:
    print("Tags not found")
