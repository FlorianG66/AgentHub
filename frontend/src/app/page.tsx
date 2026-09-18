"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  Bot,
  UserCheck,
  Building2,
  RefreshCw,
  Cpu,
  Layers,
  Share2,
  Sliders,
  Key,
  Check,
  Zap,
  MessageSquare,
} from "lucide-react";
import {
  api,
  Tenant,
  Agent,
  Task,
  ApprovalRequest,
  KnowledgeDoc,
} from "@/lib/api";

interface ChatMessage {
  id: string;
  type: "user" | "agent" | "system";
  agentId?: string;
  agentName?: string;
  avatar?: string;
  role?: string;
  content: string;
  timestamp: string;
}

export default function Home() {
  // Navigation
  const [activeTab, setActiveTab] = useState<
    "office" | "collaboration" | "approvals" | "knowledge" | "settings" | "architecture"
  >("office");

  // State multi-tenant
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string>("tenant-boulangerie");
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(true);

  // Données courantes
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);

  // Paramètres IA (LLM)
  const [llmSettings, setLlmSettings] = useState({
    provider: "free",
    apiKey: "",
    baseUrl: "",
    model: "openai (gratuit)",
    hasCustomKey: false,
    maskedKey: "",
  });
  const [testingLLM, setTestingLLM] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // États de chargement et erreurs
  const [loading, setLoading] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Formulaire de mission
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [missionPrompt, setMissionPrompt] = useState<string>("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Modale nouveau recrutement d'agent
  const [showRecruitModal, setShowRecruitModal] = useState<boolean>(false);
  const [newAgent, setNewAgent] = useState({
    name: "",
    role: "",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    bio: "",
    system_prompt: "",
    capabilities: "social_media, copywriting",
  });

  // Modale nouveau document RAG
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [newDoc, setNewDoc] = useState({
    title: "",
    category: "general",
    content: "",
  });

  // Chat de groupe (Bureau Virtuel)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatStatus, setChatStatus] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [chatDraft, setChatDraft] = useState<boolean>(true);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading, chatStatus]);

  // Chargement initial des données
  const loadData = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
      // Vérification santé
      try {
        await api.checkHealth();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }

      // Chargement des tenants
      const fetchedTenants = await api.getTenants();
      setTenants(fetchedTenants);

      // Chargement pour le tenant actif
      const [fetchedAgents, fetchedTasks, fetchedApprovals, fetchedDocs, fetchedSettings] =
        await Promise.all([
          api.getAgents(tenantId),
          api.getTasks(tenantId),
          api.getApprovals(tenantId),
          api.getKnowledge(tenantId),
          api.getSettings(tenantId).catch(() => null),
        ]);

      setAgents(fetchedAgents);
      setTasks(fetchedTasks);
      setApprovals(fetchedApprovals);
      setKnowledgeDocs(fetchedDocs);

      if (fetchedSettings?.llm) {
        setLlmSettings((prev) => ({
          ...prev,
          provider: fetchedSettings.llm.provider || "free",
          baseUrl: fetchedSettings.llm.base_url || "",
          model: fetchedSettings.llm.model || "openai (gratuit)",
          hasCustomKey: fetchedSettings.llm.has_custom_key,
          maskedKey: fetchedSettings.llm.api_key_masked || "",
        }));
      }

      if (fetchedAgents.length > 0) {
        setSelectedAgentId((prev) => prev || fetchedAgents[0].id);
      }

      if (fetchedTasks.length > 0) {
        setActiveTask((prev) => prev || fetchedTasks[0]);
      }
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tester la connexion IA
  const handleTestLLM = async () => {
    try {
      setTestingLLM(true);
      setTestResult(null);
      const res = await api.testLLM({
        provider: llmSettings.provider,
        api_key: llmSettings.apiKey,
        base_url: llmSettings.baseUrl,
        model: llmSettings.model,
      });
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setTestingLLM(false);
    }
  };

  // Enregistrer les paramètres IA
  const handleSaveLLMSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateSettings(activeTenantId, {
        provider: llmSettings.provider,
        api_key: llmSettings.apiKey,
        base_url: llmSettings.baseUrl,
        model: llmSettings.model,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      await loadData(activeTenantId);
    } catch (err) {
      console.error("Erreur d'enregistrement:", err);
      alert("Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTenantId);
  }, [activeTenantId, loadData]);

  // Déclencher une mission collaborative
  const handleLaunchMission = async (customPrompt?: string, agentId?: string) => {
    const promptToSend = customPrompt || missionPrompt;
    const targetAgentId = agentId || selectedAgentId;

    if (!promptToSend || !targetAgentId) return;

    try {
      setLoading(true);
      setActiveTab("collaboration");
      const executedTask = await api.runTask(
        activeTenantId,
        targetAgentId,
        promptToSend
      );
      setActiveTask(executedTask);
      // Rafraîchir les approbations et les tâches
      const [updatedApprovals, updatedTasks] = await Promise.all([
        api.getApprovals(activeTenantId),
        api.getTasks(activeTenantId),
      ]);
      setApprovals(updatedApprovals);
      setTasks(updatedTasks);
    } catch (err) {
      console.error("Erreur lors de l'exécution de la mission:", err);
      alert("Erreur lors de l'exécution de la mission.");
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un message dans le chat de groupe (routage automatique vers le meilleur agent)
  const handleSendChat = async (customPrompt?: string) => {
    const text = (customPrompt || chatInput).trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      type: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatDraft(false);
    setChatLoading(true);
    setChatStatus("L'équipe analyse votre demande et sélectionne l'agent le plus compétent...");

    try {
      const res = await api.routeTask(activeTenantId, text);
      const agent = res.agent;
      const task = res.task;

      setChatMessages((prev) => [
        ...prev,
        {
          id: `route_${Date.now()}`,
          type: "system",
          content: `🎯 ${agent.name} (${agent.role}) a été désigné pour cette mission.`,
          timestamp: new Date().toISOString(),
        },
      ]);

      setChatMessages((prev) => [
        ...prev,
        {
          id: `agent_${task.id}`,
          type: "agent",
          agentId: agent.id,
          agentName: agent.name,
          avatar: agent.avatar,
          role: agent.role,
          content: task.result || "…",
          timestamp: new Date().toISOString(),
        },
      ]);

      if (task.status === "awaiting_approval") {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `approval_${task.id}`,
            type: "system",
            content: "⚠️ Une action externe requiert votre validation. Rendez-vous dans la File de Validation (Human-in-the-Loop).",
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      const [updatedApprovals, updatedTasks] = await Promise.all([
        api.getApprovals(activeTenantId),
        api.getTasks(activeTenantId),
      ]);
      setApprovals(updatedApprovals);
      setTasks(updatedTasks);
      setActiveTask(task);

      // Marque l'agent comme "actif" via le badge dans la grille (data auto-raffraîchie)
      setSelectedAgentId(agent.id);
    } catch (err) {
      console.error("Erreur au chat:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          type: "system",
          content: "❌ Une erreur est survenue : la mission n'a pas pu être exécutée. Veuillez réessayer.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setChatLoading(false);
      setChatStatus("");
    }
  };

  // Traitement d'approbation (Human-in-the-loop)
  const handleDecision = async (
    approvalId: string,
    action: "approve" | "reject"
  ) => {
    try {
      await api.decideApproval(approvalId, action);
      const updatedApprovals = await api.getApprovals(activeTenantId);
      setApprovals(updatedApprovals);
    } catch (err) {
      console.error("Erreur de décision:", err);
    }
  };

  // Recrutement d'un nouvel agent
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name || !newAgent.role) return;

    try {
      await api.createAgent({
        tenant_id: activeTenantId,
        name: newAgent.name,
        role: newAgent.role,
        avatar: newAgent.avatar,
        bio: newAgent.bio,
        system_prompt:
          newAgent.system_prompt ||
          `Tu es ${newAgent.name}, ${newAgent.role}. Sois professionnel, concis et efficace.`,
        capabilities: newAgent.capabilities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      });
      setShowRecruitModal(false);
      setNewAgent({
        name: "",
        role: "",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        bio: "",
        system_prompt: "",
        capabilities: "social_media, copywriting",
      });
      const updatedAgents = await api.getAgents(activeTenantId);
      setAgents(updatedAgents);
    } catch (err) {
      console.error("Erreur lors de la création de l'agent:", err);
    }
  };

  // Ajout de document RAG
  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.content) return;

    try {
      await api.createKnowledge({
        tenant_id: activeTenantId,
        title: newDoc.title,
        category: newDoc.category,
        content: newDoc.content,
      });
      setShowDocModal(false);
      setNewDoc({ title: "", category: "general", content: "" });
      const updatedDocs = await api.getKnowledge(activeTenantId);
      setKnowledgeDocs(updatedDocs);
    } catch (err) {
      console.error("Erreur lors de l'ajout du document:", err);
    }
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === "pending").length;
  const currentTenant = tenants.find((t) => t.id === activeTenantId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                SynergyAI
              </span>
              <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                SaaS Multi-Agents
              </span>
            </div>
            <p className="text-xs text-slate-400">
              L&apos;équipe virtuelle autonome au service des TPE & PME
            </p>
          </div>
        </div>

        {/* Super-Admin Tenant Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs shadow-inner">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Espace Client :</span>
            <select
              value={activeTenantId}
              onChange={(e) => {
                setActiveTenantId(e.target.value);
                setActiveTask(null);
              }}
              className="bg-transparent font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.name} ({t.plan.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">
              {backendOnline ? "Backend API Connecté" : "Backend Hors Ligne"}
            </span>
          </div>

          <button
            onClick={() => setIsSuperAdmin(!isSuperAdmin)}
            title="Cliquer pour activer/désactiver le mode Super-Admin"
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition ${
              isSuperAdmin
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isSuperAdmin ? "Mode Super Admin Actif" : "Mode Client"}</span>
          </button>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <div className="bg-slate-900/40 border-b border-slate-800/80 px-6">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2.5">
          <button
            onClick={() => setActiveTab("office")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "office"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Bureau Virtuel ({agents.length} Agents)</span>
          </button>

          <button
            onClick={() => setActiveTab("collaboration")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "collaboration"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Hub de Collaboration Inter-Agents</span>
          </button>

          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "approvals"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>File de Validation (Human-in-the-Loop)</span>
            {pendingApprovalsCount > 0 && (
              <span className="bg-emerald-500 text-slate-950 font-bold text-xs px-2 py-0.2 rounded-full ml-1 animate-bounce">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("knowledge")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "knowledge"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Base de Connaissances ({knowledgeDocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "settings"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sliders className="w-4 h-4 text-violet-400" />
            <span>Paramètres IA & Modèles</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
              {llmSettings.provider === "free" ? "IA Gratuite" : llmSettings.provider.toUpperCase()}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "architecture"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Architecture & Code Expliqué</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* BANNER INFORMATIONS ENTREPRISE */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {currentTenant?.name || "Entreprise"}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Plan {currentTenant?.plan.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Votre équipe virtuelle autonome collabore en direct et soumet ses livrables à validation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRecruitModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Recruter un nouvel agent</span>
            </button>
            <button
              onClick={() => loadData(activeTenantId)}
              title="Rafraîchir les données"
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* TAB 1 : BUREAU VIRTUEL (AGENTS) */}
        {activeTab === "office" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Votre Équipe d&apos;Employés Virtuels</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Des agents humanisés dotés de personnalités, de rôles et de compétences complémentaires.
                </p>
              </div>
            </div>

            {/* CHAT DE GROUPE INTER-AGENTS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {/* Header du chat */}
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-2.5 shrink-0">
                    {agents.slice(0, 4).map((a) => (
                      <div key={a.id} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.avatar}
                          alt={a.name}
                          title={a.name}
                          className="w-9 h-9 rounded-full object-cover border-2 border-slate-900"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span>Chat d&apos;Équipe — Bureau Virtuel</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      Déposez votre mission : l&apos;agent le plus compétent la réalisera automatiquement.
                    </p>
                  </div>
                </div>
                {chatMessages.length > 0 && (
                  <button
                    onClick={() => setChatMessages([])}
                    title="Vider la conversation"
                    className="text-[11px] text-slate-500 hover:text-rose-400 font-medium shrink-0 transition"
                  >
                    Vider
                  </button>
                )}
              </div>

              {/* Zone des messages */}
              <div className="h-[430px] overflow-y-auto p-5 space-y-4 bg-slate-950/50">
                {chatMessages.length === 0 && chatDraft && !chatLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
                    <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                      <MessageSquare className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Confiez une mission à votre équipe virtuelle
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-md">
                        Écrivez votre besoin ci-dessous. L&apos;IA sélectionne automatiquement l&apos;agent
                        le plus compétent (Community Manager, Analyste, Rédactrice, RH...).
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                      {[
                        "Prépare un post LinkedIn pour promouvoir la nouvelle tartelette poire-chocolat",
                        "Analyse les performances de nos dernières publications sur les réseaux",
                        "Rédige une fiche de poste pour recruter un apprenti au fournil",
                        "Rédige un texte de présentation pour notre dégustation artisanale",
                      ].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSendChat(s)}
                          disabled={chatLoading}
                          className="text-[11px] bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full transition"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((m) => {
                  if (m.type === "system") {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <span className="text-[11px] text-slate-400 bg-slate-800/70 border border-slate-700 px-3 py-1 rounded-full text-center">
                          {m.content}
                        </span>
                      </div>
                    );
                  }
                  if (m.type === "user") {
                    return (
                      <div key={m.id} className="flex justify-end">
                        <div className="max-w-[80%] bg-indigo-600/90 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed shadow-md">
                          <div className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wider mb-0.5 text-right">
                            Vous
                          </div>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </div>
                    );
                  }
                  // Message d'un agent
                  return (
                    <div key={m.id} className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.avatar}
                          alt={m.agentName}
                          className="w-9 h-9 rounded-full object-cover border-2 border-slate-700"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                      </div>
                      <div className="max-w-[80%] bg-slate-800/90 border border-slate-700/70 rounded-2xl rounded-tl-md px-4 py-2.5 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-indigo-300">{m.agentName}</span>
                          <span className="text-[10px] text-slate-500">{m.role}</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {chatLoading && (
                  <div className="flex items-start gap-3">
                    <div className="flex -space-x-1.5 shrink-0">
                      {agents.slice(0, 3).map((a) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={a.id}
                          src={a.avatar}
                          alt={a.name}
                          className="w-7 h-7 rounded-full object-cover border-2 border-slate-900"
                        />
                      ))}
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl rounded-tl-md px-4 py-3 max-w-[70%]">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" style={{ animationDelay: "300ms" }} />
                      </div>
                      <p className="text-[11px] text-slate-400">{chatStatus}</p>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Barre de saisie */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="border-t border-slate-800 p-4 bg-slate-900/90 flex items-center gap-3"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ex: Prépare un post LinkedIn pour la nouvelle tartelette poire-chocolat..."
                  disabled={chatLoading}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 transition"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col justify-between transition group shadow-sm hover:shadow-indigo-500/10 hover:shadow-lg"
                >
                  <div>
                    {/* Header card avec Avatar humanisé */}
                    <div className="flex items-start gap-3.5 mb-3.5">
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/40 group-hover:border-indigo-400 transition"
                        />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition">
                          {agent.name}
                        </h3>
                        <p className="text-xs font-medium text-indigo-400">
                          {agent.role}
                        </p>
                        <span className="inline-block mt-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Prêt à collaborer
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                      {agent.bio || "Agent virtuel spécialisé pour assister votre entreprise au quotidien."}
                    </p>

                    {/* Tags de compétences */}
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Compétences clés
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.capabilities.map((cap, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action directe */}
                  <button
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setActiveTab("collaboration");
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold py-2.5 rounded-lg border border-slate-700/80 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Solliciter {agent.name}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Guide d'intégration dynamique */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                <Bot className="w-6 h-6" />
              </div>
              <div className="text-sm">
                <h4 className="font-semibold text-white">Collaboration dynamique sans binôme fixe</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Lorsque vous confiez une mission à un agent (par exemple Léa, Community Manager), celle-ci
                  analyse les compétences requises. Si des chiffres ou des données sont nécessaires, elle interroge
                  dynamiquement Marc (Analyste) via notre bus inter-agents. Si vous recrutez un nouvel agent
                  (ex: Juriste ou Comptable), les autres agents apprendront automatiquement à le solliciter !
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 : HUB DE COLLABORATION & MISSIONS EN DIRECT */}
        {activeTab === "collaboration" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Colonne de gauche : Lancement de la mission */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-base text-white mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-400" />
                  <span>Lancer une Mission d&apos;Équipe</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Agent Référent (Chef de projet)
                    </label>
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} — {a.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Consignes de la mission
                    </label>
                    <textarea
                      rows={4}
                      value={missionPrompt}
                      onChange={(e) => setMissionPrompt(e.target.value)}
                      placeholder="Ex: Prépare les prochains posts en analysant les performances..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>

                  {/* Suggestions de missions rapides */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Exemples de collaboration
                    </label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const p = "Prépare notre prochaine publication LinkedIn pour mardi. Analyse les statistiques du dernier post avec Marc et adapte le ton.";
                          setMissionPrompt(p);
                          const lea = agents.find((a) => a.name === "Léa");
                          if (lea) setSelectedAgentId(lea.id);
                        }}
                        className="w-full text-left text-xs bg-slate-950/80 hover:bg-indigo-950/40 p-2.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition"
                      >
                        ⚡ <strong>Léa & Marc :</strong> Publication LinkedIn basée sur l&apos;audit des métriques
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const p = "Rédige une fiche de mission pour recruter un(e) apprenti(e) en tenant compte de nos valeurs de tradition artisanale.";
                          setMissionPrompt(p);
                          const thomas = agents.find((a) => a.name === "Thomas");
                          if (thomas) setSelectedAgentId(thomas.id);
                        }}
                        className="w-full text-left text-xs bg-slate-950/80 hover:bg-indigo-950/40 p-2.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition"
                      >
                        📑 <strong>Thomas (RH) :</strong> Fiche de poste apprenti & intégration
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunchMission()}
                    disabled={loading || !selectedAgentId || !missionPrompt}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Les agents collaborent...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Déclencher la mission</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Historique des missions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2.5">
                  Missions Récentes ({tasks.length})
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTask(t)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs border transition ${
                        activeTask?.id === t.id
                          ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                          : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-medium truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                        <span>{new Date(t.created_at).toLocaleTimeString()}</span>
                        <span className="capitalize text-indigo-400">{t.status.replace("_", " ")}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Colonne de droite : Flux en direct des échanges inter-agents */}
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm min-h-[520px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-emerald-400" />
                        <span>Journal d&apos;Exécution & Échanges Inter-Agents</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Transparence totale : visualisez comment vos agents réfléchissent et s&apos;entraident.
                      </p>
                    </div>

                    {activeTask && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {activeTask.status === "awaiting_approval"
                          ? "⏳ En attente de validation"
                          : activeTask.status}
                      </span>
                    )}
                  </div>

                  {/* Liste des logs d'échanges */}
                  {activeTask?.logs && activeTask.logs.length > 0 ? (
                    <div className="space-y-4">
                      {activeTask.logs.map((log) => {
                        // Style selon l'événement
                        let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
                        let badgeLabel = "Action";
                        if (log.event_type === "start") {
                          badgeColor = "bg-blue-500/20 text-blue-300 border-blue-500/30";
                          badgeLabel = "Départ Mission";
                        } else if (log.event_type === "tool_call") {
                          badgeColor = "bg-purple-500/20 text-purple-300 border-purple-500/30";
                          badgeLabel = "Appel Outil / RAG";
                        } else if (log.event_type === "peer_consultation") {
                          badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                          badgeLabel = "Consultation Collègue";
                        } else if (log.event_type === "peer_reply") {
                          badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                          badgeLabel = "Analyse Collègue";
                        } else if (log.event_type === "approval_created") {
                          badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                          badgeLabel = "Soumission Validation";
                        }

                        return (
                          <div
                            key={log.id}
                            className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={log.avatar}
                                  alt={log.agent_name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-700"
                                />
                                <span className="font-semibold text-xs text-slate-200">
                                  {log.agent_name}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  ({log.role})
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}
                              >
                                {badgeLabel}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {log.message}
                            </p>

                            {/* Affichage des données d'outils si présentes */}
                            {Boolean(log.data) && (
                              <div className="mt-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto">
                                <span className="text-indigo-400 font-semibold block mb-1">
                                  Payload Outil / Données extraites :
                                </span>
                                {JSON.stringify(log.data, null, 2)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <Bot className="w-12 h-12 mb-3 text-slate-600 stroke-[1.5]" />
                      <p className="text-sm font-medium">Aucune mission en cours d&apos;affichage.</p>
                      <p className="text-xs mt-1">
                        Sélectionnez un agent à gauche et cliquez sur &quot;Déclencher la mission&quot; pour voir la collaboration en direct.
                      </p>
                    </div>
                  )}
                </div>

                  {/* Résultat final de la tâche */}
                  {activeTask?.result && (
                  <div className="mt-6 border-t border-slate-800 pt-4 bg-indigo-950/20 -mx-5 -mb-5 p-5 rounded-b-xl border-indigo-500/20">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-indigo-400" />
                      <span>Livrable Final Préparé par l&apos;Équipe</span>
                    </h4>
                    <div className="bg-slate-950/90 border border-indigo-500/30 rounded-lg p-4 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                      {activeTask.result}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 : FILE DE VALIDATION (HUMAN-IN-THE-LOOP) */}
        {activeTab === "approvals" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>File d&apos;Approbation & Contrôle Humain</span>
              </h2>
              <p className="text-xs text-slate-400">
                Vous gardez le contrôle total : aucune action externe (publication, e-mail, contrat) n&apos;est exécutée sans votre accord explicite.
              </p>
            </div>

            {approvals.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500 stroke-[1.5]" />
                <h3 className="text-white font-semibold text-base">File d&apos;attente vide</h3>
                <p className="text-xs mt-1">
                  Toutes les actions proposées par vos agents ont été traitées ou aucune action n&apos;est en attente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.map((req) => {
                  const agent = agents.find((a) => a.id === req.agent_id);
                  const isPending = req.status === "pending";

                  return (
                    <div
                      key={req.id}
                      className={`bg-slate-900 border rounded-xl p-5 shadow-sm transition ${
                        isPending
                          ? "border-amber-500/40 shadow-amber-500/5 shadow-md"
                          : "border-slate-800 opacity-80"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                isPending
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : req.status === "approved"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {req.status === "pending"
                                ? "En attente de validation"
                                : req.status === "approved"
                                ? "Approuvé & Exécuté"
                                : "Refusé"}
                            </span>
                            <span className="text-xs text-slate-400">
                              Action : <strong className="text-slate-200">{req.action_type}</strong>
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-white">{req.title}</h3>
                          <p className="text-xs text-slate-400">{req.description}</p>

                          {/* Rationale de l'agent */}
                          {req.agent_rationale && (
                            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300">
                              <span className="text-indigo-400 font-semibold block mb-0.5">
                                💡 Justification de {agent?.name || "l'agent"} :
                              </span>
                              {req.agent_rationale}
                            </div>
                          )}

                          {/* Aperçu du payload selon le type d'action */}
                          {Boolean(req.payload) && (
                            <div className="mt-3 p-4 bg-slate-950 rounded-lg border border-slate-800">
                              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span>
                                  {req.action_type === "publish_job_offer"
                                    ? "Aperçu de l'offre de recrutement"
                                    : req.action_type === "publish_linkedin_post"
                                    ? "Aperçu de la publication (LinkedIn)"
                                    : `Aperçu de l'action (${req.action_type})`}
                                </span>
                                <span className="text-slate-500">
                                  {req.action_type === "publish_job_offer"
                                    ? "Canaux : CFA, France Travail, Vitrine"
                                    : req.payload.scheduled_time
                                    ? `Programmé pour : ${String(req.payload.scheduled_time)}`
                                    : "Immédiat"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-200 whitespace-pre-wrap">
                                {String(req.payload.content || req.payload.text || JSON.stringify(req.payload, null, 2))}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Boutons de décision */}
                        {isPending ? (
                          <div className="flex md:flex-col gap-2 min-w-[150px]">
                            <button
                              onClick={() => handleDecision(req.id, "approve")}
                              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                {req.action_type === "publish_job_offer"
                                  ? "Valider & Diffuser"
                                  : "Valider & Exécuter"}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDecision(req.id, "reject")}
                              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-700 hover:border-rose-600 transition"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Refuser</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            Traité le {req.resolved_at ? new Date(req.resolved_at).toLocaleString() : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4 : BASE DE CONNAISSANCES (RAG) */}
        {activeTab === "knowledge" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-400" />
                  <span>Base de Connaissances d&apos;Entreprise (RAG)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Ajoutez ici vos chartes, tarifs et règles métier. Tous les agents interrogent ce contexte avant d&apos;agir.
                </p>
              </div>

              <button
                onClick={() => setShowDocModal(true)}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs px-4 py-2 rounded-lg shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un document</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {knowledgeDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20 uppercase tracking-wider">
                        {doc.category}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white mb-2">{doc.title}</h3>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {doc.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={async () => {
                        await api.deleteKnowledge(doc.id);
                        const updated = await api.getKnowledge(activeTenantId);
                        setKnowledgeDocs(updated);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5 : PARAMÈTRES IA & CLÉS API */}
        {activeTab === "settings" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold text-white">
                  Configuration du Moteur d&apos;IA & Clés API
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Choisissez le cerveau de vos agents. Par défaut, une IA gratuite et intelligente est active
                sans aucune clé nécessaire. Vous pouvez brancher votre propre clé à tout moment.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Paramètres enregistrés avec succès ! Vos agents utilisent désormais cette configuration.</span>
              </div>
            )}

            {/* Moteur Actif Badge */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  Moteur actuellement actif pour {currentTenant?.name}
                </div>
                <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {llmSettings.provider === "free"
                      ? "🌟 IA Gratuite Réelle (Sans clé API requise)"
                      : llmSettings.provider === "openai"
                      ? `🔑 OpenAI (${llmSettings.model || "gpt-4o-mini"})`
                      : llmSettings.provider === "groq"
                      ? `⚡ Groq (${llmSettings.model || "llama-3.3-70b-versatile"})`
                      : llmSettings.provider === "ollama"
                      ? "🖥️ Ollama Local"
                      : "🛠️ Fournisseur Personnalisé"}
                  </span>
                </div>
              </div>

              {llmSettings.hasCustomKey && (
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  Clé configurée : {llmSettings.maskedKey}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveLLMSettings} className="space-y-6">
              {/* Choix du fournisseur */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Sélectionnez le fournisseur d&apos;IA
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Option 1 : IA Gratuite */}
                  <button
                    type="button"
                    onClick={() =>
                      setLlmSettings({
                        ...llmSettings,
                        provider: "free",
                        model: "openai (gratuit)",
                      })
                    }
                    className={`text-left p-3.5 rounded-xl border transition ${
                      llmSettings.provider === "free"
                        ? "bg-violet-600/20 border-violet-500/60 shadow-md shadow-violet-500/10"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      <span>🌟</span>
                      <span>IA Gratuite (Par défaut)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      100% gratuit et sans clé requise. Répond en français avec précision.
                    </p>
                  </button>

                  {/* Option 2 : OpenAI */}
                  <button
                    type="button"
                    onClick={() =>
                      setLlmSettings({
                        ...llmSettings,
                        provider: "openai",
                        model: llmSettings.model === "openai (gratuit)" ? "gpt-4o-mini" : llmSettings.model,
                      })
                    }
                    className={`text-left p-3.5 rounded-xl border transition ${
                      llmSettings.provider === "openai"
                        ? "bg-violet-600/20 border-violet-500/60 shadow-md shadow-violet-500/10"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      <Key className="w-4 h-4 text-emerald-400" />
                      <span>OpenAI</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Utilisez vos propres clés OpenAI pour GPT-4o-mini ou GPT-4o.
                    </p>
                  </button>

                  {/* Option 3 : Groq */}
                  <button
                    type="button"
                    onClick={() =>
                      setLlmSettings({
                        ...llmSettings,
                        provider: "groq",
                        model: "llama-3.3-70b-versatile",
                      })
                    }
                    className={`text-left p-3.5 rounded-xl border transition ${
                      llmSettings.provider === "groq"
                        ? "bg-violet-600/20 border-violet-500/60 shadow-md shadow-violet-500/10"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Groq Cloud (Ultra Rapide)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Offre gratuite sur console.groq.com (Llama 3.3 70B, vitesse fulgurante).
                    </p>
                  </button>

                  {/* Option 4 : Ollama */}
                  <button
                    type="button"
                    onClick={() =>
                      setLlmSettings({
                        ...llmSettings,
                        provider: "ollama",
                        baseUrl: "http://localhost:11434/v1",
                        model: "llama3",
                      })
                    }
                    className={`text-left p-3.5 rounded-xl border transition ${
                      llmSettings.provider === "ollama"
                        ? "bg-violet-600/20 border-violet-500/60 shadow-md shadow-violet-500/10"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      <Cpu className="w-4 h-4 text-sky-400" />
                      <span>Ollama (Local)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Modèle exécuté sur votre machine, 100% privé et hors-ligne.
                    </p>
                  </button>

                  {/* Option 5 : Personnalisé */}
                  <button
                    type="button"
                    onClick={() =>
                      setLlmSettings({
                        ...llmSettings,
                        provider: "custom",
                      })
                    }
                    className={`text-left p-3.5 rounded-xl border transition ${
                      llmSettings.provider === "custom"
                        ? "bg-violet-600/20 border-violet-500/60 shadow-md shadow-violet-500/10"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <span>API Personnalisée</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Mistral AI, OpenRouter, ou tout serveur compatible OpenAI.
                    </p>
                  </button>
                </div>
              </div>

              {/* Champs de saisie selon le fournisseur */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
                {llmSettings.provider !== "free" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Clé API {llmSettings.provider === "openai" ? "(sk-...)" : llmSettings.provider === "groq" ? "(gsk_...)" : ""}
                    </label>
                    <input
                      type="password"
                      placeholder={
                        llmSettings.hasCustomKey
                          ? "Clé déjà enregistrée (laisser vide pour conserver)"
                          : "Collez votre clé API ici..."
                      }
                      value={llmSettings.apiKey}
                      onChange={(e) => setLlmSettings({ ...llmSettings, apiKey: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                )}

                {(llmSettings.provider === "ollama" || llmSettings.provider === "custom") && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      URL de base (Base URL)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: http://localhost:11434/v1 ou https://api.mistral.ai/v1"
                      value={llmSettings.baseUrl}
                      onChange={(e) => setLlmSettings({ ...llmSettings, baseUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Modèle sélectionné
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: gpt-4o-mini, llama-3.3-70b-versatile, mistral-large-latest..."
                    value={llmSettings.model}
                    onChange={(e) => setLlmSettings({ ...llmSettings, model: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                  />
                  <div className="flex gap-2 mt-2">
                    <span className="text-[11px] text-slate-500">Suggestions :</span>
                    {llmSettings.provider === "openai" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setLlmSettings({ ...llmSettings, model: "gpt-4o-mini" })}
                          className="text-[11px] text-violet-400 hover:underline"
                        >
                          gpt-4o-mini (Économique & Rapide)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLlmSettings({ ...llmSettings, model: "gpt-4o" })}
                          className="text-[11px] text-violet-400 hover:underline"
                        >
                          gpt-4o (Puissance maximale)
                        </button>
                      </>
                    )}
                    {llmSettings.provider === "groq" && (
                      <button
                        type="button"
                        onClick={() => setLlmSettings({ ...llmSettings, model: "llama-3.3-70b-versatile" })}
                        className="text-[11px] text-violet-400 hover:underline"
                      >
                        llama-3.3-70b-versatile
                      </button>
                    )}
                    {llmSettings.provider === "free" && (
                      <span className="text-[11px] text-emerald-400">
                        Modèle gratuit optimisé actif
                      </span>
                    )}
                  </div>
                </div>

                {/* Résultat du test */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs ${
                      testResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5">
                      {testResult.success ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{testResult.message}</span>
                    </div>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleTestLLM}
                    disabled={testingLLM}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-3 rounded-lg border border-slate-700 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingLLM ? "animate-spin" : ""}`} />
                    <span>{testingLLM ? "Test en cours..." : "Tester la connexion"}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-3 rounded-lg shadow-md transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Enregistrer la configuration</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6 : ARCHITECTURE & CODE EXPLIQUÉ (PÉDAGOGIE) */}
        {activeTab === "architecture" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <span>Guide Pédagogique : Comment fonctionne cette plateforme ?</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Conçu pas à pas pour que vous puissiez comprendre, répliquer et maintenir vous-même chaque brique.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-indigo-400 font-bold uppercase tracking-wider">
                  1. Multi-Tenant & Super-Admin
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Chaque entreprise cliente a un identifiant unique (<code>tenant_id</code>). 
                  Toutes les tables SQLite/PostgreSQL (<code>agents</code>, <code>tasks</code>, <code>knowledge_docs</code>)
                  sont cloisonnées par ce <code>tenant_id</code>.
                </p>
                <p className="text-slate-400">
                  En tant que Super-Admin, vous pouvez inspecter et intervenir sur n&apos;importe quelle entreprise depuis le sélecteur du haut.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold uppercase tracking-wider">
                  2. Collaboration Dynamique
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Pas de binôme figé dans le code. Chaque agent déclare ses <code>capabilities</code> (ex: <code>[&apos;data_analysis&apos;, &apos;reporting&apos;]</code>).
                </p>
                <p className="text-slate-400">
                  L&apos;orchestrateur (<code>AgentOrchestrator</code>) analyse la mission, détecte les compétences requises et sollicite l&apos;agent correspondant via un bus d&apos;échanges.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold uppercase tracking-wider">
                  3. Human-in-the-Loop & Outils
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Les agents préparent le travail mais ne publient jamais en direct sur vos comptes réels sans autorisation.
                </p>
                <p className="text-slate-400">
                  Ils créent une <code>ApprovalRequest</code>. C&apos;est vous (ou le client PME) qui validez en un clic.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Arborescence simplifiée du code</h4>
              <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/90 p-4 rounded-lg overflow-x-auto leading-loose">
{`backend/
├── app/
│   ├── core/           # Configuration (.env) & Connexion SQLite/PostgreSQL
│   ├── models/         # Tables de la base (Tenant, Agent, Task, Approval, Knowledge)
│   ├── schemas/        # Schémas Pydantic (validation des requêtes HTTP)
│   ├── services/
│   │   ├── agent_orchestrator.py # Le chef d'orchestre multi-agents
│   │   ├── llm_service.py        # Appel OpenAI ou Moteur de simulation
│   │   └── tools/                # Connecteurs LinkedIn & Statistiques
│   └── api/endpoints/  # Routes FastAPI (/agents, /tasks, /approvals, /knowledge)
frontend/
├── src/lib/api.ts      # Client TypeScript pour interroger le backend
└── src/app/page.tsx    # Dashboard complet avec Tailwind & Lucide`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* MODALE RECRUTEMENT D'AGENT */}
      {showRecruitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span>Recruter un Nouvel Agent Virtuel</span>
              </h3>
              <button
                onClick={() => setShowRecruitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Prénom de l&apos;agent</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clara, Maxime..."
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Rôle / Métier</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Juriste & Contrats, Responsable Compta..."
                  value={newAgent.role}
                  onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Photo / Avatar URL</label>
                <input
                  type="text"
                  value={newAgent.avatar}
                  onChange={(e) => setNewAgent({ ...newAgent, avatar: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Compétences clés (séparées par des virgules)
                </label>
                <input
                  type="text"
                  placeholder="legal, contracts, compliance"
                  value={newAgent.capabilities}
                  onChange={(e) => setNewAgent({ ...newAgent, capabilities: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bio / Présentation</label>
                <textarea
                  rows={2}
                  value={newAgent.bio}
                  onChange={(e) => setNewAgent({ ...newAgent, bio: e.target.value })}
                  placeholder="Présentation courte de son expérience..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecruitModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-semibold shadow"
                >
                  Recruter l&apos;agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE NOUVEAU DOCUMENT RAG */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <span>Ajouter à la Base de Connaissances</span>
              </h3>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Titre du document</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Grille tarifaire 2026, Process de livraison..."
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Catégorie</label>
                <select
                  value={newDoc.category}
                  onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="charte_editoriale">Charte Éditoriale</option>
                  <option value="produits">Produits & Tarifs</option>
                  <option value="faq">FAQ & Support</option>
                  <option value="rh">Règles RH & Recrutement</option>
                  <option value="general">Général</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contenu texte</label>
                <textarea
                  rows={5}
                  required
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                  placeholder="Collez ici les règles, tarifs ou directives de l'entreprise..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2 rounded-lg font-semibold shadow"
                >
                  Enregistrer le document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
