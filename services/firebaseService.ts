
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, query, limitToLast, update, get, child, remove, orderByChild, equalTo } from 'firebase/database';
import { Tank, TankDimensions, Reading, AppNotification, User, AutoOrderConfig, PendingOrder, RefillEvent, AiReport } from '../types';

const firebaseConfig = {
  databaseURL: "https://smarttank-59f95-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const calculateVolume = (h: number, r: number, l: number): number => {
  if (h <= 0) return 0;
  if (h >= 2 * r) return (Math.PI * Math.pow(r, 2) * l) / 1000000;
  const term1 = Math.pow(r, 2) * Math.acos((r - h) / r);
  const term2 = (r - h) * Math.sqrt(2 * r * h - Math.pow(h, 2));
  const area = term1 - term2;
  return (area * l) / 1000000;
};

// Helper para encontrar altura (mm) a partir de um volume alvo (L)
export const findHeightForVolume = (targetVol: number, radius: number, length: number): number => {
  let low = 0, high = radius * 2;
  for (let i = 0; i < 26; i++) {
    let mid = (low + high) / 2;
    if (calculateVolume(mid, radius, length) < targetVol) low = mid;
    else high = mid;
  }
  return Math.round((low + high) / 2);
};

export const subscribeToTankLevel = (onData: (heightMm: number) => void) => {
  return onValue(ref(db, 'tank'), (snapshot) => {
    const data = snapshot.val();
    if (data !== null) onData(Number(data));
  });
};

export const updateTankHeight = (heightMm: number) => set(ref(db, 'tank'), heightMm);

export const setSimulationStatus = (isActive: boolean) => set(ref(db, 'simulation/isActive'), isActive);
export const subscribeToSimulationStatus = (onData: (isActive: boolean) => void) => {
  return onValue(ref(db, 'simulation/isActive'), (snapshot) => onData(!!snapshot.val()));
};

