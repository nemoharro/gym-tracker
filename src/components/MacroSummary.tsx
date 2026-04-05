"use client";

interface MacroSummaryProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export function MacroSummary({ calories, protein, carbs, fat, targets }: MacroSummaryProps) {
  const defaultTargets = { calories: 2500, protein: 180, carbs: 250, fat: 80 };
  const t = targets ?? defaultTargets;

  const macros = [
    { label: "Calories", current: calories, target: t.calories, unit: "kcal", color: "bg-primary" },
    { label: "Protein", current: protein, target: t.protein, unit: "g", color: "bg-red-500" },
    { label: "Carbs", current: carbs, target: t.carbs, unit: "g", color: "bg-yellow-500" },
    { label: "Fat", current: fat, target: t.fat, unit: "g", color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-3 p-4 bg-card rounded-xl border border-border">
      {macros.map((m) => {
        const pct = Math.min(100, (m.current / m.target) * 100);
        const isOver = m.current > m.target;
        return (
          <div key={m.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">{m.label}</span>
              <span className={isOver ? "text-destructive font-medium" : ""}>
                {Math.round(m.current)} / {m.target} {m.unit}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${m.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
