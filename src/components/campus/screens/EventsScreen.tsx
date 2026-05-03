import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface EventRow {
  id: string; title: string; description: string; starts_at: string;
  location: string; organizer: string; emoji: string; rsvp_count: number;
}

export const EventsScreen = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [rsvped, setRsvped] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: evs } = await supabase.from("events").select("*").gte("starts_at", new Date(Date.now() - 86400000).toISOString()).order("starts_at");
    const { data: rsvps } = await supabase.from("event_rsvps").select("event_id, user_id");
    const counts: Record<string, number> = {};
    const mine: Record<string, boolean> = {};
    (rsvps ?? []).forEach((r) => {
      counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
      if (r.user_id === user?.id) mine[r.event_id] = true;
    });
    setEvents((evs ?? []).map((e) => ({ ...e, rsvp_count: counts[e.id] ?? 0 })));
    setRsvped(mine);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const toggleRsvp = async (e: EventRow) => {
    if (!user) return;
    const going = rsvped[e.id];
    setRsvped((p) => ({ ...p, [e.id]: !going }));
    setEvents((prev) => prev.map((x) => x.id === e.id ? { ...x, rsvp_count: x.rsvp_count + (going ? -1 : 1) } : x));
    if (going) {
      await supabase.from("event_rsvps").delete().eq("event_id", e.id).eq("user_id", user.id);
    } else {
      await supabase.from("event_rsvps").insert({ event_id: e.id, user_id: user.id });
      toast.success(`You're going to ${e.title}! 🎉`);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <Header title="Events" subtitle="Hackathons, workshops, club nights" />
      {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
      <div className="px-5 mt-3 space-y-3">
        {events.map((e, i) => (
          <article key={e.id} className="rounded-3xl bg-card border border-border/60 shadow-soft overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="p-4 flex gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-hero flex items-center justify-center text-2xl shadow-soft text-primary-foreground">{e.emoji}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-tight">{e.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">by {e.organizer}</p>
                <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{e.description}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {format(new Date(e.starts_at), "MMM d, h:mm a")}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.rsvp_count} going</span>
                </div>
              </div>
            </div>
            <button onClick={() => toggleRsvp(e)} className={cn("w-full py-3 text-sm font-semibold transition-smooth",
              rsvped[e.id] ? "bg-success/15 text-success" : "bg-gradient-hero text-primary-foreground hover:shadow-glow")}>
              {rsvped[e.id] ? "✓ You're going" : "RSVP"}
            </button>
          </article>
        ))}
        {!loading && events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-semibold">No upcoming events</p>
          </div>
        )}
      </div>
    </div>
  );
};