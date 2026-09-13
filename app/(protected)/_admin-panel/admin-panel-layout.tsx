"use client";
import { cn } from "@/lib/utils";
import { useStore } from "@/hooks/use-store";
import { Footer } from "./footer";
import { Sidebar } from "./sidebar";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { Navbar } from "./navbar";
import { WelcomeTour } from "./welcome-tour";






export default function AdminPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const sidebar = useStore(useSidebarToggle, (state) => state);

  if (!sidebar) return null;

  return (
    <>
      {/* FEAT-1: first-login guided tour (auto-starts once; replayable via navbar help button) */}
      <WelcomeTour />
      <Sidebar />
      <main
        className={cn(
          "min-h-[calc(100vh_-_56px)] bg-background transition-[margin-left] ease-in-out duration-300",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72"
        )}
      >
        {children}
      </main>
      <footer
        className={cn(
          "transition-[margin-left] ease-in-out duration-300",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72"
        )}
      >
        <Footer />
      </footer>
    </>
  );
}
