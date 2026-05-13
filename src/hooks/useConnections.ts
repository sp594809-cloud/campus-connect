import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ConnState, ConnRow } from "@/core/types";

export const useConnections = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ConnRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("connection_requests")
      .select("id,requester_id,recipient_id,status,message,created_at")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as ConnRow[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`conn-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "connection_requests" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, load]);

  const stateWith = (otherId: string): { state: ConnState; row?: ConnRow } => {
    const row = rows.find((r) => (r.requester_id === otherId && r.recipient_id === user?.id) || (r.recipient_id === otherId && r.requester_id === user?.id));
    if (!row) return { state: "none" };
    if (row.status === "accepted") return { state: "accepted", row };
    if (row.status === "declined") return { state: "declined", row };
    return { state: row.requester_id === user?.id ? "pending_out" : "pending_in", row };
  };

  const pendingIncoming = rows.filter((r) => r.recipient_id === user?.id && r.status === "pending");

  return { rows, loading, stateWith, pendingIncoming, reload: load };
};

// Re-export types for convenience
export type { ConnState, ConnRow };
