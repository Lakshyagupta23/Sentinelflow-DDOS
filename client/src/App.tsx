import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AttackForensics from "./pages/AttackForensics";
import MitigationControls from "./pages/MitigationControls";
import AlertsConfig from "./pages/AlertsConfig";
import ExecutiveSummary from "./pages/ExecutiveSummary";
import AuditLogs from "./pages/AuditLogs";
import UserManagement from "./pages/UserManagement";
import SystemSettings from "./pages/SystemSettings";
import PlaybooksManagement from "./pages/PlaybooksManagement";
import OrganizationsManagement from "./pages/OrganizationsManagement";
import RealtimeUpdates from "./pages/RealtimeUpdates";
import AlertRulesBuilder from "./pages/AlertRulesBuilder";
import ThreatIntelligenceDashboard from "./pages/ThreatIntelligenceDashboard";
import NotificationsCenter from "./pages/NotificationsCenter";
import { WebhookManagement } from "./pages/WebhookManagement";
import { TeamManagement } from "./pages/TeamManagement";
import { PlaybookBuilder } from "./pages/PlaybookBuilder";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path={"/"} component={isAuthenticated ? Dashboard : Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/forensics"} component={AttackForensics} />
      <Route path={"/mitigation"} component={MitigationControls} />
      <Route path={"/alerts"} component={AlertsConfig} />
      <Route path={"/summary"} component={ExecutiveSummary} />
      <Route path={"/audit"} component={AuditLogs} />
      <Route path={"/users"} component={UserManagement} />
      <Route path={"/settings"} component={SystemSettings} />
      <Route path={"/playbooks"} component={PlaybooksManagement} />
      <Route path={"/organizations"} component={OrganizationsManagement} />
      <Route path={"/realtime"} component={RealtimeUpdates} />
      <Route path={"/alert-rules"} component={AlertRulesBuilder} />
      <Route path={"/threat-intelligence"} component={ThreatIntelligenceDashboard} />
      <Route path={"/notifications"} component={NotificationsCenter} />
      <Route path={"/webhooks"} component={WebhookManagement} />
      <Route path={"/teams"} component={TeamManagement} />
      <Route path={"/playbook-builder"} component={PlaybookBuilder} />
      <Route path={"/analytics"} component={AnalyticsDashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
