import { Bell, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const DEMO_ALERTS = [
  {
    id: 1,
    type: "warning",
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    title: "Campaign Budget Nearing Limit",
    desc: "Your Meta Ads campaign 'Summer Sale Q3' is at 85% of its daily budget.",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "info",
    icon: Info,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "New Integration Available",
    desc: "Connect TikTok Ads to unlock new audience insights and cross-platform reporting.",
    time: "5 hours ago",
  },
  {
    id: 3,
    type: "success",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    title: "Report Generated Successfully",
    desc: "Your weekly performance report has been compiled and is ready to view.",
    time: "1 day ago",
  },
  {
    id: 4,
    type: "warning",
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    title: "High CPC Detected",
    desc: "Google Ads keyword 'luxury apartments Toronto' has a CPC 40% above your target.",
    time: "2 days ago",
  },
];

export default function Alerts() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Alerts & Notifications"
        subtitle="Stay informed with real-time alerts and platform updates"
      />

      <div className="space-y-3 mt-6">
        {DEMO_ALERTS.map((alert) => (
          <div
            key={alert.id}
            className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-primary/20 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${alert.bg} flex items-center justify-center shrink-0`}>
              <alert.icon className={`w-5 h-5 ${alert.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{alert.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{alert.desc}</p>
              <p className="text-[11px] text-muted-foreground/60 mt-2">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-card border-2 border-dashed border-primary/20 rounded-2xl text-center">
        <Bell className="w-8 h-8 text-primary/40 mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground">Smart Alert Rules — Coming Soon</p>
        <p className="text-xs text-muted-foreground mt-1">
          Configure custom thresholds and receive real-time alerts when your KPIs go off-track.
        </p>
      </div>
    </div>
  );
}