export const subscribeToHistory = (onData: (history: Reading[]) => void) => {
  const q = query(ref(db, 'history'), limitToLast(2000));
  return onValue(q, (snapshot) => {
    const data = snapshot.val();
    if (!data) { onData([]); return; }
    const readings: Reading[] = Object.values(data).map((item: any) => ({
      timestamp: item.timestamp,
      level: Number(item.level_liters),
      temperature: item.temperature || 24.5
    }));
    onData(readings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  });
};

export const logHistoryToFirebase = (tank: Tank, heightMm: number, volumeLiters: number) => {
  const newEntryRef = push(ref(db, 'history'));
  set(newEntryRef, {
    timestamp: new Date().toISOString(),
    tankId: tank.id,
    height_mm: heightMm,
    level_liters: volumeLiters,
    status: tank.status,
    temperature: 24.5 + (Math.random() * 2 - 1)
  });
};

export const saveTankConfig = (dims: TankDimensions, nominalCapacity: number, name: string, location: string, minThreshold: number, enableRefillAlerts: boolean, notificationEmails: string[], enableEmailAlerts: boolean, autoOrder?: AutoOrderConfig) => {
  set(ref(db, 'tankConfig'), { name, location, dimensions: dims, nominalCapacity, minThreshold, enableRefillAlerts, notificationEmails, enableEmailAlerts, autoOrder });
};

export const setPendingOrder = (order: PendingOrder | null) => set(ref(db, 'pendingOrder'), order);
export const subscribeToPendingOrder = (onData: (order: PendingOrder | null) => void) => onValue(ref(db, 'pendingOrder'), (s) => onData(s.val()));

export const logRefillEvent = (event: RefillEvent) => {
  const newRef = push(ref(db, 'refill_events'));
  set(newRef, event);
  set(ref(db, 'lastRefillEvent'), { ...event, firebaseId: newRef.key });
};

export const updateLastRefillEvent = (event: RefillEvent) => {
  if (event.firebaseId) {
    update(ref(db, `refill_events/${event.firebaseId}`), event);
  }
  set(ref(db, 'lastRefillEvent'), event);
};

export const confirmRefillSupplier = async (firebaseId: string, isConfirmed: boolean) => {
  await update(ref(db, `refill_events/${firebaseId}`), { confirmedSupplier: isConfirmed });
  set(ref(db, 'lastRefillEvent'), null);
};

export const executeRefillFromOrder = async (targetVolume: number, radius: number, length: number) => {
  const newHeight = findHeightForVolume(targetVolume, radius, length);
  await updateTankHeight(newHeight);
  await setPendingOrder(null);
};

export const subscribeToRefillEvents = (onData: (events: RefillEvent[]) => void) => {
  return onValue(ref(db, 'refill_events'), (snapshot) => {
    const data = snapshot.val();
    if (!data) { onData([]); return; }
    const list = Object.entries(data).map(([key, val]: [string, any]) => ({ ...val, id: key, firebaseId: key }));
    onData(list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  });
};

export const subscribeToLastRefillEvent = (onData: (event: any) => void) => onValue(ref(db, 'lastRefillEvent'), (s) => onData(s.val()));

export const subscribeToTankConfig = (onData: (config: any) => void) => onValue(ref(db, 'tankConfig'), (s) => onData(s.val()));

export const addNotification = (type: any, title: string, message: string, tankSnapshot: Tank, emailsTo?: string[]) => {
  const newRef = push(ref(db, 'notifications'));
  set(newRef, { timestamp: new Date().toISOString(), type, title, message, read: false, emailTargets: emailsTo || null, details: { level: tankSnapshot.currentLevel, capacity: tankSnapshot.capacity, temperature: 24.5 } });
};

export const subscribeToNotifications = (onData: (n: AppNotification[]) => void) => {
  return onValue(query(ref(db, 'notifications'), limitToLast(50)), (s) => {
    const data = s.val();
    if (!data) { onData([]); return; }
    onData(Object.entries(data).map(([k, v]: [string, any]) => ({ id: k, ...v })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  });
};

export const markNotificationAsRead = (id: string) => update(ref(db, `notifications/${id}`), { read: true });

export const loginUser = async (username: string, password: string): Promise<any> => {
  const userId = username.toLowerCase().replace(/\s/g, '');
  const s = await get(child(ref(db), `users/${userId}`));
  if (!s.exists()) return { success: false, message: 'Não encontrado' };
  const ud = s.val();
  if (ud.password !== password) return { success: false, message: 'Senha incorreta' };
  return { success: true, user: { username: userId, name: ud.name, status: ud.status } };
};

export const registerUser = async (username: string, password: string, name: string): Promise<any> => {
  const userId = username.toLowerCase().replace(/\s/g, '');
  const userRef = ref(db, `users/${userId}`);
  const s = await get(userRef);
  if (s.exists()) return { success: false, message: 'Usuário já existe' };
  await set(userRef, { name, password, status: '01' });
  return { success: true };
};

export const subscribeToUsers = (onData: (users: User[]) => void) => {
  return onValue(ref(db, 'users'), (snapshot) => {
    const data = snapshot.val();
    if (!data) { onData([]); return; }
    const list = Object.entries(data).map(([key, val]: [string, any]) => ({
      username: key,
      name: val.name,
      status: val.status
    }));
    onData(list as User[]);
  });
};

export const updateUserStatus = (username: string, status: string) => {
  return update(ref(db, `users/${username.toLowerCase()}`), { status });
};

export const updateUserPassword = (username: string, password: string) => {
  return update(ref(db, `users/${username.toLowerCase()}`), { password });
};

export const deleteUser = (username: string) => {
  return remove(ref(db, `users/${username.toLowerCase()}`));
};

export const subscribeToNotepad = (onData: (content: string) => void) => {
  return onValue(ref(db, 'notepad/draft'), (s) => onData(s.val() || ''));
};

export const saveNotepad = (content: string) => set(ref(db, 'notepad/draft'), content);

export const archiveNote = async (content: string, author: string) => {
  const newRef = push(ref(db, 'notepad/archive'));
  await set(newRef, {
    content,
    author,
    timestamp: new Date().toISOString()
  });
  await set(ref(db, 'notepad/draft'), '');
};

export const subscribeToUserSecurity = (username: string, onStatusChange: (s: any) => void) => {
  return onValue(ref(db, `users/${username.toLowerCase()}`), (s) => onStatusChange(s.exists() ? s.val().status : null));
};

export const setSimulationInterval = (s: number) => set(ref(db, 'simulation/interval'), s);
export const subscribeToSimulationInterval = (onData: (s: number) => void) => onValue(ref(db, 'simulation/interval'), (s) => onData(s.val() || 10));

// --- AI REPORTS SERVICES ---

export const saveAiReport = (content: string, tankId: string) => {
  const newRef = push(ref(db, 'ai_reports'));
  return set(newRef, {
    timestamp: new Date().toISOString(),
    content,
    tankId
  });
};

export const subscribeToAiReports = (tankId: string, onData: (reports: AiReport[]) => void) => {
  // Queries last 20 reports for the system (simplified as usually one tank)
  const q = query(ref(db, 'ai_reports'), limitToLast(20));
  return onValue(q, (snapshot) => {
    const data = snapshot.val();
    if (!data) { onData([]); return; }
    
    const reports: AiReport[] = Object.entries(data).map(([key, val]: [string, any]) => ({
      id: key,
      ...val
    }));
    
    // Filter locally by tankId if needed (future proofing) and sort desc
    const sorted = reports
      .filter(r => !tankId || r.tankId === tankId) 
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
    onData(sorted);
  });
};
