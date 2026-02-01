
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, RotateCcw, SkipForward, Pause, Settings2, HelpCircle, Layers, LayoutGrid, Calculator, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Cell, Action, CellType, SimulationParams, HistoryPoint, AlgorithmType } from './types';
import { DEFAULT_ROWS, DEFAULT_COLS, ACTION_VECTORS } from './constants';
import GridCell from './components/GridCell';
import SimulationInfo from './components/SimulationInfo';
import BellmanBreakdown from './components/BellmanBreakdown';

const App: React.FC = () => {
  // Global Navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);

  // Global State
  const [activeAlgo, setActiveAlgo] = useState<AlgorithmType>('VALUE_ITERATION');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [params, setParams] = useState<SimulationParams>({
    gamma: 0.9,
    noise: 0.1,
    livingReward: -0.1,
    goalReward: 10,
    trapReward: -10,
    threshold: 0.001,
    alpha: 0.1,
    epsilon: 0.2
  });
  
  // Simulation Control
  const [iteration, setIteration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isConverged, setIsConverged] = useState(false);
  
  // Q-Learning Agent State
  const [agentPos, setAgentPos] = useState<{ x: number; y: number } | null>(null);

  // Selection State
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);

  // Grid Initialization
  const initGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    let start: { x: number; y: number } | null = null;

    for (let y = 0; y < DEFAULT_ROWS; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < DEFAULT_COLS; x++) {
        let type: CellType = 'EMPTY';
        let reward = params.livingReward;
        
        if (x === 6 && y === 0) { type = 'GOAL'; reward = params.goalReward; }
        else if (x === 6 && y === 1) { type = 'TRAP'; reward = params.trapReward; }
        else if (x === 0 && y === 4) { type = 'START'; reward = params.livingReward; start = { x, y }; }
        else if (x === 2 && y === 2) { type = 'WALL'; reward = 0; }
        else if (x === 2 && y === 1) { type = 'WALL'; reward = 0; }

        const qValues: Record<Action, number> = {
          [Action.UP]: 0, [Action.DOWN]: 0, [Action.LEFT]: 0, [Action.RIGHT]: 0
        };

        row.push({ x, y, type, reward, value: 0, policy: null, qValues });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setIteration(0);
    setHistory([]);
    setSelectedCell(null);
    setIsRunning(false);
    setIsConverged(false);
    setAgentPos(start);
  }, [params.livingReward, params.goalReward, params.trapReward]);

  useEffect(() => { initGrid(); }, []);

  // Algorithm Switching logic: Reset simulation but keep world
  useEffect(() => {
    setGrid(prev => prev.map(row => row.map(cell => ({
      ...cell,
      value: (cell.type === 'GOAL' || cell.type === 'TRAP') ? cell.reward : 0,
      policy: null,
      qValues: { [Action.UP]: 0, [Action.DOWN]: 0, [Action.LEFT]: 0, [Action.RIGHT]: 0 }
    }))));
    setIteration(0);
    setHistory([]);
    setIsRunning(false);
    setIsConverged(false);
    
    // Find start for agent
    for (let y = 0; y < DEFAULT_ROWS; y++) {
      for (let x = 0; x < DEFAULT_COLS; x++) {
        if (grid[y] && grid[y][x] && grid[y][x].type === 'START') {
          setAgentPos({ x, y });
        }
      }
    }
  }, [activeAlgo]);

  const performValueIterationStep = useCallback(() => {
    let maxDelta = 0;
    const nextGrid = JSON.parse(JSON.stringify(grid)) as Cell[][];

    for (let y = 0; y < DEFAULT_ROWS; y++) {
      for (let x = 0; x < DEFAULT_COLS; x++) {
        const cell = grid[y][x];
        if (cell.type === 'GOAL' || cell.type === 'TRAP') { nextGrid[y][x].value = cell.reward; continue; }
        if (cell.type === 'WALL') { nextGrid[y][x].value = 0; continue; }

        const actionValues: number[] = Object.values(Action).map(intendedAction => {
          let expectedValue = 0;
          const noiseActions = (intendedAction === Action.UP || intendedAction === Action.DOWN) ? [Action.LEFT, Action.RIGHT] : [Action.UP, Action.DOWN];
          const actions = [intendedAction, ...noiseActions];
          const probs = [1 - params.noise * 2, params.noise, params.noise];

          for (let i = 0; i < actions.length; i++) {
            const vec = ACTION_VECTORS[actions[i]];
            const nx = x + vec.dx; const ny = y + vec.dy;
            const target = (nx >= 0 && nx < DEFAULT_COLS && ny >= 0 && ny < DEFAULT_ROWS && grid[ny][nx].type !== 'WALL') ? grid[ny][nx] : cell;
            expectedValue += probs[i] * (cell.reward + params.gamma * target.value);
          }
          return expectedValue;
        });

        const bestValue = Math.max(...actionValues);
        const bestAction = Object.values(Action)[actionValues.indexOf(bestValue)];
        nextGrid[y][x].value = bestValue;
        nextGrid[y][x].policy = bestAction;
        maxDelta = Math.max(maxDelta, Math.abs(bestValue - cell.value));
      }
    }
    setGrid(nextGrid);
    setIteration(i => i + 1);
    setHistory(h => [...h.slice(-49), { iteration: iteration + 1, maxDelta }]);
    if (maxDelta < params.threshold) { setIsRunning(false); setIsConverged(true); }
  }, [grid, params, iteration]);

  const performPolicyIterationStep = useCallback(() => {
    setGrid(prevGrid => {
      const nextGrid = JSON.parse(JSON.stringify(prevGrid)) as Cell[][];
      let maxDelta = 0;
      const isImprovementStep = iteration % 5 === 0;

      for (let y = 0; y < DEFAULT_ROWS; y++) {
        for (let x = 0; x < DEFAULT_COLS; x++) {
          const cell = prevGrid[y][x];
          if (cell.type === 'GOAL' || cell.type === 'TRAP' || cell.type === 'WALL') continue;

          if (isImprovementStep || !cell.policy) {
            const actionValues = Object.values(Action).map(a => {
              const vec = ACTION_VECTORS[a];
              const nx = x + vec.dx; const ny = y + vec.dy;
              const target = (nx >= 0 && nx < DEFAULT_COLS && ny >= 0 && ny < DEFAULT_ROWS && prevGrid[ny][nx].type !== 'WALL') ? prevGrid[ny][nx] : cell;
              return cell.reward + params.gamma * target.value;
            });
            const bestAction = Object.values(Action)[actionValues.indexOf(Math.max(...actionValues))];
            nextGrid[y][x].policy = bestAction;
          } else {
            const a = cell.policy;
            const vec = ACTION_VECTORS[a];
            const nx = x + vec.dx; const ny = y + vec.dy;
            const target = (nx >= 0 && nx < DEFAULT_COLS && ny >= 0 && ny < DEFAULT_ROWS && prevGrid[ny][nx].type !== 'WALL') ? prevGrid[ny][nx] : cell;
            const newValue = cell.reward + params.gamma * target.value;
            maxDelta = Math.max(maxDelta, Math.abs(newValue - cell.value));
            nextGrid[y][x].value = newValue;
          }
        }
      }
      setHistory(h => [...h.slice(-49), { iteration: iteration + 1, maxDelta }]);
      return nextGrid;
    });
    setIteration(i => i + 1);
  }, [grid, params, iteration]);

  const performQLearningStep = useCallback(() => {
    if (!agentPos) return;
    const { x, y } = agentPos;
    const cell = grid[y][x];
    let action: Action;
    if (Math.random() < params.epsilon) {
      const actions = Object.values(Action);
      action = actions[Math.floor(Math.random() * actions.length)];
    } else {
      const q = cell.qValues!;
      action = Object.values(Action).reduce((a, b) => q[a] > q[b] ? a : b);
    }
    const vec = ACTION_VECTORS[action];
    let nx = x + vec.dx; let ny = y + vec.dy;
    if (nx < 0 || nx >= DEFAULT_COLS || ny < 0 || ny >= DEFAULT_ROWS || grid[ny][nx].type === 'WALL') {
      nx = x; ny = y;
    }
    const nextCell = grid[ny][nx];
    const reward = nextCell.reward;
    setGrid(prev => {
      const newGrid = JSON.parse(JSON.stringify(prev)) as Cell[][];
      const currentQ = newGrid[y][x].qValues![action];
      const maxNextQ = Math.max(...Object.values(newGrid[ny][nx].qValues!));
      const newQ = currentQ + params.alpha * (reward + params.gamma * maxNextQ - currentQ);
      newGrid[y][x].qValues![action] = newQ;
      newGrid[y][x].value = Math.max(...Object.values(newGrid[y][x].qValues!));
      newGrid[y][x].policy = Object.values(Action).reduce((a, b) => newGrid[y][x].qValues![a] > newGrid[y][x].qValues![b] ? a : b);
      return newGrid;
    });
    if (nextCell.type === 'GOAL' || nextCell.type === 'TRAP') {
      let start = { x: 0, y: 0 };
      for (let sy = 0; sy < DEFAULT_ROWS; sy++) {
        for (let sx = 0; sx < DEFAULT_COLS; sx++) {
          if (grid[sy][sx].type === 'START') start = { x: sx, y: sy };
        }
      }
      setAgentPos(start);
    } else {
      setAgentPos({ x: nx, y: ny });
    }
    setIteration(i => i + 1);
  }, [grid, agentPos, params]);

  const runStep = useCallback(() => {
    if (activeAlgo === 'VALUE_ITERATION') performValueIterationStep();
    else if (activeAlgo === 'POLICY_ITERATION') performPolicyIterationStep();
    else performQLearningStep();
  }, [activeAlgo, performValueIterationStep, performPolicyIterationStep, performQLearningStep]);

  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (isRunning) timerRef.current = window.setInterval(runStep, activeAlgo === 'Q_LEARNING' ? 50 : 150);
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, runStep, activeAlgo]);

  const handleCellClick = (cell: Cell) => {
    setSelectedCell(cell);
    if (!isBreakdownExpanded) setIsBreakdownExpanded(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Side Navigation */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-30 shadow-xl`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Layers size={20} />
            </div>
            <span className="font-black text-slate-800 tracking-tight">RL LAB</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b border-slate-100">
             <div className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ${!isSidebarOpen && 'hidden'}`}>Hyperparameters</div>
             <div className="space-y-6">
               {['gamma', 'noise'].map(p => (
                 <div key={p}>
                   <div className={`flex justify-between text-xs font-bold text-slate-600 mb-2 ${!isSidebarOpen && 'hidden'}`}>
                     <span>{p === 'gamma' ? 'Discount γ' : 'Noise'}</span>
                     <span className="text-indigo-600 font-mono">{params[p as keyof SimulationParams]}</span>
                   </div>
                   <input 
                     type="range" 
                     min="0" max={p === 'gamma' ? 1 : 0.4} step="0.01" 
                     value={params[p as keyof SimulationParams]} 
                     onChange={e => setParams(prev => ({ ...prev, [p]: parseFloat(e.target.value) }))} 
                     className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                   />
                 </div>
               ))}
               
               {activeAlgo === 'Q_LEARNING' && ['alpha', 'epsilon'].map(p => (
                 <div key={p}>
                   <div className={`flex justify-between text-xs font-bold text-slate-600 mb-2 ${!isSidebarOpen && 'hidden'}`}>
                     <span>{p === 'alpha' ? 'Alpha α' : 'Epsilon ε'}</span>
                     <span className="text-indigo-600 font-mono">{params[p as keyof SimulationParams]}</span>
                   </div>
                   <input 
                     type="range" 
                     min="0" max="1" step="0.05" 
                     value={params[p as keyof SimulationParams]} 
                     onChange={e => setParams(prev => ({ ...prev, [p]: parseFloat(e.target.value) }))} 
                     className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600" 
                   />
                 </div>
               ))}
             </div>
          </div>

          <div className="p-6">
            <div className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ${!isSidebarOpen && 'hidden'}`}>Rewards</div>
            <div className="space-y-4">
              {[{ label: 'Goal', k: 'goalReward', c: 'accent-emerald-500' }, { label: 'Trap', k: 'trapReward', c: 'accent-rose-500' }].map(r => (
                <div key={r.k}>
                  <div className={`flex justify-between text-[11px] font-bold text-slate-600 mb-1 ${!isSidebarOpen && 'hidden'}`}>
                    <span>{r.label}</span>
                    <span className="font-mono">{params[r.k as keyof SimulationParams]}</span>
                  </div>
                  <input type="range" min={r.k === 'goalReward' ? 0 : -50} max={r.k === 'goalReward' ? 50 : 0} step="1" value={params[r.k as keyof SimulationParams]} onChange={e => setParams(p => ({ ...p, [r.k]: parseFloat(e.target.value) }))} className={`w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer ${r.c}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">RL Simulation Lab</h2>
            <nav className="flex bg-slate-100 p-1 rounded-xl">
              {(['VALUE_ITERATION', 'POLICY_ITERATION', 'Q_LEARNING'] as AlgorithmType[]).map(algo => (
                <button
                  key={algo}
                  onClick={() => setActiveAlgo(algo)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeAlgo === algo ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {algo.replace('_', ' ')}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isConverged && <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black animate-pulse uppercase">Converged</div>}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => { setIsRunning(!isRunning); setIsConverged(false); }} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs transition-all ${isRunning ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'hover:bg-slate-200 text-slate-700'}`}>
                {isRunning ? <Pause size={14} /> : <Play size={14} />} {isRunning ? 'Stop' : 'Run'}
              </button>
              <button onClick={runStep} className="p-2 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors" title="Step"><SkipForward size={16} /></button>
              <button onClick={() => initGrid()} className="p-2 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors" title="Reset"><RotateCcw size={16} /></button>
            </div>
            <div className="text-right border-l pl-6 border-slate-200">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Iteration</div>
              <div className="text-xl font-mono font-black text-indigo-600 leading-none">{iteration}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto h-full">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col p-8 bg-gradient-to-br from-white to-slate-50/50">
                 <div className="grid gap-px border-2 border-slate-200 bg-slate-200 shadow-xl rounded-3xl overflow-hidden mx-auto" style={{ gridTemplateColumns: `repeat(${DEFAULT_COLS}, 1fr)`, width: '100%', maxWidth: '700px' }}>
                  {grid.map((row, y) => row.map((cell, x) => (
                    <GridCell 
                      key={`${x}-${y}`} 
                      cell={cell} 
                      algorithm={activeAlgo}
                      agentPos={activeAlgo === 'Q_LEARNING' ? agentPos : null}
                      onClick={() => handleCellClick(cell)} 
                      onContextMenu={e => { e.preventDefault(); (x !== 6 || y > 1) && (setIteration(0), setIsConverged(false), setGrid(prev => {
                        const newG = JSON.parse(JSON.stringify(prev)) as Cell[][];
                        const c = newG[y][x];
                        const types: CellType[] = ['EMPTY', 'WALL', 'GOAL', 'TRAP', 'START'];
                        c.type = types[(types.indexOf(c.type) + 1) % types.length];
                        c.reward = c.type === 'GOAL' ? params.goalReward : c.type === 'TRAP' ? params.trapReward : c.type === 'WALL' ? 0 : params.livingReward;
                        return newG;
                      })); }}
                    />
                  )))}
                </div>
                
                <div className="mt-8 flex items-center justify-between px-4">
                  <div className="flex gap-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                    <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-sm" /> Start</span>
                    <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm" /> Goal</span>
                    <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-sm" /> Trap</span>
                    <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-slate-800 rounded-full shadow-sm" /> Wall</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                    <HelpCircle size={14} />
                    Right-click to modify map • Left-click to analyze
                  </div>
                </div>
              </div>

              {/* Expandable Breakdown Section */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500">
                <button 
                  onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
                  className="w-full flex items-center justify-between px-8 py-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                      <Calculator size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Bellman Deep Dive Explorer</h3>
                      <p className="text-xs text-slate-400">Step-by-step mathematical decomposition of state values</p>
                    </div>
                  </div>
                  {isBreakdownExpanded ? <ChevronUp size={24} className="text-slate-400" /> : <ChevronDown size={24} className="text-slate-400" />}
                </button>
                
                {isBreakdownExpanded && (
                  <div className="p-8 border-t border-slate-100 bg-slate-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
                    <BellmanBreakdown cell={selectedCell} grid={grid} params={params} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Convergence History</h3>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="iteration" hide />
                        <YAxis hide domain={[0, 'auto']} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ display: 'none' }}
                        />
                        <Line type="monotone" dataKey="maxDelta" stroke="#4f46e5" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col justify-center text-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Environment Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="block text-2xl font-black text-slate-800 leading-none mb-1">{DEFAULT_COLS * DEFAULT_ROWS}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total States</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="block text-2xl font-black text-slate-800 leading-none mb-1">4</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Actions / State</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 h-full">
              <SimulationInfo algorithm={activeAlgo} selectedCell={selectedCell} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
