"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X, Plus } from "lucide-react";
import { useExercises, type Exercise } from "@/hooks/useExercises";
import { cn } from "@/lib/utils";

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ open, onOpenChange, onSelect }: ExercisePickerProps) {
  const { grouped, loading, search, setSearch } = useExercises();

  function handleSelect(exercise: Exercise) {
    onSelect(exercise);
    onOpenChange(false);
    setSearch("");
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 top-12 bg-background rounded-t-2xl z-50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <Dialog.Title className="text-lg font-bold">Add Exercise</Dialog.Title>
              <Dialog.Close className="p-1 rounded-full hover:bg-secondary">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <p className="text-muted text-center py-8">Loading exercises...</p>
            ) : Object.keys(grouped).length === 0 ? (
              <p className="text-muted text-center py-8">No exercises found</p>
            ) : (
              Object.entries(grouped).map(([group, exercises]) => (
                <div key={group} className="mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {exercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => handleSelect(exercise)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-card active:bg-secondary transition-colors text-left"
                      >
                        <div>
                          <span className="font-medium">{exercise.name}</span>
                          {exercise.equipment && (
                            <span className="text-xs text-muted ml-2">{exercise.equipment}</span>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
