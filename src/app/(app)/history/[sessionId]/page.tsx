"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Clock, FileText } from "lucide-react";

interface SetData {
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
}

interface ExerciseGroup {
  exerciseName: string;
  sets: SetData[];
}

interface SessionDetail {
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  exercises: ExerciseGroup[];
}

export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = Number(params.sessionId);
    if (!sessionId || isNaN(sessionId)) return;

    async function fetchSession() {
      setLoading(true);
      const supabase = createClient();

      // Fetch the session
      const { data: sessionData } = await supabase
        .from("workout_sessions")
        .select("started_at, finished_at, notes")
        .eq("id", sessionId)
        .single();

      if (!sessionData) {
        setSession(null);
        setLoading(false);
        return;
      }

      // Fetch all sets for this session
      const { data: sets } = await supabase
        .from("workout_sets")
        .select("exercise_id, set_number, weight_kg, reps, rpe")
        .eq("session_id", sessionId)
        .order("exercise_id", { ascending: true })
        .order("set_number", { ascending: true });

      // Fetch exercise names
      const exerciseIds = [...new Set((sets ?? []).map((s) => s.exercise_id))];
      let exerciseMap = new Map<number, string>();

      if (exerciseIds.length > 0) {
        const { data: exercises } = await supabase
          .from("exercises")
          .select("id, name")
          .in("id", exerciseIds);

        if (exercises) {
          for (const e of exercises) {
            exerciseMap.set(e.id, e.name);
          }
        }
      }

      // Group sets by exercise
      const groupMap = new Map<number, ExerciseGroup>();
      for (const s of sets ?? []) {
        if (!groupMap.has(s.exercise_id)) {
          groupMap.set(s.exercise_id, {
            exerciseName: exerciseMap.get(s.exercise_id) ?? "Unknown",
            sets: [],
          });
        }
        groupMap.get(s.exercise_id)!.sets.push({
          set_number: s.set_number,
          weight_kg: Number(s.weight_kg),
          reps: Number(s.reps),
          rpe: s.rpe != null ? Number(s.rpe) : null,
        });
      }

      // Maintain order by first appearance
      const exerciseGroups: ExerciseGroup[] = [];
      const seen = new Set<number>();
      for (const s of sets ?? []) {
        if (!seen.has(s.exercise_id)) {
          seen.add(s.exercise_id);
          exerciseGroups.push(groupMap.get(s.exercise_id)!);
        }
      }

      setSession({
        started_at: sessionData.started_at,
        finished_at: sessionData.finished_at,
        notes: sessionData.notes,
        exercises: exerciseGroups,
      });
      setLoading(false);
    }

    fetchSession();
  }, [params.sessionId]);

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDuration(startStr: string, endStr: string | null): string | null {
    if (!endStr) return null;
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const mins = Math.round((end - start) / 60000);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-8 w-32 rounded bg-card animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-muted mb-4 active:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <p className="text-muted text-center py-16">Workout not found.</p>
      </div>
    );
  }

  const duration = formatDuration(session.started_at, session.finished_at);

  return (
    <div className="p-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-muted mb-4 active:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">
          {formatDate(session.started_at)}
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>{formatTime(session.started_at)}</span>
          {duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {duration}
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-start gap-2">
          <FileText className="h-4 w-4 text-muted mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted">{session.notes}</p>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4">
        {session.exercises.map((group, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold text-foreground mb-3">
              {group.exerciseName}
            </h2>
            <div className="space-y-1.5">
              {/* Header row */}
              <div className="grid grid-cols-4 text-xs text-muted px-1">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>RPE</span>
              </div>
              {group.sets.map((set) => (
                <div
                  key={set.set_number}
                  className="grid grid-cols-4 text-sm px-1 py-1 rounded bg-secondary/50"
                >
                  <span className="text-muted">{set.set_number}</span>
                  <span className="text-foreground">{set.weight_kg} kg</span>
                  <span className="text-foreground">{set.reps}</span>
                  <span className="text-muted">
                    {set.rpe != null ? set.rpe : "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {session.exercises.length === 0 && (
        <p className="text-muted text-center py-8">
          No exercises recorded in this workout.
        </p>
      )}
    </div>
  );
}
