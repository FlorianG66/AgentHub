"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import LoginScreen from "@/components/LoginScreen";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
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

  const showDemoAccounts = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false";

  return (
    <LoginScreen
      onLogin={handleLogin}
      loading={loading}
      error={error}
      showDemoAccounts={showDemoAccounts}
    />
  );
}