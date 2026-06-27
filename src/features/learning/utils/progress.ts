import type { LearningModule } from "../../../shared/types/sql-arena";

export function getModuleProgress(module: LearningModule) {
  if (!module.challenges.length) return 0;
  return Math.round((module.challenges.filter((challenge) => challenge.status === "completed").length / module.challenges.length) * 100);
}
