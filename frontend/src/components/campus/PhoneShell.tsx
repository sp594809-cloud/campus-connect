import { ReactNode } from "react";

export const PhoneShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent-soft">
    <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-elevated overflow-hidden">
      <div className="pb-28 min-h-screen">{children}</div>
    </div>
  </div>
);