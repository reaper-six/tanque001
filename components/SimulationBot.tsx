
import React, { useState, useEffect } from 'react';
import { Tank } from '../types';
import { subscribeToSimulationStatus, setSimulationStatus, subscribeToSimulationInterval, setSimulationInterval } from '../services/firebaseService';
import { Bot, Play, Pause, Activity, Zap, Server, Clock, Sun, Moon } from 'lucide-react';

interface SimulationBotProps {
  tank: Tank;
}

export const SimulationBot: React.FC<SimulationBotProps> = ({ tank }) => {
  const [isActive, setIsActive] = useState(false);
  const [intervalSec, setIntervalSec] = useState(10);
  const [logs, setLogs] = useState<string[]>([]);
  const [isBusinessTime, setIsBusinessTime] = useState(true);

  // Subscribe to Global Status & Interval
  useEffect(() => {
    const unsubscribeStatus = subscribeToSimulationStatus(setIsActive);
    const unsubscribeInterval = subscribeToSimulationInterval(setIntervalSec);

    // Initial check and interval for business hours display
    const checkTime = () => {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        // Comercial: Seg-Sex (1-5), 08h-18h
        setIsBusinessTime(day >= 1 && day <= 5 && hour >= 8 && hour < 18);
    };
    checkTime();
    const timeInterval = setInterval(checkTime, 10000);

    return () => {
      unsubscribeStatus();
      unsubscribeInterval();
      clearInterval(timeInterval);
    };
  }, []);

  // Simple Logger based on tank activity
  useEffect(() => {
     if (!isActive) {
        setLogs(prev => prev.length > 0 && prev[0] === "Robô pausado." ? prev : ["Robô pausado.", ...prev.slice(0,3)]);
        return;
     }

     if (!isBusinessTime) {
         setLogs(prev => prev[0]?.includes("Standby") ? prev : ["Standby: Aguardando horário comercial (08h-18h).", ...prev.slice(0,3)]);
         return;
     }

     if (tank.status === 'Reabastecendo') {
         setLogs(prev => prev[0]?.includes("Reabastecendo") ? prev : [`Reabastecendo... Nível: ${tank.currentLevel.toFixed(0)}L`, ...prev.slice(0,3)]);
     } else if (isActive) {
         setLogs(prev => prev[0]?.includes("Consumindo") ? prev : [`Consumindo... Nível: ${tank.currentLevel.toFixed(0)}L`, ...prev.slice(0,3)]);
     }
  }, [tank.currentLevel, tank.status, isActive, isBusinessTime]);

  const toggleSimulation = () => {
     setSimulationStatus(!isActive);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    setIntervalSec(newVal);
    setSimulationInterval(newVal);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative">
       {/* Active Indicator Strip */}
       <div className={`h-1 w-full transition-colors ${isActive ? (isBusinessTime ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500') : 'bg-slate-700'}`}></div>
       
       <div className="p-6">
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
               <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-xl border ${isActive ? (isBusinessTime ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-amber-500/20 border-amber-500/50 text-amber-400') : 'bg-slate-800 border-slate-600 text-slate-500'}`}>
                       <Bot size={28} />
                   </div>
                   <div>
                       <h3 className="text-xl font-bold text-white flex items-center gap-2">
                           Robô de Simulação
                           {isActive && isBusinessTime && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>}
                           {isActive && !isBusinessTime && <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>}
                       </h3>
                       <p className="text-xs text-slate-400">Motor Mock (Server-Side).</p>
                   </div>
               </div>

               <div className="flex items-center gap-2 w-full lg:w-auto">
                   <button
                      onClick={toggleSimulation}
                      className={`flex-1 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-sm ${
                          isActive 
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                      }`}
                   >
                       {isActive ? <><Pause size={16} /> Parar</> : <><Play size={16} /> Iniciar</>}
                   </button>
               </div>
           </div>
            
           {/* Interval Control */} 
           <div className="bg-slate-950/50 px-4 py-3 rounded-xl border border-slate-800 flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Clock size={10}/> Ciclo de Atualização</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">{intervalSec}s</span>
                </div>
                <input 
                    type="range" 
                    min="10" 
                    max="60" 
                    step="10" 
                    value={intervalSec}
                    onChange={handleIntervalChange}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
           </div>

           <div className="grid grid-cols-2 gap-4">
               {/* Stats */}
               <div className="space-y-2">
                   <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                       <span className="text-[10px] text-slate-500 uppercase font-bold">Status</span>
                       <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isActive ? (isBusinessTime ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400') : 'bg-slate-800 text-slate-500'}`}>
                           {isActive ? (isBusinessTime ? 'ATIVO' : 'STANDBY') : 'OFF'}
                       </span>
                   </div>
                   {/* Business Hours Indicator */}
                   <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                       <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                          {isBusinessTime ? <Sun size={10} className="text-amber-400"/> : <Moon size={10} className="text-blue-400"/>} 
                          Turno
                       </span>
                       <span className={`text-[10px] font-mono font-bold ${isBusinessTime ? 'text-amber-400' : 'text-blue-400'}`}>
                           {isBusinessTime ? 'Comercial' : 'Noturno'}
                       </span>
                   </div>
               </div>

               {/* Live Log */}
               <div className="bg-slate-950 rounded-lg border border-slate-800 p-2 font-mono text-[10px] h-20 overflow-hidden relative">
                   <div className="space-y-1">
                       {logs.length > 0 ? logs.map((entry, i) => (
                           <div key={i} className={`truncate ${i === 0 ? (entry.includes("Standby") ? 'text-amber-400' : entry.includes("Reabastecendo") ? 'text-emerald-400' : 'text-blue-400') : 'text-slate-500'}`}>
                               {entry}
                           </div>
                       )) : (
                           <span className="text-slate-600 italic">Aguardando...</span>
                       )}
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};
