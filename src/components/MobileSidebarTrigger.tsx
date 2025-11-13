import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

export function MobileSidebarTrigger() {
  const { open, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setOpenMobile(!open)}
      className={`fixed top-4 ${isRTL ? 'right-4' : 'left-4'} z-50 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hover:bg-accent`}
      aria-label={open ? "Close menu" : "Open menu"}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
