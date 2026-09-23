"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  UserPlus,
  Building2,
  User,
} from "lucide-react";

interface RegisterData {
  company_name: string;
  full_name: string;
  email: string;
  password: string;
}

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void> | void;
  onRegister?: (data: RegisterData) => Promise<void> | void;
  onForgotPassword?: (email: string) => Promise<void> | void;
  onResetPassword?: (token: string, newPassword: string) => Promise<void> | void;
  onModeChange?: (mode: Mode) => void;
  initialMode?: "login" | "register" | "forgot" | "reset";
  resetToken?: string;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  showDemoAccounts?: boolean;
}

export type Mode = "login" | "register" | "forgot" | "reset";

const DEMO_ACCOUNTS = [
  {
    label: "Super Admin",
    hint: "Vue plateforme (tous les espaces)",
    email: "admin@agenthub.local",
    password: "admin123",
  },
  {
    label: "Espace Client",
    hint: "Démo Boulangerie Artisanale & Co",
    email: "contact@boulangerie.com",
    password: "client123",
  },
];

export default function LoginScreen({
  onLogin,
  onRegister,
  onForgotPassword,
  onResetPassword,
  onModeChange,
  initialMode = "login",
  resetToken,
  loading,
  error,
  success,
  showDemoAccounts = true,
}: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const switchMode = (next: Mode) => {
    setMode(next);
    onModeChange?.(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === "login") {
      if (email.trim() && password) onLogin(email.trim(), password);
    } else if (mode === "register") {
      if (onRegister && fullName.trim() && email.trim() && password.length >= 8 && companyName.trim()) {
        onRegister({ company_name: companyName.trim(), full_name: fullName.trim(), email: email.trim(), password });
      }
    } else if (mode === "forgot") {
      if (onForgotPassword && email.trim()) onForgotPassword(email.trim());
    } else if (mode === "reset") {
      if (onResetPassword && resetToken && password.length >= 8) onResetPassword(resetToken, password);
    }
  };

  const inputCls =
    "w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 transition";

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
              {mode === "login" && "Connectez-vous à votre espace multi-agents"}
              {mode === "register" && "Créez votre espace & recrutez votre équipe d'agents"}
              {mode === "forgot" && "Récupération de votre mot de passe"}
              {mode === "reset" && "Définissez un nouveau mot de passe"}
            </p>
          </div>

          {/* En-tête de mode */}
          {mode !== "login" && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour à la connexion
            </button>
          )}

          {/* Carte */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Entreprise
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex. Boulangerie Artisanale & Co"
                        className={inputCls + " pl-9"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Votre nom
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Votre nom complet"
                        className={inputCls + " pl-9"}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email professionnel
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@entreprise.fr"
                    className={inputCls + " pl-9"}
                  />
                </div>
              </div>

              {(mode === "login" || mode === "register" || mode === "reset") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "register" || mode === "reset" ? "8 caractères minimum" : "••••••••"}
                      className={inputCls + " pl-9 pr-10"}
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
              )}

              {mode === "forgot" && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Saisissez l&apos;e-mail de votre compte : le lien de réinitialisation vous sera
                  envoyé (ou affiché en mode démo).
                </p>
              )}

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-2 rounded-lg">
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  (mode === "login" && (!email.trim() || !password)) ||
                  (mode === "register" && (!email.trim() || !password || password.length < 8 || !fullName.trim() || !companyName.trim())) ||
                  (mode === "forgot" && !email.trim()) ||
                  (mode === "reset" && (!password || password.length < 8))
                }
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Traitement en cours...</span>
                  </>
                ) : (
                  <>
                    {mode === "login" && (<><Lock className="w-4 h-4" /><span>Se connecter</span></>)}
                    {mode === "register" && (<><UserPlus className="w-4 h-4" /><span>Créer mon espace</span></>)}
                    {mode === "forgot" && (<><Mail className="w-4 h-4" /><span>Envoyer le lien</span></>)}
                    {mode === "reset" && (<><KeyRound className="w-4 h-4" /><span>Réinitialiser</span></>)}
                  </>
                )}
              </button>
            </form>

            {/* Liens secondaires */}
            {mode === "login" && (
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-slate-400 hover:text-indigo-300 transition"
                >
                  Mot de passe oublié ?
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
                >
                  Créer un espace
                </button>
              </div>
            )}

            {/* Accès rapide de démonstration */}
            {mode === "login" && showDemoAccounts && (
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    Accès démo rapide
                  </span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword(acc.password);
                      }}
                      className="group text-left bg-slate-950/80 hover:bg-indigo-950/40 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/40 transition disabled:opacity-50"
                    >
                      <span className="block text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">
                        {acc.label}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">
                        {acc.hint}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600 mt-2 text-center">
                  Les identifiants sont pré-remplis, cliquez ensuite sur «&nbsp;Se connecter&nbsp;».
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-600 mt-6 flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3 h-3" />
            Backend requis sur {process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://127.0.0.1:8000"}
          </p>
        </div>
      </div>
    </div>
  );
}