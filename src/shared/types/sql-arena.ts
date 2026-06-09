export type Difficulty = "easy" | "medium" | "hard" | "special";

export type ChallengeStatus = "completed" | "available" | "locked";

export type ModuleStatus = "completed" | "in-progress" | "locked";

export type SchemaColumn = {
  name: string;
  type: string;
  isPrimary?: boolean;
};

export type SchemaTable = {
  name: string;
  columns: SchemaColumn[];
};

export type Challenge = {
  id: string;
  slug: string;
  moduleId: string;
  title: string;
  statement: string;
  orderingHint?: string;
  explanation?: string;
  difficulty: Difficulty;
  baseXp: number;
  status: ChallengeStatus;
  starterSql: string;
  expectedSql: string;
  expectedColumns: string[];
  expectedRows: Record<string, string | number | null>[];
  allowedTables: string[];
  hints: string[];
};

export type LearningModule = {
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  challenges: Challenge[];
};

export type PlatformEvent = {
  id: string;
  title: string;
  multiplier: number;
  endsAtLabel: string;
  active: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  totalXp: number;
  weeklyXp: number;
  completedChallengeIds: string[];
};

export type RankingUser = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  totalXp: number;
  weeklyXp: number;
};
