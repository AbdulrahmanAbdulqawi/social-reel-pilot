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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sidebar-primary rounded-lg">
              <Video className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-sidebar-foreground">ReelHub</span>
            )}
          </div>
          <SidebarTrigger className="-mr-2" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter(item => !(isAdmin && item.hideForAdmin))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{t(`nav.${item.title.toLowerCase()}`)}</span>}
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
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Shield className="w-4 h-4" />
                      {!collapsed && <span>{t('nav.adminPanel')}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          {!collapsed && (
            <SidebarMenuItem>
              <div className="px-2 py-1">
                <LanguageSwitcher />
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>{t('nav.signOut')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
