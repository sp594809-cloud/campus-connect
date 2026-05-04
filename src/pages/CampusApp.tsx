import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { getStudentSession } from "./Index";
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
  const session = getStudentSession();

  useEffect(() => {
    if (!session) navigate("/", { replace: true });
    else if (!session.onboarded) navigate("/onboarding", { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const initials = session.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const goMessage = (id: string) => {
    setOpenWith(id);
    setTab("messages");
  };

  return (
    <PhoneShell>
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 py-2 flex items-center gap-2">
        <p className="text-sm font-bold flex-1">Hi, {session.full_name.split(" ")[0]} 👋</p>
        <button
          onClick={() => navigate("/me")}
          aria-label="Open profile"
          className="h-9 w-9 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center font-bold text-sm shadow-soft hover:shadow-glow transition-smooth"
        >
          {initials || <User className="h-4 w-4" />}
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