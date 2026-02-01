
import React from 'react';
import { Cell, Action, AlgorithmType } from '../types';
import { ActionIcon } from '../constants';
import { User } from 'lucide-react';

interface GridCellProps {
  cell: Cell;
  algorithm: AlgorithmType;
  agentPos?: { x: number; y: number } | null;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const GridCell: React.FC<GridCellProps> = ({ cell, algorithm, agentPos, onClick, onContextMenu }) => {
  const isAgentHere = agentPos?.x === cell.x && agentPos?.y === cell.y;

  const getBgColor = () => {
    if (cell.type === 'WALL') return 'bg-slate-800';
    if (cell.type === 'GOAL') return 'bg-emerald-500 text-white';
    if (cell.type === 'TRAP') return 'bg-rose-500 text-white';
    if (cell.type === 'START') return 'bg-indigo-600 text-white';
    
    if (algorithm === 'Q_LEARNING') return 'bg-white';

    const val = cell.value;
    if (val > 0) {
      const alpha = Math.min(val / 10, 0.4);
      return `rgba(16, 185, 129, ${alpha})`;
    } else if (val < 0) {
      const alpha = Math.min(Math.abs(val) / 10, 0.4);
      return `rgba(244, 63, 94, ${alpha})`;
    }
    return 'bg-white';
  };

  const renderQValues = () => {
    if (!cell.qValues || cell.type === 'WALL' || cell.type === 'GOAL' || cell.type === 'TRAP') return null;
    
    const getQColor = (val: number) => {
      if (val > 0) return `rgba(16, 185, 129, ${Math.min(val / 10, 0.6)})`;
      if (val < 0) return `rgba(244, 63, 94, ${Math.min(Math.abs(val) / 10, 0.6)})`;
      return 'transparent';
    };

    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Top - UP */}
        <div 
          className="absolute top-0 left-0 right-0 h-1/2" 
          style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)', backgroundColor: getQColor(cell.qValues[Action.UP]) }} 
        />
        {/* Bottom - DOWN */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/2" 
          style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)', backgroundColor: getQColor(cell.qValues[Action.DOWN]) }} 
        />
        {/* Left - LEFT */}
        <div 
          className="absolute top-0 bottom-0 left-0 w-1/2" 
          style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)', backgroundColor: getQColor(cell.qValues[Action.LEFT]) }} 
        />
        {/* Right - RIGHT */}
        <div 
          className="absolute top-0 bottom-0 right-0 w-1/2" 
          style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)', backgroundColor: getQColor(cell.qValues[Action.RIGHT]) }} 
        />
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`relative w-full aspect-square flex flex-col items-center justify-center text-[9px] md:text-xs font-medium ${getBgColor()} border border-slate-200 hover:border-indigo-500 hover:z-10 transition-colors cursor-pointer overflow-hidden select-none`}
      style={{ backgroundColor: typeof getBgColor() === 'string' && getBgColor().startsWith('rgba') ? getBgColor() : undefined }}
    >
      {algorithm === 'Q_LEARNING' && renderQValues()}

      {cell.type === 'WALL' ? (
        <div className="w-full h-full bg-slate-700 opacity-50 flex items-center justify-center">
          <span className="text-slate-400">#</span>
        </div>
      ) : (
        <>
          <span className="absolute top-0.5 left-0.5 opacity-30 text-[7px]">{cell.x},{cell.y}</span>
          
          <div className="text-center z-10">
            <div className={`font-bold ${cell.type === 'EMPTY' && algorithm !== 'Q_LEARNING' ? 'text-slate-700' : (algorithm === 'Q_LEARNING' ? 'text-slate-900 bg-white/50 px-1 rounded' : 'text-white')}`}>
              {cell.value.toFixed(1)}
            </div>
          </div>
          
          {cell.policy && (cell.type === 'EMPTY' || cell.type === 'START') && (
            <div className={`absolute bottom-0.5 right-0.5 ${cell.type === 'START' ? 'text-white' : 'text-indigo-600 opacity-80'}`}>
              <ActionIcon action={cell.policy} />
            </div>
          )}

          {cell.type === 'GOAL' && <div className="font-bold text-[8px] mt-0.5 text-white z-10">GOAL</div>}
          {cell.type === 'TRAP' && <div className="font-bold text-[8px] mt-0.5 text-white z-10">TRAP</div>}
          
          {isAgentHere && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-indigo-600 animate-bounce">
                <User size={14} className="text-indigo-600" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GridCell;
