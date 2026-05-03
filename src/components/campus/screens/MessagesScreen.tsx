import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { Header } from "../Header";
import { chats, findStudent, iceBreakers } from "@/data/mockData";
import { cn } from "@/lib/utils";

export const MessagesScreen = ({
  openWith,
  onClearOpen,
}: {
  openWith: string | null;
  onClearOpen: () => void;
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (openWith) {
      const t = chats.find((c) => c.studentId === openWith);
      setActiveId(t?.id ?? "new:" + openWith);
    }
  }, [openWith]);

  if (activeId) {
    const isNew = activeId.startsWith("new:");
    const studentId = isNew ? activeId.slice(4) : chats.find((c) => c.id === activeId)!.studentId;
    const thread = isNew
      ? { id: activeId, studentId, unread: 0, messages: [] as { fromMe: boolean; text: string; time: string }[] }
      : chats.find((c) => c.id === activeId)!;
    return (
      <ChatView
        thread={thread}
        onBack={() => {
          setActiveId(null);
          onClearOpen();
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in-up">
      <Header title="Messages" subtitle="Your campus conversations" />

      <div className="px-5 mt-3 space-y-1">
        {chats.map((t) => {
          const s = findStudent(t.studentId);
          const last = t.messages[t.messages.length - 1];
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-smooth text-left"
            >
              <img src={s.avatar} alt={s.name} loading="lazy" className="h-12 w-12 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <span className="text-[10px] text-muted-foreground">{last?.time}</span>
                </div>
                <p className={cn("text-xs truncate", t.unread ? "text-foreground font-semibold" : "text-muted-foreground")}>
                  {last?.fromMe && "You: "}{last?.text ?? "Say hi 👋"}
                </p>
              </div>
              {t.unread > 0 && (
                <span className="bg-accent text-accent-foreground text-[10px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center">
                  {t.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ChatView = ({
  thread,
  onBack,
}: {
  thread: { studentId: string; messages: { fromMe: boolean; text: string; time: string }[] };
  onBack: () => void;
}) => {
  const s = findStudent(thread.studentId);
  const [messages, setMessages] = useState(thread.messages);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { fromMe: true, text, time: "now" }]);
    setDraft("");
  };

  const sharedInterest = s.interests[0] ?? "tech";

  return (
    <div className="flex flex-col h-screen animate-fade-in-up">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl px-4 pt-6 pb-3 border-b border-border flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <img src={s.avatar} alt={s.name} className="h-10 w-10 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{s.name}</p>
          <p className="text-[11px] text-muted-foreground">{s.branch} · {s.year} year{s.openToMentor ? " · 🧑‍🏫 Mentor" : ""}</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-32">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex h-16 w-16 rounded-full bg-gradient-hero items-center justify-center text-primary-foreground mb-3 shadow-glow animate-pulse-glow">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="font-bold">Break the ice with {s.name.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Try one of these openers:</p>
            <div className="space-y-2">
              {iceBreakers.map((tpl) => {
                const t = tpl.replace("{interest}", sharedInterest);
                return (
                  <button
                    key={tpl}
                    onClick={() => send(t)}
                    className="w-full text-left text-sm p-3 rounded-2xl bg-card border border-border hover:border-accent hover:shadow-soft transition-smooth"
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-soft animate-scale-in",
                m.fromMe
                  ? "bg-gradient-hero text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              )}
            >
              {m.text}
              <div className={cn("text-[10px] mt-1 opacity-70", m.fromMe ? "text-right" : "")}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-3 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(draft)}
            placeholder="Write a message…"
            className="flex-1 bg-secondary rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => send(draft)}
            aria-label="Send"
            className="h-11 w-11 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-glow active:scale-95 transition-smooth"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};