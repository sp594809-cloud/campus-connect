import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PhoneShell } from "@/components/campus/PhoneShell";
import { BottomNav, type Tab } from "@/components/campus/BottomNav";
import { HomeScreen } from "@/components/campus/screens/HomeScreen";
import { DiscoverScreen } from "@/components/campus/screens/DiscoverScreen";
import { CommunitiesScreen } from "@/components/campus/screens/CommunitiesScreen";
import { EventsScreen } from "@/components/campus/screens/EventsScreen";
import { MessagesScreen } from "@/components/campus/screens/MessagesScreen";
import { MarketplaceScreen } from "@/components/campus/screens/MarketplaceScreen";
import { CompaniesScreen } from "@/components/campus/screens/CompaniesScreen";
import { RewardLayer } from "@/components/campus/RewardLayer";
import { TierPill } from "@/components/campus/TierPill";
import { FloatingActions } from "@/components/campus/FloatingActions";

const CampusApp = () => {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("home");
  const [openWith, setOpenWith] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) navigate("/", { replace: true });
    else if (profile && !profile.onboarded) navigate("/onboarding", { replace: true });
  }, [session, profile, loading, navigate]);

  if (loading || !session || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const name = profile.name || "there";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const goMessage = (id: string) => {
    setOpenWith(id);
    setTab("messages");
  };

  return (
    <PhoneShell>
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
        <p className="text-sm font-bold flex-1">Hi, {name.split(" ")[0]} 👋</p>
        <button
          onClick={() => navigate("/course/python")}
          aria-label="Open Courses"
          className="mr-2 px-3 py-1 rounded-md bg-accent/10 text-sm font-semibold hover:bg-accent/20"
        >
          Courses
        </button>
        <TierPill />
        <button
          onClick={() => navigate("/me")}
          aria-label="Open profile"
          className="h-9 w-9 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center font-bold text-sm shadow-soft hover:shadow-glow transition-smooth"
        >
          {initials || <User className="h-4 w-4" />}
        </button>
      </div>
      <RewardLayer />
      {tab === "home" && <HomeScreen />}
      {tab === "discover" && <DiscoverScreen onMessage={goMessage} />}
      {tab === "communities" && <CommunitiesScreen />}
      {tab === "events" && <EventsScreen />}
      {tab === "marketplace" && <MarketplaceScreen />}
      {tab === "companies" && <CompaniesScreen />}
      {tab === "messages" && (
        <MessagesScreen openWith={openWith} onClearOpen={() => setOpenWith(null)} />
      )}
      <BottomNav active={tab} onChange={setTab} />
      <FloatingActions onChat={tab === "messages" ? undefined : () => setTab("messages")} />
    </PhoneShell>
  );
};

export default CampusApp;
