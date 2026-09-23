"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import LoginScreen, { type Mode } from "@/components/LoginScreen";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialMode, setInitialMode] = useState<Mode>("login");
  const [resetToken, setResetToken] = useState<string | undefined>();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("reset_token");
    if (token) {
      setResetToken(token);
      setInitialMode("reset");
    }
  }, []);

  const clearFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const handleModeChange = (mode: Mode) => {
    clearFeedback();
    if (mode === "forgot") setSuccess(null);
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    clearFeedback();
    try {
      const res = await api.login(email, password);
      setToken(res.access_token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: {
    company_name: string;
    full_name: string;
    email: string;
    password: string;
  }) => {
    setLoading(true);
    clearFeedback();
    try {
      const res = await api.register(data);
      setToken(res.access_token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setLoading(true);
    clearFeedback();
    try {
      const res = await api.forgotPassword(email);
      if (res.reset_url) {
        setSuccess(`Lien de réinitialisation : ${res.reset_url}`);
      } else {
        setSuccess(res.message || "Un e-mail de réinitialisation a été envoyé.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demande impossible.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    clearFeedback();
    try {
      await api.resetPassword(token, newPassword);
      setSuccess("Mot de passe réinitialisé. Vous pouvez vous connecter.");
      setInitialMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réinitialisation impossible.");
    } finally {
      setLoading(false);
    }
  };

  const showDemoAccounts = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false";

  return (
    <LoginScreen
      onLogin={handleLogin}
      onRegister={handleRegister}
      onForgotPassword={handleForgotPassword}
      onResetPassword={handleResetPassword}
      onModeChange={handleModeChange}
      initialMode={initialMode}
      resetToken={resetToken}
      loading={loading}
      error={error}
      success={success}
      showDemoAccounts={showDemoAccounts}
    />
  );
}