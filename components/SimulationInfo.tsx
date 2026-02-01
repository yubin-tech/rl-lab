
import React from 'react';
import { Activity, Target, Info } from 'lucide-react';
import { AlgorithmType, Cell } from '../types';

interface SimulationInfoProps {
  algorithm: AlgorithmType;
  selectedCell: Cell | null;
}

const SimulationInfo: React.FC<SimulationInfoProps> = ({ algorithm, selectedCell }) => {
  const getAlgoContent = () => {
    switch (algorithm) {
      case 'VALUE_ITERATION':
        return {
          title: 'Value Iteration',
          formula: "$V_{k+1}(s) = \\max_a \\sum_{s'} P(s'|s,a) [ R + \\gamma V_k(s') ]$",
          desc: 'Directly computes optimal values by iteratively applying the Bellman optimality backup across the entire state space.'
        };
      case 'POLICY_ITERATION':
        return {
          title: 'Policy Iteration',
          formula: "$\\pi_{i+1}(s) = \\arg \\max_a \\sum_{s'} P(s'|s,a) [ R + \\gamma V^{\\pi_i}(s') ]$",
          desc: 'Alternates between evaluating the current policy and improving it. Often converges in fewer iterations than Value Iteration.'
        };
      case 'Q_LEARNING':
        return {
          title: 'Q-Learning',
          formula: "$Q(s,a) \\leftarrow Q(s,a) + \\alpha [ R + \\gamma \\max_{a'} Q(s',a') - Q(s,a) ]$",
          desc: 'A model-free algorithm that learns the quality of actions (Q-values) through experience and exploration.'
        };
    }
  };

  const content = getAlgoContent();

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-6 text-indigo-600">
        <Activity size={20} />
        <h2 className="text-lg font-bold">Algorithm Theory</h2>
      </div>

      <div className="prose prose-slate prose-sm max-w-none flex-1 overflow-y-auto pr-2">
        <section className="mb-6 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
          <h3 className="text-indigo-900 font-bold mb-1 text-sm">{content.title}</h3>
          <p className="text-indigo-800/70 text-[10px] uppercase font-bold tracking-widest mb-3">Mathematical Model</p>
          <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm overflow-x-auto mb-3">
            <code className="text-indigo-600 font-mono text-[11px] whitespace-nowrap">
              {content.formula}
            </code>
          </div>
          <p className="text-slate-600 leading-relaxed text-xs">
            {content.desc}
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Target size={16} className="text-emerald-500" />
            <h3>Selected State</h3>
          </div>
          
          {selectedCell ? (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Position</span>
                  <span className="text-xs font-mono font-bold text-slate-700">{selectedCell.x}, {selectedCell.y}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Type</span>
                  <span className="text-xs font-bold text-slate-700">{selectedCell.type}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Reward</span>
                  <span className="text-xs font-mono font-bold text-indigo-600">{selectedCell.reward.toFixed(2)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Value (V)</span>
                  <span className="text-xs font-mono font-bold text-indigo-600">{selectedCell.value.toFixed(4)}</span>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-slate-500 leading-relaxed italic">
                Switch to the <span className="font-bold text-indigo-600">Bellman Explorer</span> tab in the sidebar to see the step-by-step breakdown of how this value was calculated.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <Info size={24} className="text-slate-200 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Click any cell in the grid to see its properties and transitions.</p>
            </div>
          )}
        </section>
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
        Static Education Module
      </div>
    </div>
  );
};

export default SimulationInfo;
