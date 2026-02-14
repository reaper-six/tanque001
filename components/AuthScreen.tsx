
import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/firebaseService';
import { User } from '../types';
import { Lock, User as UserIcon, LogIn, UserPlus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Only for registration

  // SAER Labs Logo Component
  const SaerLogo = () => (
    <div className="relative w-24 h-24 shrink-0 group mx-auto mb-4">
      {/* Tech Glow */}
      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover:bg-cyan-400/30 transition-all"></div>
      
      {/* SVG Logo */}
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full relative z-10 drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="saer-gradient-lg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        
        {/* Outer Tech Shape */}
        <path d="M20 20H80V80H20V20Z" stroke="url(#saer-gradient-lg)" strokeWidth="2" fill="#0f172a" rx="15" />
        <circle cx="20" cy="20" r="4" fill="#22d3ee" />
        <circle cx="80" cy="80" r="4" fill="#6366f1" />
        <path d="M20 20L30 30" stroke="#334155" strokeWidth="1"/>
        <path d="M80 80L70 70" stroke="#334155" strokeWidth="1"/>
        
        {/* Stylized 'S' for SAER */}
        <path d="M65 35H40C37.2386 35 35 37.2386 35 40V45C35 47.7614 37.2386 50 40 50H60C62.7614 50 65 52.2386 65 55V60C65 62.7614 62.7614 65 60 65H35" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
        <path d="M65 35H40C37.2386 35 35 37.2386 35 40V45C35 47.7614 37.2386 50 40 50H60C62.7614 50 65 52.2386 65 55V60C65 62.7614 62.7614 65 60 65H35" stroke="url(#saer-gradient-lg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username || !password) {
      setError('Preencha usuário e senha.');
      return;
    }

    if (isRegistering && !fullName) {
      setError('Preencha seu nome completo.');
      return;
    }

    setLoading(true);

    if (isRegistering) {
      // Register Logic
      const res = await registerUser(username, password, fullName);
      setLoading(false);
      
      if (res.success) {
        setSuccessMsg('Conta criada com sucesso! Faça login para continuar.');
        setIsRegistering(false);
        setPassword('');
      } else {
        setError(res.message);
      }

    } else {
      // Login Logic
      const res = await loginUser(username, password);
      setLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#0f172a]">
      <div className="min-h-full flex flex-col items-center justify-center p-4 relative">
      
        {/* Background Effects - Fixed so they don't scroll */}
        <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        <div className="relative z-10 w-full max-w-md my-6">
            
            {/* Brand Header */}
            <div className="text-center mb-8 animate-fade-in flex flex-col items-center">
            <SaerLogo />
            <h1 className="text-4xl font-bold text-white tracking-tight">SAER Labs</h1>
            <div className="flex items-center gap-2 mt-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Parceria Oficial</span>
                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">LK Metalúrgica</span>
            </div>
            </div>

            {/* Auth Card */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl animate-slide-up relative overflow-hidden">
            {/* Top colored line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
            
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">
                    {isRegistering ? 'Cadastro de Operador' : 'Acesso ao Sistema'}
                </h2>
                {isRegistering ? <UserPlus className="text-indigo-400" size={20} /> : <Lock className="text-cyan-400" size={20} />}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name (Register Only) */}
                {isRegistering && (
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                    <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 text-slate-500" size={18} />
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full bg-slate-950/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    </div>
                </div>
                )}

                {/* Username */}
                <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Usuário</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 text-slate-500" size={18} />
                    <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ID de acesso"
                    className="w-full bg-slate-950/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                </div>
                </div>

                {/* Feedback Messages */}
                {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm animate-fade-in">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
                )}

                {successMsg && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm animate-fade-in">
                    <CheckCircle size={16} />
                    <span>{successMsg}</span>
                </div>
                )}

                {/* Submit Button */}
                <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : isRegistering ? (
                    <>Criar Credencial <UserPlus size={20} /></>
                ) : (
                    <>Autenticar <LogIn size={20} /></>
                )}
                </button>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                <p className="text-slate-400 text-sm mb-3">
                {isRegistering ? 'Já possui acesso?' : 'Primeiro acesso?'}
                </p>
                <button
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                    setSuccessMsg(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-bold transition-colors hover:underline"
                >
                {isRegistering ? 'Retornar ao Login' : 'Registrar novo usuário'}
                </button>
            </div>

            </div>

            <div className="mt-8 text-center space-y-1">
            <p className="text-[10px] text-slate-500">
                Powered by <b>SAER Labs</b> &bull; v2.2 Build 405
            </p>
            <p className="text-[10px] text-slate-600">
                Monitoramento Inteligente & IoT Solutions
            </p>
            </div>

        </div>
      </div>
    </div>
  );
};
