import { ShieldCheck, Briefcase, GraduationCap, Sparkles, MessageCircle, Download, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { avatarFor } from "@/hooks/useProfiles";

export interface PassportProfile {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  branch: string | null;
  year: string | null;
  college_name: string | null;
  graduation_year: number | null;
  placement_status: string;
  company: string | null;
  karma_total: number;
  verified: boolean;
  resume_url: string | null;
  bio: string | null;
}

export const PassportHeader = ({
  p,
  isOwner,
  isAdmin,
  onConnect,
  onMessage,
  onVerify,
}: {
  p: PassportProfile;
  isOwner: boolean;
  isAdmin: boolean;
  onConnect?: () => void;
  onMessage?: () => void;
  onVerify?: () => void;
}) => (
  <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-6 shadow-elevated relative overflow-hidden">
    <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
    <div className="relative flex flex-col sm:flex-row gap-5 items-start">
      <img src={avatarFor(p)} alt={p.name} className="h-24 w-24 rounded-2xl object-cover ring-4 ring-primary-foreground/20 shadow-soft" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold leading-tight">{p.name}</h1>
          {p.verified && <Badge className="bg-success text-success-foreground gap-1"><BadgeCheck className="h-3 w-3" /> Verified</Badge>}
        </div>
        {p.username && <p className="text-sm opacity-80">@{p.username}</p>}
        <p className="text-xs opacity-90 mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{p.branch ?? "—"} · {p.year ?? "—"}</span>
          {p.college_name && <span>· {p.college_name}</span>}
          {p.graduation_year && <span>· Class of {p.graduation_year}</span>}
        </p>
        {p.placement_status === "Placed" && p.company && (
          <p className="text-xs opacity-95 mt-1 flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> Placed @ {p.company}</p>
        )}
        {p.bio && <p className="text-sm opacity-90 mt-3 line-clamp-2">{p.bio}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> {p.karma_total} Karma</Badge>
          <Badge variant="secondary">{p.placement_status}</Badge>
        </div>
      </div>
    </div>
    {!isOwner && (
      <div className="relative mt-5 flex flex-wrap gap-2">
        <Button onClick={onConnect} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Sparkles className="h-4 w-4 mr-1" /> Connect</Button>
        <Button onClick={onMessage} variant="secondary"><MessageCircle className="h-4 w-4 mr-1" /> Message</Button>
        {p.resume_url && (
          <Button asChild variant="secondary"><a href={p.resume_url} target="_blank" rel="noreferrer"><Download className="h-4 w-4 mr-1" /> Resume</a></Button>
        )}
        {isAdmin && !p.verified && (
          <Button onClick={onVerify} variant="secondary"><ShieldCheck className="h-4 w-4 mr-1" /> Verify Student</Button>
        )}
      </div>
    )}
  </div>
);