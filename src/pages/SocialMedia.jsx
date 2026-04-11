import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { useWorkspace } from "@/lib/useWorkspace";
import { Share2, TrendingUp, TrendingDown, Users, Eye, Heart, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

const SOCIAL_PLATFORMS_KEYS = ["meta_ads", "facebook", "instagram", "tiktok", "linkedin", "tiktok_ads"];

const DEMO_STATS = [
  { label: "Total Followers", value: "124.8K", trend: +2.1, icon: Users, color: "text-primary" },
  { label: "Total Reach", value: "482K", trend: +8.4, icon: Eye, color: "text-chart-2" },
  { label: "Engagement Rate", value: "4.7%", trend: +0.6, icon: Heart, color: "text-destructive" },
  { label: "Posts This Month", value: "38", trend: +5, icon: Share2, color: "text-success" },
];

const DEMO_POSTS = [
  { platform: "Instagram", content: "Spring collection drop 🌸 — swipe to see all looks", reach: "28,400", engagement: "6.2%", likes: 1750 },
  { platform: "TikTok", content: "POV: You found the best deal in the city 🔥 #deals", reach: "112,000", engagement: "8.9%", likes: 9900 },
  { platform: "Facebook", content: "Customer story: How Sarah saved $800 with our service", reach: "14,200", engagement: "3.1%", likes: 440 },
  { platform: "LinkedIn", content: "We're hiring! Join our growth team in Toronto 🇨🇦", reach: "8,700", engagement: "5.4%", likes: 470 },
];

const PLATFORM_COLORS = {
  Instagram: "text-pink-500 bg-pink-500/10",
  TikTok: "text-foreground bg-secondary",
  Facebook: "text-blue-500 bg-blue-500/10",
  LinkedIn: "text-sky-500 bg-sky-500/10",
};

export default function SocialMedia() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?.id) { if (!wsLoading) setLoading(false); return; }
    base44.entities.WorkspaceIntegration.filter({ workspace_id: workspace.id }, "-created_date", 100)
      .then((all) => {
        setIntegrations((all || []).filter((i) => SOCIAL_PLATFORMS_KEYS.includes(i.type) && i.status === "active"));
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
      <PageHeader title="Social Media" subtitle="Track followers, reach, and engagement across all social platforms" />

      {!hasConnected ? (
        <div className="mt-10 py-24 flex flex-col items-center text-center bg-card border-2 border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Share2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">No Social Integrations Connected</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Connect Meta Ads, TikTok, LinkedIn, or Instagram to see cross-platform social KPIs in one place.
          </p>
          <Button className="rounded-xl gap-2" onClick={() => navigate(`/${workspaceSlug}/integrations`)}>
            <Zap className="w-4 h-4" /> Connect Social API
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
              <h3 className="text-sm font-semibold text-foreground">Top Performing Posts</h3>
            </div>
            <div className="divide-y divide-border">
              {DEMO_POSTS.map((p) => (
                <div key={p.content} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLATFORM_COLORS[p.platform] || "bg-secondary text-foreground"}`}>
                    {p.platform}
                  </span>
                  <p className="flex-1 text-sm text-foreground truncate">{p.content}</p>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-foreground">{p.reach} reach</p>
                    <p className="text-[11px] text-success">{p.engagement} engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
