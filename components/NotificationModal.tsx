import React from 'react';
import { AppNotification } from '../types';
import { X, AlertTriangle, CheckCircle, Info, Droplets, Calendar, Clock, Thermometer, TrendingUp, ArrowDown } from 'lucide-react';

interface NotificationModalProps {
  notification: AppNotification;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ notification, onClose }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'critical': return <AlertTriangle size={32} className="text-rose-500" />;
      case 'warning': return <AlertTriangle size={32} className="text-amber-500" />;
      case 'success': return <CheckCircle size={32} className="text-emerald-500" />;
      default: return <Info size={32} className="text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'critical': return 'border-rose-500/50 bg-rose-500/10 text-rose-400';
      case 'warning': return 'border-amber-500/50 bg-amber-500/10 text-amber-400';
      case 'success': return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
      default: return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
    }
  };

  const dateObj = new Date(notification.timestamp);
  
  // Calculate difference if previousLevel exists
  const hasPrevious = notification.details?.previousLevel !== undefined;
  const currentLevel = notification.details?.level || 0;
  const previousLevel = notification.details?.previousLevel || 0;
  const levelDiff = currentLevel - previousLevel;
  const isRefill = levelDiff > 0 && hasPrevious;

  // Format helper
  const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString() : '--:--';
  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString() : '--/--';

  return (
    // Force Z-Index 9999 to be above everything (Toasts, Mobile Nav, Sidebar)
    <div className="fixed inset-0 !z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className={`p-6 border-b border-slate-800 flex gap-4 items-start shrink-0 ${notification.type === 'critical' ? 'bg-rose-900/10' : ''}`}>
           <div className={`p-3 rounded-full border ${getColors().split(' ')[0]} ${getColors().split(' ')[1]}`}>
              {getIcon()}
           </div>
           <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white break-words">{notification.title}</h3>
              <p className="text-slate-400 text-sm mt-1">{notification.message}</p>
           </div>
           <button 
             onClick={onClose}
             className="text-slate-500 hover:text-white transition-colors p-1"
           >
             <X size={24} />
           </button>
        </div>

        {/* Details Body - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            
            {/* Standard Time Display (Notification Time) */}
            {!isRefill && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
                        <Calendar size={18} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase text-slate-500 font-bold">Data Evento</p>
                            <p className="text-sm text-slate-200 truncate">{dateObj.toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
                        <Clock size={18} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase text-slate-500 font-bold">Hora Evento</p>
                            <p className="text-sm text-slate-200 truncate">{dateObj.toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {notification.details && (
                <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider flex items-center gap-2">
                        <Droplets size={14} /> Snapshot do Sistema
                    </h4>
                    
                    <div className="space-y-4">
                        
                        {/* Se for reabastecimento, mostra o fluxo completo COM TEMPOS */}
                        {isRefill ? (
                            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 space-y-3">
                                {/* BEFORE */}
                                <div className="flex justify-between items-center text-slate-400 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase text-slate-600">Antes ({fmtTime(notification.details.previousTimestamp)})</span>
                                        <span>Nível Inicial</span>
                                    </div>
                                    <span className="font-mono">{previousLevel.toFixed(0)} L</span>
                                </div>
                                
                                {/* DELTA */}
                                <div className="flex justify-between items-center text-emerald-400 text-sm font-bold bg-emerald-500/10 -mx-4 px-4 py-3 border-y border-emerald-500/20">
                                    <span className="flex items-center gap-2"><TrendingUp size={16}/> Abastecido</span>
                                    <span className="font-mono text-lg">+ {levelDiff.toFixed(0)} L</span>
                                </div>

                                {/* AFTER */}
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase text-slate-600">Depois ({fmtTime(notification.details.currentTimestamp || notification.timestamp)})</span>
                                        <span className="text-white font-medium text-sm">Nível Final</span>
                                    </div>
                                    <span className={`font-mono font-bold text-lg ${getColors().split(' ')[2]}`}>
                                        {currentLevel.toFixed(0)} L
                                    </span>
                                </div>
                                
                                <div className="text-[10px] text-slate-600 text-center mt-2 border-t border-slate-800 pt-2">
                                    Registrado em {fmtDate(notification.timestamp)}
                                </div>
                            </div>
                        ) : (
                            /* Visualização Padrão para alertas (sem soma) */
                            <>
                                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                    <span className="text-slate-400 text-sm">Nível no Momento</span>
                                    <span className={`font-mono font-bold ${getColors().split(' ')[2]}`}>
                                        {currentLevel.toFixed(0)} L
                                    </span>
                                </div>
                                {hasPrevious && (
                                     <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                        <span className="text-slate-500 text-sm">Nível Anterior</span>
                                        <div className="flex items-center gap-2">
                                            <ArrowDown size={14} className="text-rose-500"/>
                                            <span className="font-mono text-slate-500">{previousLevel.toFixed(0)} L</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-slate-400 text-sm">Capacidade Total</span>
                            <span className="font-mono text-slate-300">
                                {((currentLevel / notification.details.capacity) * 100).toFixed(1)}% <span className="text-slate-500 text-xs">ocupado</span>
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm flex items-center gap-2">
                                <Thermometer size={14} /> Temperatura
                            </span>
                            <span className="font-mono text-slate-300">
                                {notification.details.temperature?.toFixed(1) || '24.5'} °C
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-xs text-slate-500 text-center italic mt-auto">
                ID do Evento: {notification.id}
            </div>
        </div>
      </div>
    </div>
  );
};