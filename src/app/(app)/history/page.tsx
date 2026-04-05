"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Clock, Dumbbell, ChevronRight, Trash2 } from "lucide-react";

interface WorkoutSummary {
  id: number;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  exerciseNames: string[];
  totalSets: number;
}

export default function HistoryPage() {
  const supabase = createClient();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchHistory() {

      // Get all completed sessions (most recent first)
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id, started_at, finished_at, notes")
        .order("started_at", { ascending: false });

      if (!sessions || sessions.length === 0) {
        setWorkouts([]);
        setLoading(false);
        return;
      }

      const sessionIds = sessions.map((s) => s.id);

      // Get all sets for these sessions
      const { data: sets } = await supabase
        .from("workout_sets")
        .select("session_id, exercise_id")
        .in("session_id", sessionIds);

      // Get all exercises to map IDs to names
      const { data: exercises } = await supabase
        .from("exercises")
        .select("id, name");

      const exerciseMap = new Map<number, string>();
      if (exercises) {
        for (const e of exercises) {
          exerciseMap.set(e.id, e.name);
        }
      }

      // Group sets by session
      const setsBySession = new Map<number, Set<number>>();
      const setCountBySession = new Map<number, number>();
      if (sets) {
        for (const s of sets) {
          if (!setsBySession.has(s.session_id)) {
            setsBySession.set(s.session_id, new Set());
            setCountBySession.set(s.session_id, 0);
          }
          setsBySession.get(s.session_id)!.add(s.exercise_id);
          setCountBySession.set(
            s.session_id,
            (setCountBySession.get(s.session_id) ?? 0) + 1
          );
        }
      }

      const summaries: WorkoutSummary[] = sessions.map((session) => {
        const exerciseIds = setsBySession.get(session.id) ?? new Set();
        const exerciseNames = [...exerciseIds].map(
          (id) => exerciseMap.get(id) ?? "Unknown"
        );
        return {
          id: session.id,
          started_at: session.started_at,
          finished_at: session.finished_at,
          notes: session.notes,
          exerciseNames,
          totalSets: setCountBySession.get(session.id) ?? 0,
        };
      });

      setWorkouts(summaries);
      setLoading(false);
    }

    fetchHistory();
  }, []);

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function formatDuration(startStr: string, endStr: string | null): string | null {
    if (!endStr) return null;
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const mins = Math.round((end - start) / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  async function handleDeleteSession(sessionId: number) {
    if (!confirm("Delete this workout? This cannot be undone.")) return;
    setDeletingId(sessionId);
    const { error } = await supabase.from("workout_sessions").delete().eq("id", sessionId);
    if (error) {
      alert("Failed to delete workout. Please try again.");
      setDeletingId(null);
      return;
    }
    setWorkouts((prev) => prev.filter((w) => w.id !== sessionId));
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Workout History</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-card animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Workout History</h1>
        <div className="flex flex-col items-center justify-center py-16 text-muted">
          <Dumbbell className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">No workouts yet</p>
          <p className="text-sm mt-1">Complete a workout to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Workout History</h1>
      <div className="space-y-3">
        {workouts.map((w) => {
          const duration = formatDuration(w.started_at, w.finished_at);
          return (
            <div key={w.id} className="bg-card border border-border rounded-xl p-4 active:bg-secondary transition-colors">
              <div className="flex items-start justify-between">
                <Link href={`/history/${w.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {formatDate(w.started_at)}
                    </span>
                    {duration && (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="h-3 w-3" />
                        {duration}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mb-2">
                    {w.exerciseNames.length} exercise{w.exerciseNames.length !== 1 ? "s" : ""} &middot; {w.totalSets} set{w.totalSets !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted truncate">
                    {w.exerciseNames.join(", ")}
                  </p>
                </Link>
                <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                  <button
                    onClick={() => handleDeleteSession(w.id)}
                    disabled={deletingId === w.id}
                    className="p-1.5 text-muted hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link href={`/history/${w.id}`}>
                    <ChevronRight className="h-5 w-5 text-muted" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
