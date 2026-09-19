"use client";

import React, { useState } from "react";
import { Cpu, Eye, EyeOff, Loader2, Lock, RefreshCw } from "lucide-react";

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  showDemoAccounts?: boolean;
}

const DEMO_ACCOUNTS = [
  {
    label: "Super Admin",
    email: "admin@agenthub.local",
    password: "admin123",
  },
  {
    label: "Espace Client (Boulangerie)",
    email: "contact@boulangerie.com",
    password: "client123",
  },
];

export default function LoginScreen({ onLogin, loading, error, showDemoAccounts = true }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || loading) return;
    onLogin(email.trim(), password);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo & Titre */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-bold text-2xl tracking-tight text-white">
              SynergyAI
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Connectez-vous à votre espace multi-agents
            </p>
          </div>

          {/* Carte de connexion */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email professionnel
                </label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.fr"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    title={showPassword ? "Masquer" : "Afficher"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Se connecter</span>
                  </>
                )}
              </button>
            </form>

            {/* Comptes de démonstration */}
            {showDemoAccounts && (
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    Comptes de démonstration
                  </span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword(acc.password);
                      }}
                      className="w-full text-left text-xs bg-slate-950/80 hover:bg-indigo-950/40 p-2.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition disabled:opacity-50"
                    >
                      <span className="font-semibold text-indigo-300">{acc.label}</span>
                      <span className="block text-slate-500 mt-0.5 truncate">
                        {acc.email} / {acc.password}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-600 mt-6 flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3 h-3" />
            Backend requis sur http://127.0.0.1:8000
          </p>
        </div>
      </div>
    </div>
  );
}