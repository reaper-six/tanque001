
import React, { useState, useMemo, useEffect } from 'react';
import { Tank, AiReport } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Bot, Loader2, Sparkles, Cpu, Droplets, History, FileText, ChevronRight } from 'lucide-react';
import { getConsumptionAnalysis } from '../services/geminiService';
import { saveAiReport, subscribeToAiReports } from '../services/firebaseService';
import ReactMarkdown from 'react-markdown';

interface AnalyticsProps {
  tank: Tank;
}

export const Analytics: React.FC<AnalyticsProps> = ({ tank }) => {
  const [currentReport, setCurrentReport] = useState<AiReport | null>(null);
  const [reportHistory, setReportHistory] = useState<AiReport[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Subscribe to Saved Reports
  useEffect(() => {
    const unsub = subscribeToAiReports(tank.id, (reports) => {
      setReportHistory(reports);
      // Automatically load the latest report if we don't have one showing yet
      if (reports.length > 0 && !currentReport) {
        setCurrentReport(reports[0]);
      }
    });
    return () => unsub();
  }, [tank.id]); // Removed 'currentReport' from dependency to avoid override if user selects an older one

  // Prepare data for main Area Chart - Limit to last 30 points for readability
  const chartData = [...tank.history].slice(-30).map(h => ({
    date: h.timestamp.split('T')[0].slice(5) + ' ' + h.timestamp.split('T')[1].slice(0,2)+'h',
    level: h.level,
    temp: h.temperature
  }));

  // Calculate Daily Consumption for the Bar Chart
  const dailyConsumptionData = useMemo(() => {
    const consumptionMap = new Map<string, number>();

    // Iterate through history to sum consumption (drops in level) per day
    // Assuming history is sorted Oldest -> Newest
    for (let i = 1; i < tank.history.length; i++) {
        const prev = tank.history[i-1];
        const curr = tank.history[i];
        const day = curr.timestamp.split('T')[0]; // YYYY-MM-DD
        
        // Calculate drop. If level increased, it's a refill (ignore for consumption sum)
        const drop = prev.level - curr.level;
        
        if (drop > 0) {
            const currentTotal = consumptionMap.get(day) || 0;
            consumptionMap.set(day, currentTotal + drop);
        }
    }

    // Convert map to array, sort by date, and take last 7 days
    return Array.from(consumptionMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-7)
        .map(([date, liters]) => ({
            day: date.split('-').slice(1).join('/'), // MM/DD
            liters: Math.round(liters)
        }));
  }, [tank.history]);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    // Keep showing old report while loading new one? Or clear? Let's keep old one for context or clear if desired.
    // setCurrentReport(null); 
    
    const resultText = await getConsumptionAnalysis(tank);
    
    // Save to Firebase
    await saveAiReport(resultText, tank.id);
    
    // Optimistic update (though subscription will catch it too)
    setCurrentReport({
        id: 'temp',
        timestamp: new Date().toISOString(),
        content: resultText,
        tankId: tank.id
    });
    
    setLoadingAi(false);
  };

  const loadReport = (report: AiReport) => {
      setCurrentReport(report);
      setShowHistory(false); // Close menu on mobile/toggle
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 animate-fade-in">
      <div className="border-b border-slate-800 pb-6">
         <h2 className="text-xl md:text-2xl font-bold text-white">Intelligence Hub</h2>
         <p className="text-slate-400 text-sm">Análise detalhada do comportamento da unidade: {tank.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-4 md:p-6 rounded-2xl relative">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Curva de Nível Real</h3>
             <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Nível (L)</span>
             </div>
          </div>
          
          <div className="h-[300px] md:h-[350px] w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
                <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/1000).toFixed(1)}k`} width={35} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #475569', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="level" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorLevel)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Consumption Chart */}
        <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col">
           <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Consumo Recente</h3>
               <Droplets size={16} className="text-cyan-400" />
           </div>
           
           <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyConsumptionData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                   <XAxis dataKey="day" fontSize={10} stroke="#64748b" axisLine={false} tickLine={false} />
                   <Tooltip 
                     cursor={{fill: '#334155', opacity: 0.4}}
                     contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #475569', color: '#fff' }}
                     formatter={(value: number) => [`${value} L`, 'Consumo']}
                   />
                   <Bar 
                    dataKey="liters" 
                    fill="url(#colorConsumption)" 
                    radius={[4, 4, 0, 0]} 
                    barSize={20} 
                   >
                     {/* Gradient definition for bars inside SVG */}
                     <defs>
                        <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        </linearGradient>
                     </defs>
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-4 flex justify-between items-center px-2">
                <span className="text-xs text-slate-500">Total 7 dias</span>
                <span className="text-sm font-mono font-bold text-white">
                    {dailyConsumptionData.reduce((acc, curr) => acc + curr.liters, 0).toLocaleString()} L
                </span>
           </div>
        </div>
      </div>

      {/* AI Section - Futuristic Look */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500">
        <div className="bg-slate-900 rounded-2xl p-4 md:p-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
                    <Cpu size={32} className="text-white" />
                </div>
                <div className="flex-1 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <h3 className="text-xl font-bold text-white">Smart Tank Neural Core</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-widest font-semibold">Gemini 3 Powered</span>
                        </div>

                        {/* History Toggle */}
                        {reportHistory.length > 0 && (
                            <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-all">
                                <History size={14} /> Histórico ({reportHistory.length})
                            </button>
                        )}
                    </div>
                    
                    <p className="text-slate-400 mb-6 text-sm max-w-2xl">
                    Solicite uma análise profunda sobre os padrões de abastecimento e consumo desta unidade específica. Nossa IA identificará anomalias e sugerirá otimizações logísticas.
                    </p>
                    
                    {/* Action Area */}
                    <div className="flex flex-wrap items-center gap-4">
                        {!loadingAi && (
                            <button 
                                onClick={handleAiAnalysis}
                                className="group relative inline-flex justify-center items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-95"
                            >
                                <Sparkles size={18} className="text-blue-600" />
                                <span>{currentReport ? 'Atualizar Diagnóstico' : 'Iniciar Diagnóstico'}</span>
                            </button>
                        )}

                        {loadingAi && (
                        <div className="flex items-center gap-3 text-cyan-300 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                            <Loader2 className="animate-spin" />
                            <span className="font-mono text-sm">PROCESSANDO DADOS DE TELEMETRIA...</span>
                        </div>
                        )}
                    </div>
                    
                    {/* History Sidebar/List Dropdown */}
                    {showHistory && (
                        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden animate-fade-in mb-4 max-h-60 overflow-y-auto">
                            <div className="p-2 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                                Relatórios Arquivados
                            </div>
                            {reportHistory.map((report) => (
                                <button 
                                    key={report.id} 
                                    onClick={() => loadReport(report)}
                                    className={`w-full text-left p-3 text-sm flex items-center justify-between border-b border-slate-800/50 hover:bg-slate-800 transition-colors ${currentReport?.id === report.id ? 'bg-blue-900/20 text-blue-300' : 'text-slate-400'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText size={16} />
                                        <span>Análise de {new Date(report.timestamp).toLocaleString()}</span>
                                    </div>
                                    {currentReport?.id === report.id && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Report Display */}
                    {currentReport && !loadingAi && (
                    <div className="mt-6 bg-slate-800/50 p-4 md:p-6 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
                             <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                                 <Cpu size={14} /> RELATÓRIO GERADO: {new Date(currentReport.timestamp).toLocaleString()}
                             </div>
                             {currentReport.id !== 'temp' && <span className="text-[10px] text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">SALVO NO BANCO DE DADOS</span>}
                        </div>
                        <div className="text-slate-300 prose prose-invert prose-headings:text-cyan-400 prose-strong:text-white max-w-none text-sm max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            <ReactMarkdown>{currentReport.content}</ReactMarkdown>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
