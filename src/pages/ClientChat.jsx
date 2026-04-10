import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ClientChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hi! 👋 I'm your AI assistant. Ready to help with questions about your campaigns.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAIResponse = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes("campaign") || msg.includes("ad")) {
      return "Great question about campaigns! 📊 To optimize your ad performance, focus on: (1) Testing multiple creatives, (2) Narrowing your audience targeting, (3) Monitoring your CPL daily and pausing underperformers. Would you like tips on a specific platform?";
    } else if (msg.includes("meta") || msg.includes("facebook")) {
      return "For Meta Ads best practices: ✅ Use Advantage+ campaigns for automated optimization, ✅ Set up a Meta Pixel on your website, ✅ Test Reels placements — they often have lower CPMs. Your workspace integrations page lets you connect your Meta Ad account directly.";
    } else if (msg.includes("google")) {
      return "For Google Ads: ✅ Start with Performance Max campaigns, ✅ Use broad match keywords with Smart Bidding, ✅ Add negative keywords to prevent wasted spend. Connect your Google Ads account via the Integrations page to see live data here.";
    } else if (msg.includes("lead") || msg.includes("cpl") || msg.includes("cost per lead")) {
      return "To lower your Cost Per Lead (CPL): 💡 (1) Test different landing page headlines, (2) Add social proof to your ads, (3) Use retargeting to re-engage warm audiences, (4) Optimize for the correct conversion event. What's your current CPL target?";
    } else if (msg.includes("budget") || msg.includes("spend")) {
      return "Budget optimization tips: 🎯 Allocate 70% to proven campaigns, 20% to test new audiences, 10% to new creative concepts. Monitor spend pacing daily — sudden drops often signal creative fatigue or audience saturation.";
    } else if (msg.includes("report") || msg.includes("analytics")) {
      return "Your Reports section has AI-generated summaries for all your campaigns. 📈 You can also use the Report Builder to create custom reports filtered by date range, platform, and campaign. Want me to explain any specific metric?";
    } else if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      return "Hi there! 👋 I'm your TopNotch AI assistant. I can help you with campaign strategy, ad optimization, budget planning, and platform integrations. What are you working on today?";
    } else {
      return "Thanks for your question! 🤖 I'm here to help with your marketing campaigns, ad performance, and growth strategy. For live data and AI-driven insights, make sure your Meta or Google Ads account is connected via the Integrations page. What specific area can I help you optimize?";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { id: messages.length + 1, role: "user", content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate a short thinking delay for better UX
    setTimeout(() => {
      const reply = getAIResponse(currentInput);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: reply
      }]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-gradient-to-b from-background via-background to-background/95">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4 py-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 animate-slide-up",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            )}

            <div
              className={cn(
                "max-w-md sm:max-w-lg rounded-2xl px-4 py-3 shadow-md",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-card border border-border rounded-bl-none"
              )}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 sm:px-6 pb-6 pt-4 border-t border-border/40 bg-background/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
            placeholder="Write a message..."
            className="flex-1 bg-card border-border h-11 rounded-xl text-sm placeholder:text-muted-foreground/60"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            size="icon"
            className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}