
import React, { useState } from 'react';
import { Tank, TankDimensions, AutoOrderConfig } from '../types';
import { Save, Ruler, Activity, BellRing, Power, Mail, Phone, ShoppingCart, Plus, X, Building, Truck, Cylinder, Settings as SettingsIcon } from 'lucide-react';
import { calculateVolume } from '../services/firebaseService';
import { SimulationBot } from './SimulationBot';

interface SettingsProps {
  tank: Tank;
  onUpdateSettings: (newDimensions: TankDimensions, nominalCapacity: number, newName: string, newLocation: string, minThreshold: number, enableRefillAlerts: boolean, emails: string[], emailEnabled: boolean, autoOrder: AutoOrderConfig) => void;
  currentSensorValue: number;
}

export const Settings: React.FC<SettingsProps> = ({ tank, onUpdateSettings, currentSensorValue }) => {
  const [radius, setRadius] = useState(tank.dimensions.radius);
  const [length, setLength] = useState(tank.dimensions.length);
  const [nominalCapacity, setNominalCapacity] = useState(tank.nominalCapacity || 0);
  const [name, setName] = useState(tank.name);
  const [location, setLocation] = useState(tank.location);
  const [minThreshold, setMinThreshold] = useState(tank.minThreshold);
  const [enableRefillAlerts, setEnableRefillAlerts] = useState(tank.enableRefillAlerts ?? true);
  const [emailList, setEmailList] = useState<string[]>(tank.notificationEmails || []);
  const [newEmail, setNewEmail] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(tank.enableEmailAlerts || false);
  
  // Auto Order States
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(tank.autoOrder?.enabled || false);
  const [supplierName, setSupplierName] = useState(tank.autoOrder?.supplierName || '');
  const [supplierPhone, setSupplierPhone] = useState(tank.autoOrder?.supplierPhone || '');
  const [supplierEmail, setSupplierEmail] = useState(tank.autoOrder?.supplierEmail || '');
  const [targetVolume, setTargetVolume] = useState(tank.autoOrder?.targetVolume || tank.capacity || 10000);

  const [saved, setSaved] = useState(false);

  // Geometric Calculation (Real)
  const geometricCapacity = calculateVolume(radius * 2, radius, length);
  const currentVolume = calculateVolume(currentSensorValue, radius, length);

  const handleAddEmail = () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) || emailList.includes(newEmail)) return;
    setEmailList([...emailList, newEmail]);
    setNewEmail('');
  };

  const handleSave = () => {
    const autoOrder: AutoOrderConfig = { 
      enabled: autoOrderEnabled, 
      supplierName, 
      supplierPhone, 
      supplierEmail, 
      targetVolume 
    };
    onUpdateSettings({ radius, length }, nominalCapacity, name, location, minThreshold, enableRefillAlerts, emailList, emailEnabled, autoOrder);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-bold text-white">Configurações do Tanque</h2>
            <p className="text-slate-400 text-sm">Parâmetros físicos, regras de negócio e alertas.</p>
         </div>
         <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2 active:scale-95 text-sm">
            {saved ? <span className="text-emerald-100">Salvo!</span> : <><Save size={18} /> Salvar Alterações</>}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {/* COLUNA PRINCIPAL - CONFIGURAÇÕES */}
        <div className="xl:col-span-7 flex flex-col gap-6">
            <div className="glass-panel p-6 md:p-8 rounded-2xl space-y-8">
                
                {/* IDENTIFICAÇÃO */}
                <div className="space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 text-lg border-b border-slate-700/50 pb-2">
                        <SettingsIcon size={20} className="text-slate-400" /> Identificação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Tanque</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Localização</label>
                            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                    </div>
                </div>

                {/* GEOMETRIA */}
                <div className="space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 text-lg border-b border-slate-700/50 pb-2">
                        <Ruler size={20} className="text-blue-500" /> Geometria & Capacidade
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Raio (mm)</label>
                            <input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comprimento (mm)</label>
                            <input type="number" value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                        <label className="block text-xs font-bold text-emerald-500 uppercase mb-2 flex items-center gap-2">
                            <Cylinder size={14} /> Volume Nominal Declarado (L)
                        </label>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <input 
                                type="number" 
                                value={nominalCapacity} 
                                onChange={(e) => setNominalCapacity(Number(e.target.value))} 
                                placeholder={geometricCapacity.toFixed(0)}
                                className="w-full md:w-1/2 bg-slate-900 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 font-bold font-mono text-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                            />
                            <div className="text-xs text-slate-400">
                                <p>Capacidade oficial do fabricante.</p>
                                <p>Volume Geométrico Calculado: <span className="text-slate-200 font-mono">{geometricCapacity.toFixed(0)} L</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ALERTAS */}
                <div className="space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 text-lg border-b border-slate-700/50 pb-2">
                        <BellRing size={20} className="text-amber-500" /> Alertas
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nível Crítico (L)</label>
                            <input type="number" value={minThreshold} onChange={(e) => setMinThreshold(Number(e.target.value))} className="w-full bg-slate-900 border border-amber-900/50 rounded-lg px-4 py-3 text-amber-500 font-mono focus:ring-2 focus:ring-amber-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Alertar Abastecimento</label>
                            <div onClick={() => setEnableRefillAlerts(!enableRefillAlerts)} className={`w-full h-[48px] rounded-lg border cursor-pointer transition-all flex items-center px-4 gap-3 select-none ${enableRefillAlerts ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800 border-slate-600'}`}>
                                 <Power size={18} className={enableRefillAlerts ? "text-emerald-400" : "text-slate-400"} />
                                 <span className={`text-sm font-medium ${enableRefillAlerts ? "text-emerald-400" : "text-slate-400"}`}>{enableRefillAlerts ? 'ATIVADO' : 'DESATIVADO'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EMAIL */}
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2"><Mail size={16} className="text-blue-400" /><span className="text-sm font-medium text-white">Notificações por E-mail</span></div>
                            <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
                            <div className="w-9 h-5 bg-slate-700 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                    </div>
                    {emailEnabled && (
                        <div className="animate-fade-in space-y-3">
                            <div className="flex gap-2">
                                <input type="email" placeholder="Adicionar e-mail..." value={newEmail} onChange={(e) => setNewEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()} className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm outline-none" />
                                <button onClick={handleAddEmail} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg"><Plus size={18} /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {emailList.map((email, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-slate-700/50 text-slate-200 px-3 py-1 rounded-md border border-slate-600 text-xs">
                                        <span className="truncate max-w-[150px]">{email}</span>
                                        <button onClick={() => setEmailList(emailList.filter(e => e !== email))} className="text-slate-400 hover:text-rose-400"><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* AUTO ORDER */}
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={16} className="text-purple-400" />
                            <span className="text-sm font-bold text-white">Fazer Pedido Automático</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={autoOrderEnabled} onChange={(e) => setAutoOrderEnabled(e.target.checked)} />
                            <div className="w-9 h-5 bg-slate-700 rounded-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                    </div>
                    
                    {autoOrderEnabled && (
                        <div className="space-y-4 animate-fade-in border-t border-slate-700 pt-4 mt-2">
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Nome da Empresa</label>
                                    <div className="relative">
                                        <Building size={14} className="absolute left-3 top-2.5 text-slate-500" />
                                        <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Ex: Shell Brasil" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-purple-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Telefone</label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-2.5 text-slate-500" />
                                            <input type="text" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} placeholder="(11) 9999-9999" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-purple-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 uppercase mb-1">E-mail</label>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-3 top-2.5 text-slate-500" />
                                            <input type="email" value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} placeholder="pedidos@empresa.com" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-purple-500" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Preencher até (L)</label>
                                    <input type="number" value={targetVolume} onChange={(e) => setTargetVolume(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>

        {/* COLUNA DIREITA - SIMULAÇÃO E DIAGNÓSTICO */}
        <div className="xl:col-span-5 flex flex-col gap-6">
            
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Activity size={20} className="text-emerald-400" /> Diagnóstico em Tempo Real</h3>
                <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4"><span className="text-slate-400 text-sm">Leitura do Sensor</span><span className="font-mono text-xl text-yellow-400 font-bold">{currentSensorValue} mm</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4"><span className="text-slate-400 text-sm">Volume Calculado (Real)</span><span className="font-mono text-xl text-emerald-400 font-bold">{currentVolume.toFixed(0)} L</span></div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Capacidade Definida</span>
                        <span className="font-mono text-xl text-white font-bold">{tank.capacity.toFixed(0)} L</span>
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 mt-4">
                         <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 uppercase font-bold">Volume Geométrico</span>
                            <span className="text-slate-400 font-mono">{geometricCapacity.toFixed(0)} L</span>
                         </div>
                         <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full" style={{ width: `${Math.min(100, (currentVolume / geometricCapacity) * 100)}%` }}></div>
                         </div>
                    </div>
                </div>
            </div>

            <SimulationBot tank={tank} />
        </div>
      </div>
    </div>
  );
};
