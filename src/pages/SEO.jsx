import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { useWorkspace } from "@/lib/useWorkspace";
import { Search, TrendingUp, TrendingDown, Globe, BarChart3, Eye, MousePointerClick, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

const SEO_PLATFORMS_KEYS = ["google_analytics", "ga4", "google_search_console", "semrush"];

const DEMO_STATS = [
  { label: "Organic Traffic", value: "34,210", trend: +12.4, icon: Globe, color: "text-primary" },
  { label: "Impressions", value: "1.2M", trend: +8.7, icon: Eye, color: "text-chart-2" },
  { label: "Avg. CTR", value: "2.8%", trend: +0.3, icon: MousePointerClick, color: "text-success" },
  { label: "Top 10 Keywords", value: "142", trend: +17, icon: Search, color: "text-warning" },
];

const DEMO_KEYWORDS = [
  { keyword: "toronto marketing agency", position: 3, volume: "1,200/mo", change: +2, ctr: "12.4%" },
  { keyword: "google ads management toronto", position: 7, volume: "880/mo", change: 0, ctr: "6.1%" },
  { keyword: "meta ads agency canada", position: 11, volume: "590/mo", change: -2, ctr: "3.8%" },
  { keyword: "best digital marketing agency", position: 14, volume: "2,400/mo", change: +4, ctr: "2.9%" },
  { keyword: "facebook advertising services", position: 5, volume: "1,600/mo", change: +1, ctr: "9.2%" },
];

export default function SEO() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?.id) { if (!wsLoading) setLoading(false); return; }
    base44.entities.WorkspaceIntegration.filter({ workspace_id: workspace.id }, "-created_date", 100)
      .then((all) => {
        setIntegrations((all || []).filter((i) => SEO_PLATFORMS_KEYS.includes(i.type) && i.status === "active"));
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
      <PageHeader title="SEO" subtitle="Keyword rankings, organic traffic, and search console insights" />

      {!hasConnected ? (
        <div className="mt-10 py-24 flex flex-col items-center text-center bg-card border-2 border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">No SEO Integrations Connected</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Connect Google Search Console, GA4, or Semrush to start monitoring your organic search performance.
          </p>
          <Button className="rounded-xl gap-2" onClick={() => navigate(`/${workspaceSlug}/integrations`)}>
            <Zap className="w-4 h-4" /> Connect SEO API
          </Button>
        </div>
      ) : (
        <>
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

          <div className="mt-6 flex flex-wrap gap-2">
            {integrations.map((i) => (
              <span key={i.id} className="inline-flex items-center gap-1.5 bg-success/10 text-success text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                {i.label} — Connected
              </span>
            ))}
          </div>

          <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Keyword Rankings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 border-b border-border">
                  <tr>
                    {["Keyword", "Position", "Volume", "Change", "CTR"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_KEYWORDS.map((k) => (
                    <tr key={k.keyword} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-4 font-medium text-foreground">{k.keyword}</td>
                      <td className="px-5 py-4">
                        <span className={`font-bold text-sm ${k.position <= 5 ? "text-success" : k.position <= 10 ? "text-warning" : "text-muted-foreground"}`}>
                          #{k.position}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{k.volume}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold flex items-center gap-1 ${k.change > 0 ? "text-success" : k.change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {k.change > 0 ? <TrendingUp className="w-3 h-3" /> : k.change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                          {k.change === 0 ? "—" : `${k.change > 0 ? "+" : ""}${k.change}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-primary font-semibold">{k.ctr}</td>
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
