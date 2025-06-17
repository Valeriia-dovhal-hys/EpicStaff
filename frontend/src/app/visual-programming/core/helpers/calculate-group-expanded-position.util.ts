export interface CollapsedGroupPositionSize {
  collapsedPosition: Position;
  size: { width: number; height: number };
}

export interface Position {
  x: number;
  y: number;
}

export function calculateGroupExpandedPosition(
  group: CollapsedGroupPositionSize
): Position {
  return {
    x:
      group.collapsedPosition.x -
      (group.size.width / 2 - (group.size.width * 0.6) / 2),
    y: group.collapsedPosition.y + 30, // Adding 28 since we subtracted in the collapsed calculation
  };
}
