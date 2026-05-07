// Tiny event bus for floating reward animations
type Reward = { id: string; points: number; label: string; kind: "aspire" | "legacy" };
type Listener = (r: Reward) => void;

const listeners = new Set<Listener>();

export const onReward = (l: Listener) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

export const emitReward = (points: number, label: string, kind: "aspire" | "legacy" = "aspire") => {
  const r: Reward = { id: Math.random().toString(36).slice(2), points, label, kind };
  listeners.forEach((l) => l(r));
};

export type { Reward };