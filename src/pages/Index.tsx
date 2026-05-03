import { useState } from "react";
import { PhoneShell } from "@/components/campus/PhoneShell";
import { BottomNav, type Tab } from "@/components/campus/BottomNav";
import { HomeScreen } from "@/components/campus/screens/HomeScreen";
import { DiscoverScreen } from "@/components/campus/screens/DiscoverScreen";
import { CommunitiesScreen } from "@/components/campus/screens/CommunitiesScreen";
import { MessagesScreen } from "@/components/campus/screens/MessagesScreen";
import { ProfileScreen } from "@/components/campus/screens/ProfileScreen";

const Index = () => {
  const [tab, setTab] = useState<Tab>("home");
  const [openChatWith, setOpenChatWith] = useState<string | null>(null);

  const goMessage = (id: string) => {
    setOpenChatWith(id);
    setTab("messages");
  };

  return (
    <PhoneShell>
      {tab === "home" && <HomeScreen />}
      {tab === "discover" && <DiscoverScreen onMessage={goMessage} />}
      {tab === "communities" && <CommunitiesScreen />}
      {tab === "messages" && (
        <MessagesScreen openWith={openChatWith} onClearOpen={() => setOpenChatWith(null)} />
      )}
      {tab === "profile" && <ProfileScreen />}
      <BottomNav active={tab} onChange={(t) => { setTab(t); setOpenChatWith(null); }} />
    </PhoneShell>
  );
};

export default Index;
