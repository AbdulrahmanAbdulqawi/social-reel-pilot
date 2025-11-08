import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function MobileSidebarTrigger() {
  const { open, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  // Only show on mobile when sidebar is closed
  if (!isMobile || open) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setOpenMobile(true)}
      className="fixed top-4 left-4 z-50 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hover:bg-accent"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
