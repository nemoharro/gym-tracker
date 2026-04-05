"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Save } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [calories, setCalories] = useState("2500");
  const [protein, setProtein] = useState("180");
  const [carbs, setCarbs] = useState("250");
  const [fat, setFat] = useState("80");
  const [fiber, setFiber] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("nutrition_targets")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (data) {
        setCalories(String(data.calories));
        setProtein(String(data.protein_g));
        setCarbs(String(data.carbs_g));
        setFat(String(data.fat_g));
        setFiber(String(data.fiber_g ?? 30));
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if row exists
    const { data: existing } = await supabase
      .from("nutrition_targets")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const p = parseInt(protein) || 180;
    const c = parseInt(carbs) || 250;
    const f = parseInt(fat) || 80;
    const values = {
      user_id: user.id,
      calories: (p * 4) + (c * 4) + (f * 9),
      protein_g: p,
      carbs_g: c,
      fat_g: f,
      fiber_g: parseInt(fiber) || 30,
    };

    if (existing) {
      await supabase
        .from("nutrition_targets")
        .update(values)
        .eq("id", existing.id);
    } else {
      await supabase.from("nutrition_targets").insert(values);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Nutrition targets */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h2 className="font-semibold">Daily Nutrition Targets</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-muted mb-1">Calories (kcal)</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Protein (g)</label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Carbs (g)</label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Fat (g)</label>
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Fiber (g)</label>
            <input
              type="number"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved!" : "Save Targets"}
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full py-2.5 rounded-lg bg-card border border-border text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
