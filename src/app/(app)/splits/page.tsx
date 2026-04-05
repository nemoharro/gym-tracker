"use client";

import { useState } from "react";
import { useSplits, DAY_NAMES } from "@/hooks/useSplits";
import { Loader2, Plus, Trash2, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

const PRESETS = ["Push / Pull / Legs", "Upper / Lower", "Full Body", "Bro Split"];

export default function SplitsPage() {
  const { splits, schedule, loading, createPresetSplit, createSplit, deleteSplit, updateSchedule } = useSplits();
  const [showCreate, setShowCreate] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreatePreset(preset: string) {
    setCreating(true);
    await createPresetSplit(preset);
    setCreating(false);
  }

  async function handleCreateCustom() {
    if (!newName.trim() || !newDays.trim()) return;
    setCreating(true);
    const dayNames = newDays.split(",").map((d) => d.trim()).filter(Boolean);
    await createSplit(newName.trim(), "", dayNames);
    setNewName("");
    setNewDays("");
    setShowCreate(false);
    setCreating(false);
  }

  async function handleDelete(splitId: number) {
    await deleteSplit(splitId);
  }

  // Get all split days across all splits for schedule assignment
  const allSplitDays = splits.flatMap((s) => s.days.map((d) => ({ ...d, splitName: s.name })));

  function getScheduleForDay(dayOfWeek: number) {
    return schedule.find((s) => s.day_of_week === dayOfWeek);
  }

  async function handleScheduleChange(dayOfWeek: number, splitDayId: string) {
    if (splitDayId === "rest") {
      await updateSchedule(dayOfWeek, null, true);
    } else if (splitDayId === "none") {
      await updateSchedule(dayOfWeek, null, false);
    } else {
      await updateSchedule(dayOfWeek, parseInt(splitDayId), false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Workout Splits</h1>

      {/* Existing splits */}
      {splits.length > 0 && (
        <div className="space-y-3">
          {splits.map((split) => (
            <div key={split.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <Link href={`/splits/${split.id}`} className="flex-1">
                  <h2 className="font-semibold">{split.name}</h2>
                  <p className="text-xs text-muted">{split.days.length} days &middot; {split.days.map((d) => d.name).join(", ")}</p>
                </Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(split.id)} className="p-1.5 text-muted hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link href={`/splits/${split.id}`}>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule */}
      <button
        onClick={() => setShowSchedule(!showSchedule)}
        className="w-full flex items-center gap-2 p-4 bg-card rounded-xl border border-border text-sm font-medium"
      >
        <Calendar className="h-4 w-4 text-primary" />
        Weekly Schedule
        <ChevronRight className={`h-4 w-4 text-muted ml-auto transition-transform ${showSchedule ? "rotate-90" : ""}`} />
      </button>

      {showSchedule && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          {DAY_NAMES.map((dayName, i) => {
            const sched = getScheduleForDay(i);
            const currentValue = sched?.is_rest_day ? "rest" : sched?.split_day_id ? String(sched.split_day_id) : "none";
            return (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-medium w-24">{dayName}</span>
                <select
                  value={currentValue}
                  onChange={(e) => handleScheduleChange(i, e.target.value)}
                  className="flex-1 ml-2 px-2 py-1.5 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="none">—</option>
                  <option value="rest">Rest Day</option>
                  {allSplitDays.map((sd) => (
                    <option key={sd.id} value={String(sd.id)}>
                      {sd.splitName} — {sd.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {/* Presets */}
      {splits.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted">Quick start with a preset:</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleCreatePreset(preset)}
                disabled={creating}
                className="p-3 bg-card border border-border rounded-xl text-sm font-medium text-left hover:border-primary transition-colors disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create custom */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted font-medium flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Custom Split
        </button>
      ) : (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm">New Split</h3>
          <input
            type="text"
            placeholder="Split name (e.g. Push Pull Legs)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Day names, comma-separated (e.g. Push, Pull, Legs)"
            value={newDays}
            onChange={(e) => setNewDays(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCreate(false); setNewName(""); setNewDays(""); }}
              className="flex-1 py-2 rounded-lg bg-secondary text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCustom}
              disabled={creating || !newName.trim() || !newDays.trim()}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Presets button when splits exist */}
      {splits.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted">Add a preset:</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((p) => !splits.some((s) => s.name === p)).map((preset) => (
              <button
                key={preset}
                onClick={() => handleCreatePreset(preset)}
                disabled={creating}
                className="px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
