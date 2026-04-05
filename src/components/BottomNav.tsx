"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, History, LayoutDashboard, UtensilsCrossed, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/food", label: "Food", icon: UtensilsCrossed },
  { href: "/history", label: "History", icon: History },
  { href: "/splits", label: "Splits", icon: LayoutGrid },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs transition-colors",
                isActive ? "text-primary" : "text-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
