import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, GraduationCap, Send, Sparkles, X } from "lucide-react";
import { Header } from "../Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avatarFor, type PublicProfile } from "@/hooks/useProfiles";
import { useMentors, fetchPublicProfilesByIds } from "@/lib/api/profiles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RequestRow {
  id: string; requester_id: string; mentor_id: string; topic: string; message: string;
  status: "pending" | "accepted" | "declined"; created_at: string;
  requester?: PublicProfile; mentor?: PublicProfile;
}

const tabs = ["Find Mentor", "My Requests", "Incoming"] as const;

export const MentorshipScreen = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<typeof tabs[number]>("Find Mentor");
  const [askMentor, setAskMentor] = useState<PublicProfile | null>(null);
  const [topic, setTopic] = useState(""); const [msg, setMsg] = useState("");

  const { data: mentors = [] } = useMentors(user?.id);

  const { data: requests = [], refetch: refetchRequests } = useQuery<RequestRow[]>({
    queryKey: ["mentorship", "requests", user?.id ?? null],
    enabled: !!user,
    queryFn: async () => {
      const { data: rs, error } = await supabase
        .from("mentorship_requests")
        .select("*")
        .or(`requester_id.eq.${user!.id},mentor_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (rs ?? []) as RequestRow[];
      const ids = Array.from(new Set(rows.flatMap((r) => [r.requester_id, r.mentor_id])));
      const profs = await fetchPublicProfilesByIds(ids);
      const pmap = new Map(profs.map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, requester: pmap.get(r.requester_id), mentor: pmap.get(r.mentor_id) }));
    },
  });

  const submit = async () => {
    if (!user || !askMentor || !topic.trim()) return;
    const { error } = await supabase.from("mentorship_requests").insert({
      requester_id: user.id, mentor_id: askMentor.id, topic: topic.trim().slice(0, 100), message: msg.trim().slice(0, 500),
    });
    if (error) return toast.error(error.message);
    toast.success("Mentorship request sent!");
    setAskMentor(null); setTopic(""); setMsg("");
    refetchRequests();
  };

  const respond = async (r: RequestRow, status: "accepted" | "declined") => {
    const { error } = await supabase.from("mentorship_requests").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(status === "accepted" ? "Accepted! Reach out via chat." : "Declined.");
    refetchRequests();
    queryClient.invalidateQueries({ queryKey: ["mentorship"] });
  };

  const myRequests = useMemo(() => requests.filter((r) => r.requester_id === user?.id), [requests, user?.id]);
  const incoming = useMemo(() => requests.filter((r) => r.mentor_id === user?.id), [requests, user?.id]);

  return (
    <div className="animate-fade-in-up">
      <Header title="Mentorship" subtitle="Find seniors. Help juniors." />
      <div className="px-5 mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-smooth",
            tab === t ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground")}>
            {t}{t === "Incoming" && incoming.filter((r) => r.status === "pending").length > 0 && (
              <span className="ml-1.5 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {incoming.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "Find Mentor" && (
        <div className="px-5 mt-4 space-y-3">
          {!profile?.open_to_mentor && (
            <div className="rounded-2xl bg-gradient-card border border-accent/30 p-4">
              <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Want to mentor too?</p>
              <p className="text-xs text-muted-foreground mt-1">Toggle "open to mentor" in your profile setup.</p>
            </div>
          )}
          {mentors.map((m) => (
            <div key={m.id} className="rounded-2xl bg-card border border-border/60 shadow-soft p-4">
              <div className="flex items-center gap-3">
                <img src={avatarFor(m)} alt={m.name} className="h-14 w-14 rounded-2xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="h-3 w-3" />{m.branch ?? "—"} · {m.year ?? "—"} year</p>
                  {m.placement_status === "Placed" && m.company && <p className="text-xs text-success font-semibold mt-0.5">@ {m.company}</p>}
                </div>
                <button onClick={() => setAskMentor(m)} className="px-3 py-2 rounded-full bg-gradient-hero text-primary-foreground text-xs font-semibold shadow-soft">Request</button>
              </div>
              {m.bio && <p className="text-xs text-foreground/80 mt-2 line-clamp-2">{m.bio}</p>}
            </div>
          ))}
          {mentors.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No mentors available yet.</p>}
        </div>
      )}

      {tab === "My Requests" && (
        <div className="px-5 mt-4 space-y-3">
          {myRequests.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card border border-border/60 shadow-soft p-4">
              <div className="flex items-center gap-3">
                <img src={avatarFor(r.mentor!)} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.mentor?.name}</p>
                  <p className="text-xs text-muted-foreground">Topic: {r.topic}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
          {myRequests.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No requests sent yet.</p>}
        </div>
      )}

      {tab === "Incoming" && (
        <div className="px-5 mt-4 space-y-3">
          {incoming.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card border border-border/60 shadow-soft p-4">
              <div className="flex items-center gap-3">
                <img src={avatarFor(r.requester!)} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.requester?.name}</p>
                  <p className="text-xs text-muted-foreground">wants help with: {r.topic}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.message && <p className="text-sm mt-3 p-3 rounded-xl bg-secondary text-foreground">{r.message}</p>}
              {r.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => respond(r, "accepted")} className="flex-1 py-2 rounded-xl bg-success text-success-foreground font-semibold text-sm flex items-center justify-center gap-1"><Check className="h-4 w-4" /> Accept</button>
                  <button onClick={() => respond(r, "declined")} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm"><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          ))}
          {incoming.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No incoming requests.</p>}
        </div>
      )}

      {askMentor && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in-up" onClick={() => setAskMentor(null)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-elevated animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <img src={avatarFor(askMentor)} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="font-bold text-sm">Ask {askMentor.name.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground">for mentorship</p>
              </div>
              <button onClick={() => setAskMentor(null)} aria-label="Close" className="ml-auto h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g. Placement prep, ML projects)" maxLength={100} className="w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 500))} rows={4} placeholder="A short message — what do you want help with?" className="mt-2 w-full px-4 py-3 rounded-2xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <button onClick={submit} disabled={!topic.trim()} className="mt-3 w-full py-3 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="h-4 w-4" /> Send request
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: "bg-secondary text-secondary-foreground",
    accepted: "bg-success/15 text-success",
    declined: "bg-destructive/15 text-destructive",
  };
  return <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full", map[status])}>{status}</span>;
};