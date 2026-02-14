
import React, { useState, useEffect, useMemo } from 'react';
import { Tank, AppNotification, RefillEvent } from '../types';
import { Download, Printer, Search, FileSpreadsheet, Calendar, Bell, Droplets, ShieldCheck, ShieldAlert, Truck } from 'lucide-react';
import { subscribeToRefillEvents } from '../services/firebaseService';

interface ReportsProps {
  tank: Tank;
  notifications: AppNotification[];
}

type ReportTab = 'readings' | 'notifications' | 'refills';

export const Reports: React.FC<ReportsProps> = ({ tank, notifications }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('readings');
  const [searchTerm, setSearchTerm] = useState('');
  const [refillEvents, setRefillEvents] = useState<RefillEvent[]>([]);

  useEffect(() => {
    const unsub = subscribeToRefillEvents(setRefillEvents);
    return () => unsub();
  }, []);

  const filteredHistory = useMemo(() => {
    return tank.history.filter(h => h.timestamp.includes(searchTerm) || h.level.toString().includes(searchTerm))
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tank.history, searchTerm]);

  const filteredRefills = useMemo(() => {
    return refillEvents.filter(e => e.timestamp.includes(searchTerm) || e.amount.toString().includes(searchTerm));
  }, [refillEvents, searchTerm]);

  const filteredNotifications = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return notifications.filter(n => 
      n.title.toLowerCase().includes(term) || 
      n.message.toLowerCase().includes(term) ||
      n.type.toLowerCase().includes(term)
    );
  }, [notifications, searchTerm]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end pb-6 border-b border-slate-800">
        <div><h2 className="text-2xl font-bold text-white">Central de Relatórios</h2><p className="text-slate-400 text-sm mt-1">Auditoria e controle de fluxos</p></div>
        <div className="flex gap-3"><button onClick={() => window.print()} className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Printer size={16}/> Imprimir</button></div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[650px]">
        <div className="bg-slate-900/40 border-b border-white/5 p-4 flex flex-col gap-4">
          <div className="flex gap-4 overflow-x-auto">
            <button onClick={() => setActiveTab('readings')} className={`pb-2 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'readings' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}><FileSpreadsheet size={16}/> Níveis</button>
            <button onClick={() => setActiveTab('notifications')} className={`pb-2 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'notifications' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}><Bell size={16}/> Alertas</button>
            <button onClick={() => setActiveTab('refills')} className={`pb-2 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'refills' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}><Truck size={16}/> Abastecimentos</button>
          </div>
          <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-500" size={16} /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="w-full bg-slate-900 border border-slate-700 text-slate-200 pl-10 pr-4 py-2 rounded-lg text-sm" /></div>
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === 'refills' ? (
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-800 text-slate-200 uppercase text-[10px] tracking-wider sticky top-0">
                <tr><th className="px-6 py-4">Data/Hora</th><th className="px-6 py-4">Vol. Anterior</th><th className="px-6 py-4">Entrada (L)</th><th className="px-6 py-4">Vol. Final</th><th className="px-6 py-4">Origem</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRefills.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-mono text-xs">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">{r.volumeBefore.toFixed(0)} L</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">+{r.amount.toFixed(0)} L</td>
                    <td className="px-6 py-4">{r.volumeAfter.toFixed(0)} L</td>
                    <td className="px-6 py-4">
                      {r.confirmedSupplier === true ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase"><ShieldCheck size={12}/> Confirmado</span>
                      ) : r.confirmedSupplier === false ? (
                        <span className="flex items-center gap-1 text-rose-400 text-[10px] font-bold uppercase"><ShieldAlert size={12}/> Outra Empresa</span>
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">Aguardando Confirmação</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'readings' ? (
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-800 text-slate-200 uppercase text-[10px] tracking-wider sticky top-0">
                <tr><th className="px-6 py-4">Hora</th><th className="px-6 py-4">Nível</th><th className="px-6 py-4">Temp</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredHistory.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-800/50"><td className="px-6 py-4 font-mono text-xs">{new Date(h.timestamp).toLocaleTimeString()}</td><td className="px-6 py-4 text-white font-mono">{h.level.toFixed(0)} L</td><td className="px-6 py-4">{h.temperature.toFixed(1)}°C</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-800 text-slate-200 uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Título</th>
                  <th className="px-6 py-4">Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredNotifications.length > 0 ? filteredNotifications.map(n => (
                  <tr key={n.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">{new Date(n.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        n.type === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        n.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {n.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{n.title}</td>
                    <td className="px-6 py-4 truncate max-w-md text-slate-400" title={n.message}>{n.message}</td>
                  </tr>
                )) : (
                   <tr>
                     <td colSpan={4} className="px-6 py-8 text-center text-slate-600 italic">Nenhuma notificação encontrada.</td>
                   </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
