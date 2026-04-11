import { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { useWorkspace } from "@/lib/useWorkspace";
import { useAuth } from "@/lib/AuthContext";
import { 
  LayoutDashboard, 
  Megaphone, 
  BarChart3, 
  FileText, 
  LifeBuoy, 
  Settings,
  X,
  Bell,
  FilePlus,
  ImagePlay,
  Activity,
  Search,
  CreditCard,
  BotMessageSquare,
  ShieldCheck,
  Library,
  Users,
  Mail,
  Share2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav definitions ──────────────────────────────────────────────────────────
// roles: undefined = all, ['Admin','Manager'] = visible to those roles only
const navSections = [
  {
    label: null,
    items: [
      { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Advertising",
    items: [
      { path: "/campaigns", icon: Megaphone, label: "Campaigns", roles: ["Admin", "Manager"] },
      { path: "/analytics", icon: BarChart3, label: "Analytics", submenu: [
        { path: "/analytics?platform=meta", label: "Meta Ads" },
        { path: "/analytics?platform=google", label: "Google Ads" },
      ]},
      { path: "/live", icon: Activity, label: "Live Analytics" },
      { path: "/creatives", icon: ImagePlay, label: "Ad Creatives", roles: ["Admin", "Manager"] },
    ],
  },
  {
    label: "Data Verticals",
    items: [
      { path: "/email", icon: Mail, label: "Email Marketing" },
      { path: "/social", icon: Share2, label: "Social Media" },
      { path: "/seo", icon: TrendingUp, label: "SEO" },
    ],
  },
  {
    label: "Insights",
    items: [
      { path: "/reports", icon: FileText, label: "Reports" },
      { path: "/report-builder", icon: FilePlus, label: "Report Builder", roles: ["Admin", "Manager"] },
      { path: "/market-research", icon: Search, label: "Market Research" },
    ],
  },
  {
    label: "Tools",
    items: [
      { path: "/ai-assistant", icon: BotMessageSquare, label: "AI Assistant", highlight: true },
      { path: "/alerts", icon: Bell, label: "Alerts & News" },
      { path: "/integrations", icon: Zap, label: "Integrations", roles: ["Admin"] },
    ],
  },
];

const bottomNavItems = [
  { path: "/billing", icon: CreditCard, label: "Billing", roles: ["Admin"] },
  { path: "/users", icon: Users, label: "User Management", roles: ["Admin"] },
  { path: "/settings", icon: Settings, label: "Settings", roles: ["Admin"] },
  { path: "/admin/workspaces", icon: ShieldCheck, label: "Admin: Workspaces", adminOnly: true },
];

// ─── Permission helper ───────────────────────────────────────────────────────
function canSeeItem(item, workspaceRole, platformRole) {
  if (!item.roles) return true; // visible to everyone
  const isSuperAdmin = ['super_admin', 'admin', 'internal_admin'].includes(platformRole);
  if (isSuperAdmin) return true;
  return item.roles.includes(workspaceRole);
}

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const { workspace, userRole } = useWorkspace();
  const { user } = useAuth();
  const slug = workspace?.slug || '';
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const platformRole = user?.role;
  const wsRole = userRole; // 'Admin' | 'Manager' | 'User' | etc.

  return (
    <div className="w-72 h-full bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* ── Logo / Branding ── */}
      <div className="p-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          {/* Replace with <img src="/logo.svg" … /> when asset is ready */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-display font-extrabold text-lg tracking-tight">T</span>
          </div>
          <div>
            {/* Replace the h1 below with <img src="/logo-text.svg" alt="TopNotch" className="h-6" /> */}
            <h1 className="font-display text-lg font-bold text-foreground tracking-tight">TopNotch</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI Marketing Platform</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Workspace Switcher */}
      <WorkspaceSwitcher />

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 flex flex-col overflow-y-auto">
        <div className="flex-1 space-y-4">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) =>
              canSeeItem(item, wsRole, platformRole)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label || "core"}>
                {section.label && (
                  <p className="px-4 text-[9px] uppercase tracking-[0.18em] font-bold text-muted-foreground/60 mb-1.5">
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const fullPath = `/${slug}${item.path}`;
                    const isActive = location.pathname.startsWith(fullPath.split('?')[0]);
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    return (
                      <div
                        key={item.path}
                        onClick={() => hasSubmenu && setOpenSubmenu(openSubmenu === item.path ? null : item.path)}
                      >
                        <Link
                          to={fullPath}
                          onClick={(e) => {
                            if (hasSubmenu) e.preventDefault();
                            onClose && onClose();
                          }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "text-primary")} />
                          <span className="flex-1">{item.label}</span>
                          {item.highlight && (
                            <span className="text-[9px] uppercase tracking-wider font-semibold bg-success/20 text-success px-2 py-0.5 rounded-full animate-pulse">
                              New
                            </span>
                          )}
                          {hasSubmenu && (
                            <span className="text-[11px] text-muted-foreground">
                              {openSubmenu === item.path ? "▲" : "▼"}
                            </span>
                          )}
                        </Link>
                        {hasSubmenu && openSubmenu === item.path && (
                          <div className="mt-0.5 ml-4 space-y-0.5 border-l border-sidebar-border/50 pl-3">
                            {item.submenu.map((sub) => {
                              const subFullPath = `/${slug}${sub.path}`;
                              return (
                                <Link
                                  key={sub.path}
                                  to={subFullPath}
                                  onClick={onClose}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
                                >
                                  {sub.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom nav */}
        <div className="mt-2 pt-2 border-t border-sidebar-border/50 space-y-0.5 pb-4">
          {bottomNavItems
            .filter((item) => canSeeItem(item, wsRole, platformRole))
            .map((item) => {
              const fullPath = item.adminOnly ? item.path : `/${slug}${item.path}`;
              const isActive = location.pathname.startsWith(fullPath);
              return (
                <Link
                  key={item.path}
                  to={fullPath}
                  onClick={() => onClose && onClose()}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("w-[16px] h-[16px]", isActive && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </div>
      </nav>
    </div>
  );
}