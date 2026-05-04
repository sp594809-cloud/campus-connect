import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PhoneShell } from "@/components/campus/PhoneShell";
import { BottomNav, type Tab } from "@/components/campus/BottomNav";
import { HomeScreen } from "@/components/campus/screens/HomeScreen";
import { DiscoverScreen } from "@/components/campus/screens/DiscoverScreen";
import { CommunitiesScreen } from "@/components/campus/screens/CommunitiesScreen";
import { EventsScreen } from "@/components/campus/screens/EventsScreen";
import { MessagesScreen } from "@/components/campus/screens/MessagesScreen";

const CampusApp = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("home");
  const [openWith, setOpenWith] = useState<string | null>(null);

  const goMessage = (id: string) => {
    setOpenWith(id);
    setTab("messages");
  };

  return (
    <PhoneShell>
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-smooth"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
      {tab === "home" && <HomeScreen />}
      {tab === "discover" && <DiscoverScreen onMessage={goMessage} />}
      {tab === "communities" && <CommunitiesScreen />}
      {tab === "events" && <EventsScreen />}
      {tab === "messages" && (
        <MessagesScreen openWith={openWith} onClearOpen={() => setOpenWith(null)} />
      )}
      <BottomNav active={tab} onChange={setTab} />
    </PhoneShell>
  );
};

export default CampusApp;