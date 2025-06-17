/**
 * Interface representing a group object with position and dimensions
 */
export interface GroupPositionSize {
  position: Position;
  size: { width: number; height: number };
}

/**
 * Interface representing a position point
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Calculates the position of a collapsed group based on its expanded state
 * @param group The group object with position and size properties
 * @returns The calculated position for the collapsed state
 */
export function calculateGroupCollapsedPosition(
  group: GroupPositionSize
): Position {
  return {
    x: group.position.x + (group.size.width / 2 - (group.size.width * 0.6) / 2),
    y: group.position.y - 30,
  };
}
