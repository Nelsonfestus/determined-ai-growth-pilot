import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { DollarSign, TrendingUp, BarChart3, Calendar, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PageHeader from "../components/PageHeader";
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="text-muted-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const DATE_PRESETS = [
  { value: "today",    label: "Today",      api: "today" },
  { value: "last_7d",  label: "Last 7 days", api: "last_7d" },
  { value: "last_30d", label: "Last 30 days", api: "last_30d" },
  { value: "last_90d", label: "Last 90 days", api: "last_90d" },
];

export default function Billing() {
  const [datePreset, setDatePreset] = useState("last_30d");
  const [campaigns, setCampaigns] = useState([]);
  const [insights, setInsights] = useState([]);
  const [accountInsights, setAccountInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [hasCard, setHasCard] = useState(false);
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [savingCard, setSavingCard] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);

  const load = async (preset) => {
    setLoading(true);
    try {
      const [campRes, insRes, accRes] = await Promise.all([
        base44.functions.invoke("metaAds", { action: "getCampaigns" }).catch(() => ({ data: {} })),
        base44.functions.invoke("metaAds", { action: "getInsights", datePreset: preset }).catch(() => ({ data: {} })),
        base44.functions.invoke("metaAds", { action: "getAccountInsights", datePreset: preset }).catch(() => ({ data: {} })),
      ]);
      setCampaigns(campRes.data?.campaigns || []);
      setInsights(insRes.data?.insights || []);
      setAccountInsights(accRes.data?.insights || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async () => {
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvv) return;
    setSavingCard(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulate save
    setHasCard(true);
    setShowAddCard(false);
    setCardSaved(true);
    setSavingCard(false);
    setTimeout(() => setCardSaved(false), 3000);
  };

  useEffect(() => { load(datePreset); }, [datePreset]);

  const getIns = (campaignId) => insights.find(i => i.campaign_id === campaignId) || {};

  const rows = campaigns.map(c => {
    const ins = getIns(c.id);
    const spent = parseFloat(ins.spend || 0);
    const leads = parseInt(ins.actions?.find(a => a.action_type === "onsite_conversion.lead")?.value || 0);
    const clicks = parseInt(ins.clicks || 0);
    const impressions = parseInt(ins.impressions || 0);
    const cpl = leads > 0 ? spent / leads : null;
    return { ...c, spent, leads, clicks, impressions, cpl };
  }).filter(c => c.spent > 0 || c.leads > 0);

  const totalSpend = parseFloat(accountInsights?.spend || 0);
  const totalLeads = parseInt(accountInsights?.actions?.find(a => a.action_type === "onsite_conversion.lead")?.value || 0);
  const totalClicks = parseInt(accountInsights?.clicks || 0);
  const totalImpressions = parseInt(accountInsights?.impressions || 0);
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : null;
  const avgCTR = totalClicks > 0 && totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : null;

  const stats = [
    { label: "Total Ad Spend", value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
    { label: "Total Leads", value: totalLeads.toLocaleString(), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Avg CPL", value: avgCPL ? `$${avgCPL.toFixed(2)}` : "—", icon: CreditCard, color: "text-success", bg: "bg-success/10" },
    { label: "Clicks / CTR", value: totalClicks.toLocaleString(), sub: avgCTR ? `${avgCTR}% CTR` : null, icon: BarChart3, color: "text-chart-4", bg: "bg-chart-4/10" },
  ]
  const chartData = rows.slice(0, 12).map(c => ({
    name: (c.name?.substring(0, 16) || "") + (c.name?.length > 16 ? "…" : ""),
    Spent: parseFloat(c.spent.toFixed(0)),
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Billing & Spend" subtitle="Ad spend overview & payment management">
        <div className="flex items-center gap-2">
          {!loading && accountInsights && (
            <div className="flex items-center gap-1.5 text-xs text-success">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live Meta Ads
            </div>
          )}
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="bg-card border-border w-44 rounded-xl h-9">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => load(datePreset)} className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      {/* Payment Method Card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Payment Method
          </h3>
          {cardSaved && <span className="text-xs text-success">✓ Card saved successfully!</span>}
        </div>

        {hasCard ? (
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-blue-400 rounded-md flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">•••• •••• •••• {cardForm.number.slice(-4)}</p>
                <p className="text-xs text-muted-foreground">Expires {cardForm.expiry} · {cardForm.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">Default</span>
              <button onClick={() => { setHasCard(false); setShowAddCard(true); }} className="text-xs text-muted-foreground hover:text-foreground">Change</button>
            </div>
          </div>
        ) : showAddCard ? (
          <div className="space-y-3 p-4 border border-border rounded-xl bg-secondary/20">
            <p className="text-xs text-muted-foreground mb-2">Enter your card details securely</p>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Cardholder Name</label>
              <input
                value={cardForm.name}
                onChange={e => setCardForm(p => ({ ...p, name: e.target.value }))}
                placeholder="John Smith"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Card Number</label>
              <input
                value={cardForm.number}
                onChange={e => setCardForm(p => ({ ...p, number: e.target.value.replace(/\D/g, "").slice(0, 16) }))}
                placeholder="1234 5678 9012 3456"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Expiry (MM/YY)</label>
                <input
                  value={cardForm.expiry}
                  onChange={e => setCardForm(p => ({ ...p, expiry: e.target.value }))}
                  placeholder="MM/YY"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">CVV</label>
                <input
                  value={cardForm.cvv}
                  onChange={e => setCardForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  placeholder="123"
                  type="password"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveCard}
                disabled={savingCard || !cardForm.number || !cardForm.expiry || !cardForm.cvv}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {savingCard ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                {savingCard ? "Saving..." : "Save Card"}
              </button>
              <button onClick={() => setShowAddCard(false)} className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
            <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No payment method on file</p>
            <button
              onClick={() => setShowAddCard(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 mx-auto"
            >
              <CreditCard className="w-3.5 h-3.5" /> Add Payment Method
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>
              {loading ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <s.icon className={cn("w-5 h-5", s.color)} />}
            </div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-display font-bold text-foreground mt-0.5">{loading ? "—" : s.value}</p>
            {s.sub && !loading && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* No API notice */}
      {!loading && !accountInsights && (
        <div className="bg-warning/5 border border-warning/20 rounded-2xl p-5 mb-6 flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Connect Meta Ads to see spend data</p>
            <p className="text-xs text-muted-foreground mt-1">Once you add your Meta Ads API key in the Integrations page, live spend breakdowns, campaign metrics, and ROI tracking will appear here automatically.</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {rows.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-medium text-foreground mb-5">Spend by Campaign</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Spent" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaign table */}
      {rows.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Campaign Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Campaign", "Status", "Spent", "Impressions", "Clicks", "Leads", "CPL"].map(h => (
                    <th key={h} className={cn("pb-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium", h === "Campaign" ? "text-left" : "text-right")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.sort((a, b) => b.spent - a.spent).map(c => (
                  <tr key={c.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 text-foreground font-medium max-w-[220px] truncate">{c.name}</td>
                    <td className="py-3 text-right">
                      <span className={cn("text-xs capitalize", c.status === "ACTIVE" ? "text-success" : "text-muted-foreground")}>{c.status?.toLowerCase()}</span>
                    </td>
                    <td className="py-3 text-right text-foreground">${c.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-3 text-right text-foreground">{c.impressions.toLocaleString()}</td>
                    <td className="py-3 text-right text-foreground">{c.clicks.toLocaleString()}</td>
                    <td className="py-3 text-right text-foreground">{c.leads}</td>
                    <td className="py-3 text-right font-medium text-foreground">{c.cpl ? `$${c.cpl.toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td className="pt-3 text-xs font-semibold text-foreground" colSpan={2}>Total</td>
                  <td className="pt-3 text-right text-sm font-bold text-foreground">${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="pt-3 text-right text-sm font-bold text-foreground">{totalImpressions.toLocaleString()}</td>
                  <td className="pt-3 text-right text-sm font-bold text-foreground">{totalClicks.toLocaleString()}</td>
                  <td className="pt-3 text-right text-sm font-bold text-foreground">{totalLeads}</td>
                  <td className="pt-3 text-right text-sm font-bold text-success">{avgCPL ? `$${avgCPL.toFixed(2)}` : "—"}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}