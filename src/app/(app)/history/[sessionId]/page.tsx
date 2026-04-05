"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Clock, FileText, Pencil, Check, X, Trash2, Plus } from "lucide-react";

interface SetData {
  id: number;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
}

interface ExerciseGroup {
  exerciseId: number;
  exerciseName: string;
  sets: SetData[];
}

interface SessionDetail {
  id: number;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  exercises: ExerciseGroup[];
}

export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editSets, setEditSets] = useState<Map<number, { weight_kg: number; reps: number; rpe: number | null }>>(new Map());
  const [saving, setSaving] = useState(false);

  const sessionId = Number(params.sessionId);

  useEffect(() => {
    if (!sessionId || isNaN(sessionId)) return;
    fetchSession();
  }, [params.sessionId]);

  async function fetchSession() {
    setLoading(true);

    const { data: sessionData } = await supabase
      .from("workout_sessions")
      .select("id, started_at, finished_at, notes")
      .eq("id", sessionId)
      .single();

    if (!sessionData) {
      setSession(null);
      setLoading(false);
      return;
    }

    const { data: sets } = await supabase
      .from("workout_sets")
      .select("id, exercise_id, set_number, weight_kg, reps, rpe")
      .eq("session_id", sessionId)
      .order("exercise_id", { ascending: true })
      .order("set_number", { ascending: true });

    const exerciseIds = [...new Set((sets ?? []).map((s) => s.exercise_id))];
    const exerciseMap = new Map<number, string>();

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

    const groupMap = new Map<number, ExerciseGroup>();
    for (const s of sets ?? []) {
      if (!groupMap.has(s.exercise_id)) {
        groupMap.set(s.exercise_id, {
          exerciseId: s.exercise_id,
          exerciseName: exerciseMap.get(s.exercise_id) ?? "Unknown",
          sets: [],
        });
      }
      groupMap.get(s.exercise_id)!.sets.push({
        id: s.id,
        set_number: s.set_number,
        weight_kg: Number(s.weight_kg),
        reps: Number(s.reps),
        rpe: s.rpe != null ? Number(s.rpe) : null,
      });
    }

    const exerciseGroups: ExerciseGroup[] = [];
    const seen = new Set<number>();
    for (const s of sets ?? []) {
      if (!seen.has(s.exercise_id)) {
        seen.add(s.exercise_id);
        exerciseGroups.push(groupMap.get(s.exercise_id)!);
      }
    }

    setSession({
      id: sessionData.id,
      started_at: sessionData.started_at,
      finished_at: sessionData.finished_at,
      notes: sessionData.notes,
      exercises: exerciseGroups,
    });
    setLoading(false);
  }

  function startEditing() {
    if (!session) return;
    setIsEditing(true);
    setEditNotes(session.notes ?? "");
    const map = new Map<number, { weight_kg: number; reps: number; rpe: number | null }>();
    for (const group of session.exercises) {
      for (const set of group.sets) {
        map.set(set.id, { weight_kg: set.weight_kg, reps: set.reps, rpe: set.rpe });
      }
    }
    setEditSets(map);
  }

  function updateEditSet(setId: number, field: string, value: number | null) {
    setEditSets((prev) => {
      const next = new Map(prev);
      const current = next.get(setId);
      if (current) {
        next.set(setId, { ...current, [field]: value });
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);

    // Update notes
    await supabase
      .from("workout_sessions")
      .update({ notes: editNotes || null, edited_at: new Date().toISOString() })
      .eq("id", sessionId);

    // Update each set
    for (const [setId, values] of editSets) {
      await supabase
        .from("workout_sets")
        .update({
          weight_kg: values.weight_kg,
          reps: values.reps,
          rpe: values.rpe,
        })
        .eq("id", setId);
    }

    setSaving(false);
    setIsEditing(false);
    fetchSession();
  }

  async function handleDeleteSet(setId: number) {
    await supabase.from("workout_sets").delete().eq("id", setId);
    fetchSession();
  }

  async function handleAddSet(exerciseId: number, currentSetCount: number) {
    await supabase.from("workout_sets").insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      set_number: currentSetCount + 1,
      weight_kg: 0,
      reps: 0,
    });
    fetchSession();
    // Re-enter edit mode to edit the new set
    setTimeout(() => startEditing(), 300);
  }

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
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-muted active:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {!isEditing ? (
          <button
            onClick={startEditing}
            className="flex items-center gap-1 text-sm text-primary font-medium"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 text-sm text-muted"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 text-sm text-primary font-medium disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

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
      {isEditing ? (
        <div className="bg-card border border-border rounded-xl p-3 mb-4">
          <label className="text-xs text-muted block mb-1">Notes</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Add notes..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
            rows={2}
          />
        </div>
      ) : session.notes ? (
        <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-start gap-2">
          <FileText className="h-4 w-4 text-muted mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted">{session.notes}</p>
        </div>
      ) : null}

      {/* Exercises */}
      <div className="space-y-4">
        {session.exercises.map((group) => (
          <div key={group.exerciseId} className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold text-foreground mb-3">
              {group.exerciseName}
            </h2>
            <div className="space-y-1.5">
              {/* Header row */}
              <div className="grid grid-cols-4 text-xs text-muted px-1">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>{isEditing ? "" : "RPE"}</span>
              </div>
              {group.sets.map((set) => {
                const editVals = editSets.get(set.id);
                return isEditing && editVals ? (
                  <div key={set.id} className="grid grid-cols-4 gap-1 text-sm px-1 py-1 items-center">
                    <span className="text-muted">{set.set_number}</span>
                    <input
                      type="number"
                      value={editVals.weight_kg}
                      onChange={(e) => updateEditSet(set.id, "weight_kg", parseFloat(e.target.value) || 0)}
                      className="w-full px-1.5 py-1 bg-background border border-border rounded text-sm text-center"
                    />
                    <input
                      type="number"
                      value={editVals.reps}
                      onChange={(e) => updateEditSet(set.id, "reps", parseInt(e.target.value) || 0)}
                      className="w-full px-1.5 py-1 bg-background border border-border rounded text-sm text-center"
                    />
                    <button
                      onClick={() => handleDeleteSet(set.id)}
                      className="p-1 text-muted hover:text-destructive justify-self-center"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    key={set.id}
                    className="grid grid-cols-4 text-sm px-1 py-1 rounded bg-secondary/50"
                  >
                    <span className="text-muted">{set.set_number}</span>
                    <span className="text-foreground">{set.weight_kg} kg</span>
                    <span className="text-foreground">{set.reps}</span>
                    <span className="text-muted">
                      {set.rpe != null ? set.rpe : "-"}
                    </span>
                  </div>
                );
              })}
              {isEditing && (
                <button
                  onClick={() => handleAddSet(group.exerciseId, group.sets.length)}
                  className="flex items-center gap-1 text-xs text-primary mx-auto mt-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Set
                </button>
              )}
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
