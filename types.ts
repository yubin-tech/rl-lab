
export type CellType = 'EMPTY' | 'WALL' | 'GOAL' | 'TRAP' | 'START';

export type AlgorithmType = 'VALUE_ITERATION' | 'POLICY_ITERATION' | 'Q_LEARNING';

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  reward: number;
  value: number;
  policy: Action | null;
  qValues?: Record<Action, number>; // Used for Q-Learning
}

export enum Action {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface GridDimensions {
  rows: number;
  cols: number;
}

export interface SimulationParams {
  gamma: number;    // Discount factor
  noise: number;    // Probability of moving in an unintended direction
  livingReward: number; // Small penalty for each move to encourage speed
  goalReward: number;   // Dynamic reward for goal cells
  trapReward: number;   // Dynamic reward for trap cells
  threshold: number;    // Convergence threshold for auto-stop
  // Q-Learning specific
  alpha: number;        // Learning rate
  epsilon: number;      // Exploration rate
  epsilonMin: number;   // Lower bound for exploration rate
  epsilonDecay: number; // Multiplicative decay applied per step
}

export interface HistoryPoint {
  iteration: number;
  maxDelta: number;
}
