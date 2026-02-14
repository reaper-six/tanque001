import React from 'react';
import { TankStatus } from '../types';

interface TankGaugeProps {
  level: number;
  capacity: number;
  status: TankStatus;
}

export const TankGauge: React.FC<TankGaugeProps> = ({ level, capacity, status }) => {
  const percentage = Math.min(100, Math.max(0, (level / capacity) * 100));
  
  // Premium Gradients
  let gradientClass = 'from-blue-600 to-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]';
  if (status === TankStatus.LOW) gradientClass = 'from-amber-500 to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
  if (status === TankStatus.CRITICAL) gradientClass = 'from-red-600 to-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]';
  if (status === TankStatus.REFILLING) gradientClass = 'from-emerald-500 to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]';

  return (
    <div className="relative w-full h-56 bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-700 shadow-inner">
      {/* Background Grid Lines (Darker) */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 pointer-events-none opacity-40">
        <div className="border-b border-slate-600 w-full text-[10px] text-slate-500 text-right">100%</div>
        <div className="border-b border-slate-600 w-full text-[10px] text-slate-500 text-right">75%</div>
        <div className="border-b border-slate-600 w-full text-[10px] text-slate-500 text-right">50%</div>
        <div className="border-b border-slate-600 w-full text-[10px] text-slate-500 text-right">25%</div>
        <div className="border-b border-slate-600 w-full text-[10px] text-slate-500 text-right">0%</div>
      </div>

      {/* Liquid with Gradient */}
      <div 
        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out bg-gradient-to-t ${gradientClass}`}
        style={{ height: `${percentage}%` }}
      >
        {/* Shine effect on top of liquid */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/30 backdrop-blur-sm"></div>
        {/* Bubbles/Pulse effect */}
        <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>

      {/* Value Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center drop-shadow-lg pointer-events-none">
        <span className="text-3xl md:text-4xl font-bold text-white tracking-tighter filter drop-shadow-lg transition-all duration-300">
          {percentage.toFixed(1)}<span className="text-base md:text-lg text-slate-300 font-light">%</span>
        </span>
        <span className="text-xs md:text-sm font-medium text-slate-300 mt-1 bg-slate-900/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
          {level.toFixed(0)} Litros
        </span>
      </div>
    </div>
  );
};