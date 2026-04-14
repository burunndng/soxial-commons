import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Community from "./pages/Community";
import Compose from "./pages/Compose";
import Navigation from "./components/Navigation";

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1">
        <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/compose"} component={Compose} />
      <Route path={"/c/:community"} component={Community} />
      <Route path={"/post/:id"} component={PostDetail} />
      <Route path={"/404"} component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
