
import React, { useMemo } from 'react';
import { Tank, TankStatus } from '../types';
import { TankGauge } from './TankGauge';
import { AlertTriangle, TrendingDown, Calendar, Clock, Thermometer, Droplets, ArrowRight, Truck, Check, X, ShoppingCart, CheckCircle, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import { confirmRefillSupplier, executeRefillFromOrder } from '../services/firebaseService';

interface DashboardProps {
  tank: Tank;
  onViewHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ tank, onViewHistory }) => {
  const handleConfirm = (isConfirmed: boolean) => {
    if (tank.lastRefillEvent?.firebaseId) {
      confirmRefillSupplier(tank.lastRefillEvent.firebaseId, isConfirmed);
    }
  };

  const handleExecuteRefill = () => {
    if (tank.autoOrder) {
      const target = tank.autoOrder.targetVolume || tank.capacity;
      executeRefillFromOrder(target, tank.dimensions.radius, tank.dimensions.length);
    }
  };

  // Helper para formatar data do último evento ou string legada
  const formatLastRefillDate = () => {
     if (tank.lastRefillEvent) {
         return new Date(tank.lastRefillEvent.timestamp).toLocaleDateString('pt-BR', {
             day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit'
         });
     }
     return tank.lastRefill || '--/--/--';
  };

  // Lógica para encontrar a última vez que o tanque esteve em estado crítico
  const lastCriticalDate = useMemo(() => {
    const criticalValue = tank.minThreshold * 0.5;
    for (let i = tank.history.length - 1; i >= 0; i--) {
        if (tank.history[i].level <= criticalValue) {
            return new Date(tank.history[i].timestamp);
        }
    }
    return null;
  }, [tank.history, tank.minThreshold]);

  // Cálculo da Margem de Segurança (LItros acima do crítico)
  const safetyMargin = tank.currentLevel - tank.minThreshold;
  const isSafetyMarginPositive = safetyMargin > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* CARD DE PEDIDO AUTOMÁTICO - DESTAQUE */}
      {tank.pendingOrder && (
        <div className="bg-gradient-to-r from-indigo-900/60 to-blue-900/60 border border-blue-500/30 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.15)] animate-fade-in">
            <div className="absolute -top-6 -right-6 p-4 opacity-5 rotate-12">
                <ShoppingCart size={150} className="text-white" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                    <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/50 text-blue-400 shadow-lg shadow-blue-900/50 shrink-0">
                         <Truck size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-lg shadow-blue-600/20">Solicitação Aberta</span>
                            <span className="text-slate-400 text-xs font-mono border border-slate-700 px-2 py-0.5 rounded bg-slate-900/50">ID: {tank.pendingOrder.id}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white leading-tight">Reabastecimento Diesel S-10</h3>
                        <div className="mt-2 text-sm text-slate-300 space-y-1">
                            <p>Fornecedor: <span className="text-white font-bold text-base">{tank.pendingOrder.supplier}</span></p>
                            <p>Volume Solicitado: <span className="text-blue-400 font-bold font-mono text-lg">{tank.pendingOrder.volume.toFixed(0)} Litros</span></p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
                    <button
                        onClick={handleExecuteRefill}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={20} />
                        <span>Confirmar Recebimento</span>
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                        <Clock size={10} />
                        <span>Gerado em: {new Date(tank.pendingOrder.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* DETECÇÃO DE ABASTECIMENTO MANUAL/FÍSICO */}
      {tank.lastRefillEvent && tank.lastRefillEvent.confirmedSupplier === null && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-400 shadow-lg">
          <div className="flex items-center gap-4">
            <Truck size={24} />
            <div>
              <h3 className="font-bold text-sm uppercase">Detecção de Fluxo de Entrada ({tank.lastRefillEvent.amount.toFixed(0)}L)</h3>
              <p className="text-xs text-emerald-300/80">O sensor detectou um aumento rápido de nível. Confirma que foi a empresa <b>{tank.autoOrder?.supplierName || 'cadastrada'}</b>?</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => handleConfirm(true)} className="flex-1 sm:flex-none bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"><Check size={14}/> SIM</button>
            <button onClick={() => handleConfirm(false)} className="flex-1 sm:flex-none bg-rose-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"><X size={14}/> NÃO</button>
          </div>
        </div>
      )}

      {(tank.status === TankStatus.LOW || tank.status === TankStatus.CRITICAL) && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-4 text-amber-400">
          <AlertTriangle size={20} /><div><h3 className="font-bold text-sm">Atenção: Nível {tank.status}</h3><p className="text-xs text-amber-300/80">Agende reabastecimento.</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="glass-panel p-8 rounded-3xl border-slate-700/50 shadow-2xl">
             <div className="flex justify-between items-center mb-6"><div><h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nível Atual</h3><p className="text-[10px] text-slate-500 mt-1">Capacidade: {tank.capacity.toLocaleString()} L</p></div><div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${tank.status === TankStatus.NORMAL ? 'text-emerald-400 border-emerald-500/20' : 'text-rose-400 border-rose-500/20'}`}>{tank.status}</div></div>
             <div className="h-[300px]"><TankGauge level={tank.currentLevel} capacity={tank.capacity} status={tank.status} /></div>
             <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5"><div className="flex items-center gap-2 text-slate-400 mb-2"><Thermometer size={14} /><span className="text-[10px] font-bold uppercase">Temp</span></div><span className="text-xl font-mono text-white">24.5°C</span></div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5"><div className="flex items-center gap-2 text-slate-400 mb-2"><Clock size={14} /><span className="text-[10px] font-bold uppercase">Status</span></div><span className="text-xl font-mono text-white truncate">{tank.status}</span></div>
             </div>
          </div>
        </div>
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2"><Droplets className="text-blue-500" /> Resumo Operacional</h3>
            <div className="space-y-4">
              
              {/* CARD DE ÚLTIMO ABASTECIMENTO - DETALHADO */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-white/5 gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mt-1 ${tank.lastRefillEvent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                      {tank.lastRefillEvent ? <Truck size={16} /> : '1'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Último Abastecimento</p>
                    {tank.lastRefillEvent ? (
                        <div className="space-y-1 mt-1">
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                {tank.lastRefillEvent.confirmedSupplier === true ? <ShieldCheck size={10} className="text-emerald-400"/> : <Activity size={10} />}
                                {tank.lastRefillEvent.confirmedSupplier === true ? 'Fornecedor Confirmado' : 'Entrada Detectada'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                                Vol: {tank.lastRefillEvent.volumeBefore.toFixed(0)}L <span className="text-emerald-500">➜</span> {tank.lastRefillEvent.volumeAfter.toFixed(0)}L
                            </p>
                        </div>
                    ) : (
                        <p className="text-[10px] text-slate-500">Histórico de entradas</p>
                    )}
                  </div>
                </div>
                <div className="text-right pl-14 sm:pl-0">
                    {tank.lastRefillEvent ? (
                        <div className="flex flex-col items-end">
                            <span className="font-mono text-emerald-400 font-bold text-lg">+{tank.lastRefillEvent.amount.toFixed(0)} L</span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                                <Calendar size={10} /> {formatLastRefillDate()}
                            </span>
                        </div>
                    ) : (
                        <span className="font-mono text-emerald-400 text-sm">{formatLastRefillDate()}</span>
                    )}
                </div>
              </div>

              {/* CARD DE PONTO CRÍTICO - DETALHADO */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-white/5 gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mt-1 ${lastCriticalDate || !isSafetyMarginPositive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                    {lastCriticalDate ? <AlertTriangle size={16}/> : '2'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Ponto Crítico ({tank.minThreshold} L)</p>
                    <div className="mt-1">
                         {isSafetyMarginPositive ? (
                             <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                                 <ShieldCheck size={10} /> Margem Segura: +{safetyMargin.toFixed(0)} L
                             </p>
                         ) : (
                             <p className="text-[11px] text-rose-400 flex items-center gap-1 font-bold">
                                 <ShieldAlert size={10} /> Abaixo do Limite: {safetyMargin.toFixed(0)} L
                             </p>
                         )}
                         <p className="text-[10px] text-slate-500 mt-0.5">Volume de reserva técnica</p>
                    </div>
                  </div>
                </div>
                <div className="text-right pl-14 sm:pl-0">
                    <div className="flex flex-col items-end">
                        <span className={`font-mono font-bold text-lg ${isSafetyMarginPositive ? 'text-slate-300' : 'text-rose-400'}`}>
                            {tank.minThreshold} L
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                            {lastCriticalDate ? (
                                <><AlertTriangle size={10} /> Última vez: {lastCriticalDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</>
                            ) : (
                                "Status Operacional: Normal"
                            )}
                        </span>
                    </div>
                </div>
              </div>

            </div>
            <button onClick={onViewHistory} className="w-full mt-6 py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 text-sm">Ver Relatórios Completos <ArrowRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
