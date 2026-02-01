
import React from 'react';
import { Cell, Action, SimulationParams } from '../types';
import { ACTION_VECTORS, ActionIcon } from '../constants';
import { Info, Target, Zap } from 'lucide-react';

interface BellmanBreakdownProps {
  cell: Cell | null;
  grid: Cell[][];
  params: SimulationParams;
}

const BellmanBreakdown: React.FC<BellmanBreakdownProps> = ({ cell, grid, params }) => {
  if (!cell) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center border-2 border-dashed border-slate-200 rounded-3xl">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <Zap size={32} className="opacity-20" />
        </div>
        <h3 className="text-lg font-bold text-slate-600 mb-2">No Cell Selected</h3>
        <p className="text-sm max-w-xs px-4">Click a cell in the Grid Lab above to inspect its Bellman calculation components.</p>
      </div>
    );
  }

  if (cell.type === 'WALL' || cell.type === 'GOAL' || cell.type === 'TRAP') {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">{cell.type} State</h3>
        <p className="text-sm text-slate-500">
          Terminal states and walls have fixed values based on immediate rewards. 
          Value (V) = Reward (R) = <span className="font-mono font-bold text-indigo-600">{cell.reward}</span>
        </p>
      </div>
    );
  }

  const getNeighborValue = (action: Action) => {
    const vec = ACTION_VECTORS[action];
    const nx = cell.x + vec.dx;
    const ny = cell.y + vec.dy;
    if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length && grid[ny][nx].type !== 'WALL') {
      return grid[ny][nx];
    }
    return cell;
  };

  const getActionBreakdown = (intendedAction: Action) => {
    const noiseActions = (intendedAction === Action.UP || intendedAction === Action.DOWN) ? [Action.LEFT, Action.RIGHT] : [Action.UP, Action.DOWN];
    const actions = [intendedAction, ...noiseActions];
    const probs = [1 - params.noise * 2, params.noise, params.noise];
    
    let totalValue = 0;
    const components = actions.map((a, i) => {
      const neighbor = getNeighborValue(a);
      const contribution = probs[i] * (cell.reward + params.gamma * neighbor.value);
      totalValue += contribution;
      return { action: a, prob: probs[i], neighborVal: neighbor.value, contribution };
    });

    return { totalValue, components };
  };

  const currentBest = cell.policy || Action.UP;
  const { totalValue, components } = getActionBreakdown(currentBest);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calculation Details</h4>
              <p className="text-sm font-bold text-slate-800">State ({cell.x}, {cell.y}) • Target: {currentBest}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Expected V</span>
              <span className="text-xl font-mono font-black text-indigo-600">{totalValue.toFixed(4)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {components.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <ActionIcon action={comp.action} />
                </div>
                <div className="flex-1 grid grid-cols-4 items-center text-[11px] font-mono">
                  <div className="text-slate-400 font-bold">{comp.prob.toFixed(2)}</div>
                  <div className="col-span-2 text-slate-600 truncate">
                    ({cell.reward.toFixed(1)} + {params.gamma} &times; {comp.neighborVal.toFixed(2)})
                  </div>
                  <div className="text-right font-black text-indigo-600">
                    +{comp.contribution.toFixed(3)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full md:w-1/3 space-y-4">
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <h3 className="text-emerald-800 font-bold text-xs mb-2 flex items-center gap-2">
              <Info size={14} /> The Formula
            </h3>
            <p className="text-emerald-700/80 text-xs leading-relaxed">
              V is the <strong>Immediate Reward</strong> ({cell.reward}) plus 
              the <strong>Discounted</strong> future value ({params.gamma} &times; E[V']).
              The Noise ({params.noise}) averages neighboring states.
            </p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <h3 className="text-amber-800 font-bold text-xs mb-2 flex items-center gap-2">
              <Target size={14} /> Policy
            </h3>
            <p className="text-amber-700/80 text-xs leading-relaxed">
              We choose <strong>{currentBest}</strong> because it has the 
              highest sum of expected rewards among all 4 directions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BellmanBreakdown;
