import type { Difficulty } from "../../../shared/types/sql-arena";

export function difficultyLabel(difficulty: Difficulty) {
  const labels: Record<Difficulty, string> = {
    easy: "Facil",
    medium: "Medio",
    hard: "Dificil",
    special: "Especial",
  };

  return labels[difficulty];
}

export function difficultyClassName(difficulty: Difficulty) {
  const classes: Record<Difficulty, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
    special: "bg-purple-100 text-purple-700",
  };

  return classes[difficulty];
}

export function formatXp(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}
