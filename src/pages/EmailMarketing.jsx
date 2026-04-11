import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { useWorkspace } from "@/lib/useWorkspace";
import { Mail, TrendingUp, TrendingDown, MousePointerClick, DollarSign, Users, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

const EMAIL_PLATFORMS = ["mailchimp", "klaviyo", "activecampaign", "hubspot"];

const DEMO_STATS = [
  { label: "Open Rate", value: "28.4%", trend: +3.2, icon: Mail, color: "text-primary" },
  { label: "Click Rate", value: "6.1%", trend: +1.1, icon: MousePointerClick, color: "text-chart-2" },
  { label: "Unsubscribes", value: "0.4%", trend: -0.1, icon: Users, color: "text-destructive" },
  { label: "Revenue / Email", value: "$1.82", trend: +0.34, icon: DollarSign, color: "text-success" },
];

const DEMO_CAMPAIGNS = [
  { name: "Spring Sale Announcement", platform: "Klaviyo", sent: 12400, opens: "31.2%", clicks: "7.4%", revenue: "$4,210" },
  { name: "Weekly Newsletter — Apr Wk 1", platform: "Mailchimp", sent: 8900, opens: "25.6%", clicks: "5.1%", revenue: "$1,890" },
  { name: "Win-Back Sequence Day 3", platform: "ActiveCampaign", sent: 3200, opens: "18.9%", clicks: "4.3%", revenue: "$790" },
];

export default function EmailMarketing() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?.id) { if (!wsLoading) setLoading(false); return; }
    base44.entities.WorkspaceIntegration.filter({ workspace_id: workspace.id }, "-created_date", 100)
      .then((all) => {
        setIntegrations((all || []).filter((i) => EMAIL_PLATFORMS.includes(i.type) && i.status === "active"));
      })
      .finally(() => setLoading(false));
  }, [workspace?.id, wsLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasConnected = integrations.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Email Marketing" subtitle="Monitor email performance across all connected ESPs" />

      {!hasConnected ? (
        <div className="mt-10 py-24 flex flex-col items-center text-center bg-card border-2 border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">No Email Integrations Connected</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Connect Mailchimp, Klaviyo, ActiveCampaign, or HubSpot to start tracking your email KPIs here.
          </p>
          <Button className="rounded-xl gap-2" onClick={() => navigate(`/${workspaceSlug}/integrations`)}>
            <Zap className="w-4 h-4" /> Connect Email API
          </Button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {DEMO_STATS.map(({ label, value, trend, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className={`text-xs font-semibold flex items-center gap-1 ${trend >= 0 ? "text-success" : "text-destructive"}`}>
                    {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trend)}
                  </span>
                </div>
                <p className="text-2xl font-display font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Connected Platforms */}
          <div className="mt-6 flex flex-wrap gap-2">
            {integrations.map((i) => (
              <span key={i.id} className="inline-flex items-center gap-1.5 bg-success/10 text-success text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                {i.label} — Connected
              </span>
            ))}
          </div>

          {/* Campaigns Table */}
          <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Recent Campaigns</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 border-b border-border">
                  <tr>
                    {["Campaign", "Platform", "Sent", "Open Rate", "Click Rate", "Revenue"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_CAMPAIGNS.map((c) => (
                    <tr key={c.name} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-4 font-medium text-foreground">{c.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{c.platform}</td>
                      <td className="px-5 py-4 text-foreground">{c.sent.toLocaleString()}</td>
                      <td className="px-5 py-4 text-primary font-semibold">{c.opens}</td>
                      <td className="px-5 py-4 text-chart-2 font-semibold">{c.clicks}</td>
                      <td className="px-5 py-4 text-success font-semibold">{c.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
