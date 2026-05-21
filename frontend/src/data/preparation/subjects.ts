import { Brain, Database, Cpu, Wifi, Calculator, Users, Scale, Code2, FileCode, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SubjectMode = "coding" | "theory";

export type SubjectMeta = {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  mode: SubjectMode;
  topicsCount: number;
  description: string;
};

export const SUBJECTS: SubjectMeta[] = [
  { id: "dsa",          name: "DSA",                icon: Brain,      color: "text-blue-500",    mode: "coding", topicsCount: 12, description: "Algorithms & data structures" },
  { id: "javascript",   name: "JavaScript",         icon: Code2,      color: "text-yellow-500",  mode: "coding", topicsCount: 8,  description: "Functions, async, DOM" },
  { id: "python",       name: "Python",             icon: FileCode,   color: "text-emerald-500", mode: "coding", topicsCount: 8,  description: "Loops, comprehensions, OOP" },
  { id: "dbms",         name: "Database",           icon: Database,   color: "text-green-500",   mode: "theory", topicsCount: 8,  description: "SQL, keys, normalization" },
  { id: "os",           name: "Operating Systems",  icon: Cpu,        color: "text-purple-500",  mode: "theory", topicsCount: 6,  description: "Processes, memory, threads" },
  { id: "cn",           name: "Computer Networks",  icon: Wifi,       color: "text-orange-500",  mode: "theory", topicsCount: 5,  description: "OSI, TCP/IP, routing" },
  { id: "aptitude",     name: "Aptitude",           icon: Calculator, color: "text-pink-500",    mode: "theory", topicsCount: 10, description: "Quant & reasoning" },
  { id: "softskills",   name: "Soft Skills",        icon: Users,      color: "text-rose-500",    mode: "theory", topicsCount: 4,  description: "Comm, HR scenarios" },
  { id: "systemdesign", name: "System Design",      icon: Scale,      color: "text-indigo-500",  mode: "theory", topicsCount: 5,  description: "Scale, caching, queues" },
  { id: "aiml",         name: "AI & ML",            icon: Sparkles,   color: "text-fuchsia-500", mode: "theory", topicsCount: 6,  description: "ML basics, NN intuition" },
];

export const getSubject = (id: string): SubjectMeta | undefined =>
  SUBJECTS.find((s) => s.id === id);

export const isCoding = (id: string): boolean => getSubject(id)?.mode === "coding";
export const isTheory = (id: string): boolean => getSubject(id)?.mode === "theory";
