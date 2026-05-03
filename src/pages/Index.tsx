import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, User as UserIcon, GraduationCap } from "lucide-react";
import { PhoneShell } from "@/components/campus/PhoneShell";
import { BottomNav, type Tab } from "@/components/campus/BottomNav";
import { HomeScreen } from "@/components/campus/screens/HomeScreen";
import { DiscoverScreen } from "@/components/campus/screens/DiscoverScreen";
import { CommunitiesScreen } from "@/components/campus/screens/CommunitiesScreen";
import { MessagesScreen } from "@/components/campus/screens/MessagesScreen";
import { ProfileScreen } from "@/components/campus/screens/ProfileScreen";
import { EventsScreen } from "@/components/campus/screens/EventsScreen";
import { MentorshipScreen } from "@/components/campus/screens/MentorshipScreen";
import { Onboarding } from "@/components/campus/Onboarding";
import { useAuth } from "@/contexts/AuthContext";

type Screen = Tab | "profile" | "mentorship";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<Screen>("home");
  const [openChatWith, setOpenChatWith] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile?.onboarded) return <Onboarding />;

  const goMessage = (id: string) => { setOpenChatWith(id); setTab("messages"); };

  return (
    <PhoneShell>
      <div className="absolute top-3 right-4 z-50 flex gap-1.5">
        <button onClick={() => setTab("mentorship")} aria-label="Mentorship" className="h-9 w-9 rounded-full bg-card/80 backdrop-blur shadow-soft flex items-center justify-center hover:scale-105 transition-smooth"><GraduationCap className="h-4 w-4" /></button>
        <button onClick={() => setTab("profile")} aria-label="Profile" className="h-9 w-9 rounded-full bg-card/80 backdrop-blur shadow-soft flex items-center justify-center hover:scale-105 transition-smooth"><UserIcon className="h-4 w-4" /></button>
      </div>
      {tab === "home" && <HomeScreen />}
      {tab === "discover" && <DiscoverScreen onMessage={goMessage} />}
      {tab === "communities" && <CommunitiesScreen />}
      {tab === "events" && <EventsScreen />}
      {tab === "messages" && <MessagesScreen openWith={openChatWith} onClearOpen={() => setOpenChatWith(null)} />}
      {tab === "profile" && <ProfileScreen />}
      {tab === "mentorship" && <MentorshipScreen />}
      <BottomNav active={(["home","discover","communities","events","messages"].includes(tab) ? tab : "home") as Tab} onChange={(t) => { setTab(t); setOpenChatWith(null); }} />
    </PhoneShell>
  );
};

export default Index;
