import type { RankingUser } from "../../../shared/types/sql-arena";
import { getCurrentUser } from "../../learning/data/catalog";

export function getRankingUsers(): RankingUser[] {
  const currentUser = getCurrentUser();

  return [
    { id: "ana", name: "Ana Beatriz", username: "ana", avatar: "A", totalXp: 4200, weeklyXp: 720 },
    { id: "joao", name: "Joao Pedro", username: "joao", avatar: "J", totalXp: 3900, weeklyXp: 360 },
    { id: currentUser.id, name: currentUser.name, username: currentUser.username, avatar: currentUser.avatar, totalXp: currentUser.totalXp, weeklyXp: currentUser.weeklyXp },
    { id: "lucas", name: "Lucas M", username: "lucas", avatar: "L", totalXp: 3100, weeklyXp: 280 },
    { id: "mariana", name: "Mariana", username: "mariana", avatar: "M", totalXp: 2800, weeklyXp: 240 },
    { id: "carlos", name: "Carlos", username: "carlos", avatar: "C", totalXp: 2400, weeklyXp: 210 },
    { id: "felipe", name: "Felipe", username: "felipe", avatar: "F", totalXp: 2100, weeklyXp: 160 },
    { id: "julia", name: "Julia", username: "julia", avatar: "J", totalXp: 1900, weeklyXp: 120 },
    { id: "roberto", name: "Roberto", username: "roberto", avatar: "R", totalXp: 1750, weeklyXp: 90 },
    { id: "sofia", name: "Sofia", username: "sofia", avatar: "S", totalXp: 1600, weeklyXp: 70 },
  ];
}

export function getRanking(scope: "weekly" | "overall") {
  const key = scope === "weekly" ? "weeklyXp" : "totalXp";
  return [...getRankingUsers()].sort((a, b) => b[key] - a[key]);
}

export function getUserPosition(userId: string, scope: "weekly" | "overall") {
  return getRanking(scope).findIndex((user) => user.id === userId) + 1;
}
