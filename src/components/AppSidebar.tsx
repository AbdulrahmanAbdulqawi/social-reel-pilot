import { Home, Upload, BarChart3, Settings, Video, LogOut, Shield, CreditCard, Mail } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkIsAdmin } from "@/lib/adminHelper";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, hideForAdmin: true },
  { title: "Upload", url: "/upload", icon: Upload, hideForAdmin: true },
  { title: "Analytics", url: "/analytics", icon: BarChart3, hideForAdmin: false },
  { title: "Subscription", url: "/subscription", icon: CreditCard, hideForAdmin: true },
  { title: "Account", url: "/settings", icon: Settings, hideForAdmin: false },
  { title: "Contact", url: "/contact", icon: Mail, hideForAdmin: true },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile: sidebarIsMobile } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const [isAdmin, setIsAdmin] = useState(false);
  const isMobile = useIsMobile();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      navigate("/auth");
    }
  };

  const handleNavClick = () => {
    if (isMobile && sidebarIsMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" side={isRTL ? "right" : "left"}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-sm">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-sidebar-foreground truncate">ReelHub</span>
            )}
          </div>
          <SidebarTrigger className="ml-2 hover:bg-sidebar-accent/50 rounded-md transition-colors" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            {t('nav.dashboard')}
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {menuItems
                .filter(item => !(isAdmin && item.hideForAdmin))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span className="truncate">{t(`nav.${item.title.toLowerCase()}`)}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      <Shield className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{t('nav.adminPanel')}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 mt-auto">
        <SidebarMenu className="space-y-1">
          {!collapsed && (
            <SidebarMenuItem>
              <div className="px-2 py-2">
                <LanguageSwitcher />
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut} 
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive font-medium"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{t('nav.signOut')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
