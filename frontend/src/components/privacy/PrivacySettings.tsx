import { useEffect, useState } from "react";
import { Eye, EyeOff, Globe, Lock, Users, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Visibility = "public" | "connections" | "private";

export const PrivacySettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [discoverable, setDiscoverable] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("connections");
  const [incognito, setIncognito] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const p = profile as unknown as { discoverable?: boolean; profile_visibility?: Visibility; views_incognito?: boolean };
    setDiscoverable(!!p.discoverable);
    setVisibility(p.profile_visibility ?? "connections");
    setIncognito(!!p.views_incognito);
  }, [profile]);

  const save = async (patch: Record<string, unknown>) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Privacy updated");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-sm">Privacy</h3>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      <Row
        title="Appear in Discover"
        desc="When off, no one finds you in Discover or interest search. You can still chat with connections."
        checked={discoverable}
        onChange={(v) => { setDiscoverable(v); save({ discoverable: v }); }}
      />

      <div>
        <p className="font-semibold text-sm">Who can view your profile</p>
        <p className="text-[11px] text-muted-foreground mb-2">Defaults to connections only.</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { v: "public", icon: Globe, label: "Anyone" },
            { v: "connections", icon: Users, label: "Connections" },
            { v: "private", icon: Lock, label: "Only me" },
          ] as const).map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              onClick={() => { setVisibility(v); save({ profile_visibility: v }); }}
              className={cn(
                "rounded-2xl border p-3 text-xs font-semibold flex flex-col items-center gap-1 transition-smooth",
                visibility === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-secondary-foreground",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <Row
        title="Browse in incognito"
        desc="Your profile views won't show up in other people's lists. You also won't see your own viewers."
        icon={incognito ? EyeOff : Eye}
        checked={incognito}
        onChange={(v) => { setIncognito(v); save({ views_incognito: v }); }}
      />
    </div>
  );
};

const Row = ({ title, desc, checked, onChange, icon: Icon }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ElementType }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <div className="flex-1">
      <p className="font-semibold text-sm flex items-center gap-1.5">{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 rounded-full transition-smooth shrink-0", checked ? "bg-primary" : "bg-secondary")}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-soft transition-smooth", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  </label>
);