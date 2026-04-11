import { Toaster } from "@/components/ui/toaster"
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/supabaseClient';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';

// Existing pages
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import ReportBuilder from './pages/ReportBuilder';
import Support from './pages/Support';
import AdBanners from './pages/AdBanners';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Creatives from './pages/Creatives';
import Integrations from './pages/Integrations';
import MarketResearch from './pages/MarketResearch';
import LiveAnalytics from './pages/LiveAnalytics';
import CampaignDetail from './pages/CampaignDetail';
import GHLDashboard from './pages/GHLDashboard';
import Billing from './pages/Billing';
import ClientChat from './pages/ClientChat';
import AdminWorkspaces from './pages/AdminWorkspaces';
import UserManagement from './pages/UserManagement';

// New pages — bug-fix stubs & verticals
import AIAssistant from './pages/AIAssistant';
import Alerts from './pages/Alerts';
import EmailMarketing from './pages/EmailMarketing';
import SocialMedia from './pages/SocialMedia';
import SEO from './pages/SEO';

const RootRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToSelection = async () => {
      navigate('/admin/workspaces');
    };
    
    redirectToSelection();
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Admin routes - no workspace slug */}
      <Route path="/admin/workspaces" element={<AdminWorkspaces />} />
      
      {/* Workspace routes with slug */}
      <Route element={<Layout />}>
        {/* Core */}
        <Route path="/:workspaceSlug/dashboard" element={<Dashboard />} />
        <Route path="/:workspaceSlug/campaigns" element={<Campaigns />} />
        <Route path="/:workspaceSlug/campaign" element={<CampaignDetail />} />
        <Route path="/:workspaceSlug/analytics" element={<Analytics />} />

        {/* Analytics Verticals */}
        <Route path="/:workspaceSlug/live" element={<LiveAnalytics />} />
        <Route path="/:workspaceSlug/live-analytics" element={<LiveAnalytics />} />  {/* alias */}
        <Route path="/:workspaceSlug/email" element={<EmailMarketing />} />
        <Route path="/:workspaceSlug/social" element={<SocialMedia />} />
        <Route path="/:workspaceSlug/seo" element={<SEO />} />

        {/* Insights */}
        <Route path="/:workspaceSlug/reports" element={<Reports />} />
        <Route path="/:workspaceSlug/report-builder" element={<ReportBuilder />} />
        <Route path="/:workspaceSlug/market-research" element={<MarketResearch />} />

        {/* Tools */}
        <Route path="/:workspaceSlug/ai-assistant" element={<AIAssistant />} />
        <Route path="/:workspaceSlug/client-chat" element={<ClientChat />} />
        <Route path="/:workspaceSlug/alerts" element={<Alerts />} />
        <Route path="/:workspaceSlug/notifications" element={<Notifications />} />  {/* alias */}
        <Route path="/:workspaceSlug/integrations" element={<Integrations />} />
        <Route path="/:workspaceSlug/ghl" element={<GHLDashboard />} />

        {/* Creatives */}
        <Route path="/:workspaceSlug/creatives" element={<Creatives />} />
        <Route path="/:workspaceSlug/ad-creatives" element={<Creatives />} />   {/* alias */}
        <Route path="/:workspaceSlug/ad-banners" element={<AdBanners />} />

        {/* Admin / Settings */}
        <Route path="/:workspaceSlug/settings" element={<Settings />} />
        <Route path="/:workspaceSlug/billing" element={<Billing />} />
        <Route path="/:workspaceSlug/users" element={<UserManagement />} />
        <Route path="/:workspaceSlug/support" element={<Support />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  useEffect(() => {
    const saved = localStorage.getItem('ei-theme') || 'dark';
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (saved === 'system') {
      root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      root.classList.add(saved);
    }
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App