
import React, { useState, useEffect } from 'react';
import { User, Tank } from '../types';
import { loginUser, registerUser, subscribeToUsers, updateUserStatus, updateUserPassword, deleteUser } from '../services/firebaseService';
import { 
  Lock, LogIn, LogOut, User as UserIcon, Users, UserPlus, 
  Search, ShieldAlert, ShieldCheck, CheckCircle, Ban, 
  Trash2, Key, X, Save, AlertTriangle, Loader2, Info, Eye
} from 'lucide-react';
import { SimulationBot } from './SimulationBot';

interface AdminLoginProps {
  onLoginSuccess: (user: User) => void;
  currentUser: User | null;
  onLogout: () => void;
  tank?: Tank;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, currentUser, onLogout, tank }) => {
  const [loginUserMsg, setLoginUserMsg] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);
  
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserLogin, setNewUserLogin] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const isAdmin = currentUser?.status === '03';

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToUsers((data) => setUsers(data));
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUserMsg || !loginPass) {
      setAuthError('Preencha todos os campos.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    const res = await loginUser(loginUserMsg, loginPass);
    setAuthLoading(false);
    if (res.success && res.user) onLoginSuccess(res.user);
    else setAuthError(res.message);
  };

  const handleCreateUser = async () => {
    if (!isAdmin || !newUserFullName || !newUserLogin || !newUserPass) return;
    setActionLoading(true);
    const res = await registerUser(newUserLogin, newUserPass, newUserFullName);
    setActionLoading(false);
    if (res.success) {
      setActionFeedback({ type: 'success', msg: 'Usuário criado!' });
      setShowCreateModal(false);
      setNewUserFullName(''); setNewUserLogin(''); setNewUserPass('');
    } else {
      setActionFeedback({ type: 'error', msg: res.message });
    }
  };

  const toggleBlockUser = async (user: User) => {
    if (!isAdmin || user.username === currentUser?.username) return;
    const newStatus = user.status === '02' ? '01' : '02';
    await updateUserStatus(user.username, newStatus);
    setActionFeedback({ type: 'success', msg: 'Status atualizado.' });
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-4">
        <div className="mb-6 relative">
           <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-10 rounded-full"></div>
           <div className="relative bg-slate-900 border border-slate-700 p-4 rounded-2xl">
              <Lock size={32} className="text-blue-400" />
           </div>
        </div>
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Diretório Restrito</h2>
            <p className="text-slate-400 text-sm mt-1">Gerencie operadores e administradores</p>
        </div>
        <div className="w-full max-w-sm">
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="glass-panel p-1 rounded-xl border border-slate-700/50 bg-slate-900/40">
                    <input type="text" value={loginUserMsg} onChange={e => setLoginUserMsg(e.target.value)} placeholder="Usuário" className="w-full bg-transparent border-none text-white px-4 py-3 placeholder-slate-500 focus:ring-0 outline-none text-base" />
                    <div className="h-px bg-slate-700/50 mx-2"></div>
                    <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Senha" className="w-full bg-transparent border-none text-white px-4 py-3 placeholder-slate-500 focus:ring-0 outline-none text-base" />
                </div>
                {authError && <div className="text-rose-400 text-xs bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{authError}</div>}
                <button type="submit" disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2">
                    {authLoading ? <Loader2 className="animate-spin" /> : 'Entrar'}
                </button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
            <div className="w-full">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users size={20} className="text-blue-500" /> Usuários</h2>
                <p className="text-slate-400 text-xs mt-1">{isAdmin ? 'Controle total de acessos.' : 'Visualização de equipe.'}</p>
            </div>
            {isAdmin && (
                <button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg text-sm transition-all active:scale-95">
                    <UserPlus size={18} /> Novo Usuário
                </button>
            )}
        </div>

        {actionFeedback && (
            <div className="fixed top-20 right-4 z-[80] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 bg-emerald-600 text-white animate-fade-in">
                <CheckCircle size={16} /> <span className="text-sm font-bold">{actionFeedback.msg}</span>
            </div>
        )}

        {isAdmin && tank && <SimulationBot tank={tank} />}

        <div className="relative w-full mb-4">
            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
            <input type="text" placeholder="Filtrar por nome ou login..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 focus:ring-blue-500 text-sm outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => {
                const isBlocked = user.status === '02';
                const isMaster = user.status === '03';
                const isSelf = user.username === currentUser.username;

                return (
                    <div key={user.username} className={`glass-panel rounded-2xl p-4 border transition-all ${isBlocked ? 'border-rose-900/40 opacity-70' : 'border-slate-700/50'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${isBlocked ? 'bg-slate-800' : isMaster ? 'bg-purple-600' : 'bg-slate-700'}`}>
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">{user.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-tighter">@{user.username}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${isBlocked ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : isMaster ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                {isBlocked ? 'BLOQ.' : isMaster ? 'MASTER' : 'OPER.'}
                            </span>
                        </div>
                        {isAdmin && !isSelf ? (
                            <div className="flex gap-2 pt-3 border-t border-slate-800">
                                <button onClick={() => toggleBlockUser(user)} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-[10px] font-bold border transition-all ${isBlocked ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                    {isBlocked ? <><CheckCircle size={14}/> Ativar</> : <><Ban size={14}/> Bloquear</>}
                                </button>
                                <button onClick={() => { if(confirm('Excluir usuário?')) deleteUser(user.username); }} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-[10px] font-bold border border-slate-700 hover:bg-rose-500/10 hover:text-rose-400 transition-all">
                                    <Trash2 size={14}/> Excluir
                                </button>
                            </div>
                        ) : (
                            <div className="pt-3 border-t border-slate-800 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2 uppercase font-bold tracking-widest">
                                {isSelf ? 'Sua Conta' : 'Leitura'}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-white font-bold">Novo Operador</h3>
                        <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="p-4 space-y-4">
                        <input type="text" placeholder="Nome Completo" value={newUserFullName} onChange={e => setNewUserFullName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                        <input type="text" placeholder="Login" value={newUserLogin} onChange={e => setNewUserLogin(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder="Senha Inicial" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                        <button onClick={handleCreateUser} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-sm transition-all active:scale-95">Criar Conta</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
