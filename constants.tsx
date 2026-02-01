
import React from 'react';
import { Action } from './types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export const DEFAULT_ROWS = 5;
export const DEFAULT_COLS = 7;

export const ACTION_VECTORS: Record<Action, { dx: number; dy: number }> = {
  [Action.UP]: { dx: 0, dy: -1 },
  [Action.DOWN]: { dx: 0, dy: 1 },
  [Action.LEFT]: { dx: -1, dy: 0 },
  [Action.RIGHT]: { dx: 1, dy: 0 },
};

export const ActionIcon = ({ action, className }: { action: Action; className?: string }) => {
  switch (action) {
    case Action.UP: return <ArrowUp className={className} size={16} />;
    case Action.DOWN: return <ArrowDown className={className} size={16} />;
    case Action.LEFT: return <ArrowLeft className={className} size={16} />;
    case Action.RIGHT: return <ArrowRight className={className} size={16} />;
  }
};
