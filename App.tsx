
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Tank, TankStatus, AppNotification, PendingOrder, RefillEvent } from './types';
import { INITIAL_TANK } from './services/mockDataService';
import { 
  subscribeToTankLevel, subscribeToHistory, calculateVolume, logHistoryToFirebase, saveTankConfig, 
  subscribeToTankConfig, addNotification, subscribeToNotifications, markNotificationAsRead,
  subscribeToSimulationStatus, subscribeToSimulationInterval, updateTankHeight, subscribeToUserSecurity,
  subscribeToPendingOrder, setPendingOrder, logRefillEvent, subscribeToLastRefillEvent, findHeightForVolume,
  updateLastRefillEvent
} from './services/firebaseService';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { AdminLogin } from './components/AdminLogin';
import { AuthScreen } from './components/AuthScreen';
import { NotificationModal } from './components/NotificationModal';
import { Notepad } from './components/Notepad';
import { LayoutDashboard, BarChart3, FileText, Settings as SettingsIcon, Bell, ChevronRight, LogOut, Menu, X as CloseIcon } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSimActive, setIsSimActive] = useState(false);
  const [simInterval, setSimInterval] = useState(10);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [rawHeight, setRawHeight] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [tank, setTank] = useState<Tank>({ ...INITIAL_TANK, history: [] });
  
  const prevHeightRef = useRef<number | null>(null);

  // Logout Inatividade
  useEffect(() => {
    if (!currentUser) return;
    let tid: number;
    const reset = () => {
      if (tid) clearTimeout(tid);
      tid = window.setTimeout(() => { setCurrentUser(null); alert("Inatividade (5 min)"); }, 5 * 60 * 1000);
    };
    ['mousedown', 'mousemove', 'keypress', 'touchstart'].forEach(e => document.addEventListener(e, reset));
    reset();
    return () => { if (tid) clearTimeout(tid); };
  }, [currentUser]);

  // Firebase Subs
  useEffect(() => {
    const unsubSim = subscribeToSimulationStatus(setIsSimActive);
    const unsubInterval = subscribeToSimulationInterval(setSimInterval);
    const unsubOrder = subscribeToPendingOrder((o) => setTank(p => ({ ...p, pendingOrder: o })));
    const unsubLastRefill = subscribeToLastRefillEvent((e) => setTank(p => ({ ...p, lastRefillEvent: e })));
    
    // Configura a capacidade
    const unsubConfig = subscribeToTankConfig((c) => {
      if (c) {
        const geometricCapacity = calculateVolume(c.dimensions.radius * 2, c.dimensions.radius, c.dimensions.length);
        // Lógica Principal: Se houver capacidade nominal definida, use-a. Caso contrário, use a geométrica.
        const effectiveCapacity = c.nominalCapacity && c.nominalCapacity > 0 ? c.nominalCapacity : geometricCapacity;
        
        setTank(p => ({ 
          ...p, 
          ...c, 
          capacity: effectiveCapacity // Dashboard usará este valor
        }));
      }
    });

    const unsubLevel = subscribeToTankLevel((h) => { setRawHeight(h); setIsConnected(true); });
    const unsubHistory = subscribeToHistory((h) => setTank(p => ({ ...p, history: h })));
    const unsubNotifs = subscribeToNotifications(setNotifications);
    return () => { unsubSim(); unsubInterval(); unsubOrder(); unsubLastRefill(); unsubConfig(); unsubLevel(); unsubHistory(); unsubNotifs(); };
  }, []);

  // Robô de Simulação
  useEffect(() => {
    if (!isSimActive || !isConnected) return;
    const interval = setInterval(() => {
      // Regra de Negócio: Apenas Horário Comercial (Seg-Sex, 08h-18h)
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Domingo, 6 = Sábado
      
      const isBusinessHours = day >= 1 && day <= 5 && hour >= 8 && hour < 18;

      if (!isBusinessHours) {
        // Robô em standby fora do horário comercial
        return;
      }

      const vol = calculateVolume(rawHeight, tank.dimensions.radius, tank.dimensions.length);
      let nextVol = vol;
      
      if (Math.random() < 0.1) {
        nextVol = Math.min(tank.capacity, vol + (Math.random() * 3000 + 500));
      } else {
        nextVol = Math.max(0, vol - (Math.random() * 200 + 50));
      }

      const nextH = findHeightForVolume(nextVol, tank.dimensions.radius, tank.dimensions.length);
      if (nextH !== rawHeight) updateTankHeight(nextH);
    }, simInterval * 1000);
    return () => clearInterval(interval);
  }, [isSimActive, isConnected, rawHeight, tank.dimensions, simInterval, tank.capacity]);

  // Detector de Mudanças e Regras de Negócio
  useEffect(() => {
    if (!isConnected) return;
    const vol = calculateVolume(rawHeight, tank.dimensions.radius, tank.dimensions.length);
    const currentTime = new Date().toISOString();
    
    if (prevHeightRef.current !== null && rawHeight !== prevHeightRef.current) {
      const prevVol = calculateVolume(prevHeightRef.current, tank.dimensions.radius, tank.dimensions.length);
      const delta = vol - prevVol;

      // REFILL DETECTION LOGIC - AGGREGATION & NOISE REDUCTION
      // Aumentado threshold de 20 para 50 para evitar ruídos
      if (delta > 50) {
        // Verifica se há um evento ativo recente (< 30 min) ainda não confirmado
        const lastEvent = tank.lastRefillEvent;
        const isRecent = lastEvent && 
                         (new Date().getTime() - new Date(lastEvent.timestamp).getTime() < 30 * 60 * 1000) &&
                         lastEvent.confirmedSupplier === null;

        if (isRecent && lastEvent) {
          // AGREGAR AO EVENTO EXISTENTE
          // Recalcula o total baseado no volume INICIAL do evento original para evitar soma de oscilações
          const totalAmount = vol - lastEvent.volumeBefore;
          
          if (totalAmount > lastEvent.amount) { // Só atualiza se o volume aumentou
             const updatedEvent: RefillEvent = {
                 ...lastEvent,
                 volumeAfter: vol,
                 amount: totalAmount,
                 timestamp: currentTime // Atualiza timestamp para manter a janela aberta
             };
             updateLastRefillEvent(updatedEvent);
             // NÃO gera nova notificação na lista para evitar spam
          }
        } else {
          // NOVO EVENTO
          const newRefill: RefillEvent = {
            id: `REF-${Date.now()}`,
            timestamp: currentTime,
            volumeBefore: prevVol,
            volumeAfter: vol,
            amount: delta,
            confirmedSupplier: null
          };
          logRefillEvent(newRefill);
          addNotification('success', 'Abastecimento Detectado', `Entrada de ${delta.toFixed(0)}L detectada. Confirme o fornecedor.`, tank);
        }
      }

      if (vol < (tank.minThreshold * 0.5) && !tank.pendingOrder && tank.autoOrder?.enabled) {
        const target = tank.autoOrder.targetVolume || tank.capacity;
        const orderVol = target - vol;
        const o: PendingOrder = { id: `ORD-${Date.now()}`, supplier: tank.autoOrder.supplierName, volume: orderVol, timestamp: currentTime };
        setPendingOrder(o);
        addNotification('critical', 'Pedido Automático', `Nível crítico! Pedido de ${orderVol.toFixed(0)}L gerado para ${o.supplier}.`, tank);
      }
      logHistoryToFirebase(tank, rawHeight, vol);
    }
    prevHeightRef.current = rawHeight;
    setTank(p => ({ ...p, currentHeight: rawHeight, currentLevel: vol, status: vol < tank.minThreshold * 0.5 ? TankStatus.CRITICAL : vol < tank.minThreshold ? TankStatus.LOW : TankStatus.NORMAL }));
  }, [rawHeight]);

  // SAER Labs Logo
  const SaerLogo = () => (
    <div className="relative w-11 h-11 shrink-0 group">
      {/* Tech Glow */}
      <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-lg group-hover:bg-cyan-400/30 transition-all"></div>
      
      {/* SVG Logo */}
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full relative z-10 drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="saer-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        
        {/* Outer Tech Shape */}
        <path d="M20 20H80V80H20V20Z" stroke="url(#saer-gradient)" strokeWidth="2" fill="#0f172a" rx="15" />
        <circle cx="20" cy="20" r="4" fill="#22d3ee" />
        <circle cx="80" cy="80" r="4" fill="#6366f1" />
        
        {/* Stylized 'S' for SAER */}
        <path d="M65 35H40C37.2386 35 35 37.2386 35 40V45C35 47.7614 37.2386 50 40 50H60C62.7614 50 65 52.2386 65 55V60C65 62.7614 62.7614 65 60 65H35" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M65 35H40C37.2386 35 35 37.2386 35 40V45C35 47.7614 37.2386 50 40 50H60C62.7614 50 65 52.2386 65 55V60C65 62.7614 62.7614 65 60 65H35" stroke="url(#saer-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  if (!currentUser) return <AuthScreen onLoginSuccess={setCurrentUser} />;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-950">
      {/* Overlay para o Menu Lateral Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 border-r border-slate-800 z-[100] transition-transform lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} bg-slate-900`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-3 mb-8 pl-1">
            <SaerLogo />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-tight">SAER Labs</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-tight flex flex-col">
                <span>Parceria Técnica</span>
                <span className="text-blue-400 font-bold">LK Metalúrgica</span>
              </p>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            {[ {id:'dashboard', l:'Geral', i:LayoutDashboard}, {id:'analytics', l:'Intelligence', i:BarChart3}, {id:'reports', l:'Relatórios', i:FileText}, {id:'settings', l:'Configuração', i:SettingsIcon} ].map(n => (
              <button key={n.id} onClick={() => {setView(n.id as any); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === n.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><n.i size={18}/><span>{n.l}</span></button>
            ))}
            <button onClick={() => setCurrentUser(null)} className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl mt-4"><LogOut size={18}/><span>Sair</span></button>
          </nav>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between px-6">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-300"><Menu/></button>
          <div className="flex flex-col">
             <h2 className="text-white font-bold uppercase tracking-wide text-sm">{view}</h2>
             <span className="text-[10px] text-slate-500">Unidade Monitorada: LK-01</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-slate-400"><Bell/>{notifications.some(n=>!n.read) && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>}</button>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">{currentUser.name.charAt(0)}</div>
          </div>
        </header>
        {showNotifications && (
          <>
            {/* Overlay transparente para fechar ao clicar fora */}
            <div 
              className="fixed inset-0 z-[95] bg-transparent" 
              onClick={() => setShowNotifications(false)}
            />
            <div className="fixed top-16 right-4 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] max-h-96 overflow-y-auto p-2">
              {notifications.map(n => (
                <div key={n.id} onClick={()=>{setSelectedNotification(n); markNotificationAsRead(n.id); setShowNotifications(false);}} className={`p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 rounded-lg mb-1 ${!n.read?'bg-blue-500/5':''}`}>
                  <p className="text-xs font-bold text-white">{n.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{n.message}</p>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {view === 'dashboard' && <Dashboard tank={tank} onViewHistory={() => setView('reports')} />}
            {view === 'analytics' && <Analytics tank={tank} />}
            {view === 'reports' && <Reports tank={tank} notifications={notifications} />}
            {view === 'settings' && <Settings tank={tank} onUpdateSettings={saveTankConfig} currentSensorValue={rawHeight} />}
          </div>
        </div>
      </main>
      <Notepad currentUser={currentUser} />
      {selectedNotification && <NotificationModal notification={selectedNotification} onClose={() => setSelectedNotification(null)} />}
    </div>
  );
};
export default App;
