import type { Difficulty } from "../../../shared/types/sql-arena";
import { Badge } from "../../../app/components/ui/InputCardBadge";
import { difficultyClassName, difficultyLabel } from "../utils/format";

type DifficultyBadgeProps = {
  difficulty: Difficulty;
};

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <Badge variant="secondary" className={`text-xs font-semibold ${difficultyClassName(difficulty)}`}>
      {difficultyLabel(difficulty)}
    </Badge>
  );
}
