import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import { DEFAULT_FILTERS, type TalentFilterState } from "./types";

const BRANCHES = ["any","CSE","IT","ECE","EE","ME","CE","Other"];

export const TalentFilters = ({
  value, onChange,
}: { value: TalentFilterState; onChange: (v: TalentFilterState) => void }) => {
  const set = <K extends keyof TalentFilterState>(k: K, v: TalentFilterState[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={value.search} onChange={(e)=>set("search", e.target.value)} placeholder="Search name, username, branch, skill…" className="pl-9" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Branch</Label>
          <Select value={value.branch} onValueChange={(v)=>set("branch", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{BRANCHES.map(b => <SelectItem key={b} value={b}>{b === "any" ? "Any" : b}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Grad. Year</Label>
          <Select value={value.graduation_year} onValueChange={(v)=>set("graduation_year", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {[2024,2025,2026,2027,2028].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Placement</Label>
          <Select value={value.placement_status} onValueChange={(v)=>set("placement_status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["any","Placed","Looking","Interning","N/A"].map(s => <SelectItem key={s} value={s}>{s === "any" ? "Any" : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Verified</Label>
          <Select value={value.verified} onValueChange={(v)=>set("verified", v as "any"|"yes"|"no")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Verified only</SelectItem>
              <SelectItem value="no">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">College</Label>
          <Input value={value.college_name} onChange={(e)=>set("college_name", e.target.value)} placeholder="e.g. NIT" />
        </div>
        <div>
          <Label className="text-xs">Skill contains</Label>
          <Input value={value.skill} onChange={(e)=>set("skill", e.target.value)} placeholder="React, DSA…" />
        </div>
        <div>
          <Label className="text-xs">Min Streak</Label>
          <Input type="number" min={0} value={value.minStreak} onChange={(e)=>set("minStreak", Number(e.target.value)||0)} />
        </div>
        <div>
          <Label className="text-xs">Min Karma</Label>
          <Input type="number" min={0} value={value.minKarma} onChange={(e)=>set("minKarma", Number(e.target.value)||0)} />
        </div>
        <div className="flex items-end">
          <Button variant="ghost" className="w-full" onClick={()=>onChange(DEFAULT_FILTERS)}><X className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
      </div>
    </div>
  );
};