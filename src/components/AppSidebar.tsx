import { Home, Upload, BarChart3, Settings, Video, LogOut, Shield, CreditCard, Mail, Calendar } from "lucide-react";
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
  { title: "Calendar", url: "/calendar", icon: Calendar, hideForAdmin: true },
  { title: "Analytics", url: "/analytics", icon: BarChart3, hideForAdmin: false },
  { title: "Subscription", url: "/subscription", icon: CreditCard, hideForAdmin: true },
  { title: "Account", url: "/settings", icon: Settings, hideForAdmin: false },
  { title: "Contact", url: "/contact", icon: Mail, hideForAdmin: true },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile: sidebarIsMobile, toggleSidebar } = useSidebar();
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
    <Sidebar 
      collapsible="icon" 
      side={isRTL ? "right" : "left"}
      className="border-r"
    >
      <SidebarHeader className="border-b border-sidebar-border p-3 sm:p-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : `gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between`} w-full`}>
          {collapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
              className="p-2 bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-primary hover:opacity-90 transition-opacity"
            >
              <Video className="w-5 h-5 text-primary-foreground" />
            </button>
          ) : (
            <>
              <div className={`flex items-center gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} min-w-0 flex-1`}>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label="Collapse sidebar"
                  className="p-2 bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-primary hover:opacity-90 transition-opacity"
                >
                  <Video className="w-5 h-5 text-primary-foreground" />
                </button>
                <span className="font-bold text-lg text-sidebar-foreground truncate">ReelHub</span>
              </div>
              <SidebarTrigger className="hover:bg-sidebar-accent/50 rounded-md transition-colors shrink-0 h-9 w-9" />
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 sm:px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-2 sm:px-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              {t('nav.dashboard')}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="mt-1 sm:mt-2">
            <SidebarMenu className="space-y-0.5 sm:space-y-1">
              {menuItems
                .filter(item => !(isAdmin && item.hideForAdmin))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `flex items-center ${collapsed ? 'justify-center px-0' : `gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} px-3`} py-2.5 rounded-lg transition-all duration-200 text-sm ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          }`
                        }
                        title={collapsed ? t(`nav.${item.title.toLowerCase()}`) : undefined}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
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
                        `flex items-center ${collapsed ? 'justify-center px-0' : `gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} px-3`} py-2.5 rounded-lg transition-all duration-200 text-sm ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`
                      }
                      title={collapsed ? t('nav.adminPanel') : undefined}
                    >
                      <Shield className="w-5 h-5 shrink-0" />
                      {!collapsed && <span className="truncate">{t('nav.adminPanel')}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 sm:p-3 mt-auto">
        <SidebarMenu className="space-y-0.5 sm:space-y-1">
          {!collapsed && (
            <SidebarMenuItem>
              <div className="px-1 sm:px-2 py-1 sm:py-2">
                <LanguageSwitcher />
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut} 
              className={`flex items-center ${collapsed ? 'justify-center px-0' : `gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} px-3`} py-2.5 rounded-lg transition-all duration-200 text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive font-medium text-sm`}
              title={collapsed ? t('nav.signOut') : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{t('nav.signOut')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
