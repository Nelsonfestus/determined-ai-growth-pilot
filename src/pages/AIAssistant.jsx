import { BotMessageSquare, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

export default function AIAssistant() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="AI Assistant"
        subtitle="Your intelligent marketing copilot powered by Claude AI"
      />

      <div className="mt-12 flex flex-col items-center text-center py-20 bg-card border-2 border-dashed border-primary/20 rounded-3xl">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 ring-4 ring-primary/10">
          <BotMessageSquare className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-3">
          AI Assistant — Coming Soon
        </h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Get instant insights, generate ad copy, analyze campaign performance, and receive
          personalized recommendations — all powered by Claude AI.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
          {[
            { icon: Sparkles, title: "Smart Copy", desc: "Generate high-converting ad copy in seconds" },
            { icon: Zap, title: "Instant Analysis", desc: "Ask questions about your campaign data" },
            { icon: BotMessageSquare, title: "24/7 Support", desc: "Get help at any time, no waiting" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-background border border-border rounded-2xl p-4 text-left">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>

        <Button className="rounded-xl gap-2" disabled>
          <Sparkles className="w-4 h-4" />
          Launching Soon — Stay Tuned
        </Button>
      </div>
    </div>
  );
}
