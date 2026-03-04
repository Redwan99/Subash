import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* pb-32 protects content from being hidden behind the floating bottom nav on mobile */}
            <div className="max-w-[1600px] mx-auto w-full flex justify-center px-4 sm:px-6 lg:px-8 pb-32 md:pb-6">
                {/* Hide on mobile/tablet, show on lg desktop */}
                <div className="hidden lg:block w-64 xl:w-72 shrink-0 py-6 pr-6">
                    <LeftSidebar />
                </div>

                <div className="flex-1 w-full py-6 min-h-screen animate-fade-in-up">{children}</div>

                {/* Hide on mobile/tablet/small desktop, show ONLY on xl Mac/PC */}
                <div className="hidden xl:block w-80 shrink-0 py-6 pl-6">
                    <RightSidebar />
                </div>
            </div>
            <MobileBottomNav />
        </>
    );
}
