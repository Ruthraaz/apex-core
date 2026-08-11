import React, { useState } from 'react';
import { Shield, Key, User, Mail, AlertTriangle, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ isOpen, onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username || !password || (mode === 'register' && !email)) {
      setErrorMsg('Preencha todos os campos obrigatórios para prosseguir.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const data = await loginUser(username, password);
        localStorage.setItem('apex_access_token', data.access_token);
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.access_token);
        }
      } else {
        const newUser = await registerUser(username, email, password);
        setSuccessMsg(`Operador '${newUser.username}' cadastrado com sucesso! Autenticando...`);
        // Realiza o login automático após registro
        const data = await loginUser(username, password);
        localStorage.setItem('apex_access_token', data.access_token);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user, data.access_token);
          }
        }, 800);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro de comunicação com o servidor de segurança.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-[#070908] border border-[#18201a] px-4 py-3 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-[#2be29d] transition-all duration-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0e1210] border border-[#18201a] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative">
        
        {/* Top Header / Status Bar */}
        <div className="p-6 pb-4 border-b border-[#18201a] bg-[#090c0a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#070908] border border-[#18201a] flex items-center justify-center font-mono font-bold text-sm text-[#2be29d] shadow-inner">
              <Shield className="w-5 h-5 text-[#2be29d]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2 font-mono uppercase">
                APEX CORE <span className="text-[9px] text-[#2be29d] bg-[#070908] px-2 py-0.5 rounded border border-[#18201a]">SEC-GATEWAY</span>
              </h2>
              <p className="font-mono text-[10px] text-zinc-400">Autenticação Tática de Operador</p>
            </div>
          </div>
          <span className="font-mono text-[9px] text-[#2be29d] bg-[#25d08e]/10 border border-[#2be29d]/30 px-2.5 py-1 rounded font-bold flex items-center gap-1.5 uppercase">
            <Lock className="w-3 h-3 text-[#2be29d]" /> RESTREITO
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#18201a] bg-[#070908]">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 font-mono text-[11px] uppercase tracking-wider font-bold transition-all border-b-2 cursor-pointer ${
              mode === 'login'
                ? 'border-[#2be29d] text-[#2be29d] bg-[#0e1210]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            [ 🔑 AUTENTICAR ]
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 font-mono text-[11px] uppercase tracking-wider font-bold transition-all border-b-2 cursor-pointer ${
              mode === 'register'
                ? 'border-[#2be29d] text-[#2be29d] bg-[#0e1210]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            [ 📝 NOVO OPERADOR ]
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-[#e05252]/10 border border-[#e05252]/40 rounded-xl flex items-start gap-2.5 text-xs text-[#e05252] font-mono animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#e05252]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#25d08e]/10 border border-[#2be29d]/40 rounded-xl flex items-start gap-2.5 text-xs text-[#2be29d] font-mono animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2be29d]" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1.5 flex items-center gap-1.5">
                <User className="w-3 h-3 text-[#2be29d]" />
                {mode === 'login' ? 'IDENTIFICADOR / EMAIL' : 'IDENTIFICADOR DO OPERADOR'}
              </label>
              <input
                type="text"
                placeholder={mode === 'login' ? 'Ex: admin ou operador@apex.io' : 'Ex: commander_alex'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputCls}
                required
                autoFocus
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#2be29d]" />
                  E-MAIL CORPORATIVO / PESSOAL
                </label>
                <input
                  type="email"
                  placeholder="Ex: operador@apex.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1.5 flex items-center gap-1.5">
                <Key className="w-3 h-3 text-[#2be29d]" />
                CHAVE DE ACESSO / SENHA
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-[#25d08e] hover:bg-[#2be29d] disabled:bg-[#18201a] text-[#070908] font-mono text-xs font-bold rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#25d08e]/10"
          >
            {loading ? (
              <span className="flex items-center gap-2 text-zinc-400">
                <span className="w-3 h-3 rounded-full border-2 border-[#2be29d] border-t-transparent animate-spin" />
                PROCESSANDO CREDENCIAIS...
              </span>
            ) : (
              <>
                {mode === 'login' ? 'AUTENTICAR OPERADOR' : 'CADASTRAR E ENTRAR'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="p-4 border-t border-[#18201a] bg-[#070908] text-center font-mono text-[9px] text-zinc-500">
          PROTEGIDO POR JWT RS256 & BCRYPT HASHING • FORGE KINETIC v2.5
        </div>

      </div>
    </div>
  );
}
