import { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { X, Check, Loader2, Building2, Zap, Search, ChevronRight, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Integration catalogue by category
const INTEGRATION_CATALOGUE = {
  "Advertising": [
    { id: "meta_ads",    label: "Meta Ads",    icon: "📘", fields: [{ key: "api_key", label: "Access Token" }, { key: "account_id", label: "Ad Account ID" }] },
    { id: "google_ads",  label: "Google Ads",  icon: "🎯", fields: [{ key: "api_key", label: "Developer Token" }, { key: "account_id", label: "Customer ID" }] },
    { id: "tiktok_ads",  label: "TikTok Ads",  icon: "🎵", fields: [{ key: "api_key", label: "Access Token" }, { key: "account_id", label: "Advertiser ID" }] },
  ],
  "CRM & Marketing": [
    { id: "hubspot",        label: "HubSpot",         icon: "🧡", fields: [{ key: "api_key", label: "Private App Token" }] },
    { id: "zoho_crm",       label: "Zoho CRM",        icon: "🟠", fields: [{ key: "api_key", label: "API Key" }, { key: "account_id", label: "Client ID" }] },
    { id: "whatconverts",   label: "WhatConverts",    icon: "📞", fields: [{ key: "api_key", label: "API Key" }, { key: "api_secret", label: "API Secret" }] },
    { id: "gamma",          label: "Gamma",            icon: "📊", fields: [{ key: "api_key", label: "API Key" }] },
    { id: "activecampaign", label: "ActiveCampaign",  icon: "⚡", fields: [{ key: "api_key", label: "API Key" }, { key: "account_id", label: "Account URL" }] },
    { id: "mailchimp",      label: "Mailchimp",        icon: "🐒", fields: [{ key: "api_key", label: "API Key" }] },
    { id: "klaviyo",        label: "Klaviyo",          icon: "📧", fields: [{ key: "api_key", label: "Private API Key" }] },
    { id: "semrush",        label: "Semrush",          icon: "🔍", fields: [{ key: "api_key", label: "API Key" }] },
  ],
  "Analytics": [
    { id: "ga4",                    label: "Google Analytics 4",  icon: "📈", fields: [{ key: "api_key", label: "Measurement ID" }, { key: "api_secret", label: "API Secret" }] },
    { id: "google_search_console",  label: "Google Search Console", icon: "🔎", fields: [{ key: "api_key", label: "OAuth Token" }] },
  ],
  "Other": [
    { id: "claude_ai", label: "Claude Bot (Anthropic)", icon: "🧠", fields: [{ key: "api_key", label: "Anthropic API Key" }] },
  ],
};

const ALL_INTEGRATIONS = Object.values(INTEGRATION_CATALOGUE).flat();

// ─── Credential Modal ──────────────────────────────────────────────────────────
function CredentialModal({ integration, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [showKey, setShowKey] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(integration, form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{integration.icon}</span>
            <div>
              <h3 className="text-base font-display font-bold text-foreground">{integration.label}</h3>
              <p className="text-xs text-muted-foreground">Enter your API credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {integration.fields.map((f) => (
            <div key={f.key}>
              <Label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</Label>
              <div className="relative">
                <Input
                  type={showKey[f.key] ? "text" : "password"}
                  placeholder={`Enter ${f.label}`}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="bg-background border-border font-mono text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((p) => ({ ...p, [f.key]: !p[f.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey[f.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 px-6 pb-6 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save & Connect
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────
export default function CreateWorkspaceWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(1); // 1 = name, 2 = integrations
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState(null);
  const [search, setSearch] = useState("");
  const [connectedIntegrations, setConnectedIntegrations] = useState({}); // { id: true }
  const [modalIntegration, setModalIntegration] = useState(null);

  // Step 1 – create workspace
  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const ws = await base44.entities.Workspace.create({
      name: name.trim(),
      slug,
      status: "onboarding",
      plan: "starter",
      billing_status: "trial",
    });
    await base44.entities.ActivityLog.create({
      workspace_id: ws.id,
      action: "workspace_created",
      entity_type: "Workspace",
      entity_id: ws.id,
      details: `Workspace "${ws.name}" created`,
      platform_action: true,
    }).catch(() => {});
    setWorkspace(ws);
    setSaving(false);
    setStep(2);
  };

  // Step 2 – save individual integration credentials
  const handleSaveIntegration = async (integration, form) => {
    if (!workspace?.id) return;
    await base44.entities.WorkspaceIntegration.create({
      workspace_id: workspace.id,
      workspace_name: workspace.name,
      type: integration.id,
      label: integration.label,
      status: "active",
      api_key: form.api_key || "",
      api_secret: form.api_secret || "",
      account_id: form.account_id || "",
    });
    setConnectedIntegrations((prev) => ({ ...prev, [integration.id]: true }));
  };

  const handleFinish = () => {
    onCreated();
    onClose();
  };

  const filteredCategories = Object.entries(INTEGRATION_CATALOGUE).reduce((acc, [cat, items]) => {
    const filtered = items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()));
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {});

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                {step === 1 ? <Building2 className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">
                  {step === 1 ? "New Workspace" : "Connect Integrations"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {step === 1 ? "Step 1 of 2 — Name your workspace" : `Step 2 of 2 — Connect APIs for "${workspace?.name}"`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Step dots */}
              <div className="flex gap-1.5 mr-2">
                {[1, 2].map((s) => (
                  <div key={s} className={cn("w-2 h-2 rounded-full transition-all", s === step ? "bg-primary w-5" : s < step ? "bg-success" : "bg-border")} />
                ))}
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step 1 — Workspace Name */}
          {step === 1 && (
            <>
              <div className="p-6 space-y-4 flex-1">
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">
                    Workspace Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. ClipCar Toronto"
                    className="bg-background border-border"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  A blank workspace will be created. You'll connect integrations in the next step.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 pb-6 border-t border-border pt-4 shrink-0">
                <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                <Button onClick={handleCreate} disabled={saving || !name.trim()} className="rounded-xl gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Next: Connect APIs
                </Button>
              </div>
            </>
          )}

          {/* Step 2 — Integrations */}
          {step === 2 && (
            <>
              <div className="px-6 py-3 border-b border-border shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search integrations..."
                    className="pl-10 bg-background border-border h-9"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {Object.entries(filteredCategories).map(([category, items]) => (
                  <div key={category}>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">{category}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map((integration) => {
                        const isConnected = !!connectedIntegrations[integration.id];
                        return (
                          <div
                            key={integration.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                              isConnected
                                ? "border-success/40 bg-success/5"
                                : "border-border hover:border-primary/30 hover:bg-secondary/40"
                            )}
                            onClick={() => !isConnected && setModalIntegration(integration)}
                          >
                            <span className="text-xl shrink-0">{integration.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{integration.label}</p>
                              {isConnected ? (
                                <p className="text-[11px] text-success font-semibold flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> Connected ✓
                                </p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground mt-0.5">Not connected</p>
                              )}
                            </div>
                            {isConnected ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConnectedIntegrations((prev) => {
                                    const n = { ...prev };
                                    delete n[integration.id];
                                    return n;
                                  });
                                }}
                                className="text-[10px] text-muted-foreground hover:text-destructive px-2 py-1 rounded-lg border border-border hover:border-destructive/30 transition-colors shrink-0"
                              >
                                Disconnect
                              </button>
                            ) : (
                              <button className="text-[10px] text-primary font-semibold px-2 py-1 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors shrink-0">
                                Connect
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 px-6 pb-6 border-t border-border pt-4 shrink-0">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {Object.keys(connectedIntegrations).length} connected
                  </span>
                  <Button onClick={handleFinish} className="rounded-xl gap-2">
                    <Check className="w-4 h-4" />
                    Finish Setup
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Credential Modal */}
      {modalIntegration && (
        <CredentialModal
          integration={modalIntegration}
          onClose={() => setModalIntegration(null)}
          onSave={handleSaveIntegration}
        />
      )}
    </>
  );
}