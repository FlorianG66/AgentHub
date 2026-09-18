const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings?: Record<string, unknown>;
  created_at: string;
}

export interface Agent {
  id: string;
  tenant_id: string;
  name: string;
  role: string;
  avatar: string;
  bio?: string;
  system_prompt: string;
  capabilities: string[];
  status: "available" | "busy" | "offline";
  created_at: string;
}

export interface TaskLog {
  id: string;
  timestamp: string;
  agent_name: string;
  avatar: string;
  role: string;
  event_type: "start" | "tool_call" | "peer_consultation" | "peer_reply" | "decision" | "approval_created";
  message: string;
  data?: unknown;
}

export interface Task {
  id: string;
  tenant_id: string;
  primary_agent_id: string;
  title: string;
  prompt: string;
  status: "pending" | "running" | "completed" | "failed" | "awaiting_approval";
  result?: string;
  logs: TaskLog[];
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  tenant_id: string;
  task_id?: string;
  agent_id: string;
  title: string;
  description: string;
  action_type: string;
  payload: Record<string, unknown>;
  agent_rationale?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  created_at: string;
  resolved_at?: string;
}

export interface KnowledgeDoc {
  id: string;
  tenant_id: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
}

// Client API
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText}`);
  }

  return res.json();
}

export const api = {
  // Santé du backend
  checkHealth: () => fetch("http://127.0.0.1:8000/health").then((r) => r.json()),

  // Tenants (Multi-tenant & Super-admin)
  getTenants: () => apiFetch<Tenant[]>("/tenants"),
  createTenant: (data: { name: string; slug: string; plan?: string }) =>
    apiFetch<Tenant>("/tenants", { method: "POST", body: JSON.stringify(data) }),

  // Agents
  getAgents: (tenantId: string) => apiFetch<Agent[]>(`/agents?tenant_id=${tenantId}`),
  createAgent: (data: {
    tenant_id: string;
    name: string;
    role: string;
    avatar: string;
    bio: string;
    system_prompt: string;
    capabilities: string[];
  }) => apiFetch<Agent>("/agents", { method: "POST", body: JSON.stringify(data) }),

  // Missions / Tâches
  getTasks: (tenantId: string) => apiFetch<Task[]>(`/tasks?tenant_id=${tenantId}`),
  runTask: (tenantId: string, primaryAgentId: string, prompt: string) =>
    apiFetch<Task>(`/tasks/run?tenant_id=${tenantId}`, {
      method: "POST",
      body: JSON.stringify({ primary_agent_id: primaryAgentId, prompt }),
    }),
  routeTask: (tenantId: string, prompt: string) =>
    apiFetch<{ task: Task; agent: Agent }>(`/tasks/chat?tenant_id=${tenantId}`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  // File de Validation (Human-in-the-Loop)
  getApprovals: (tenantId: string) => apiFetch<ApprovalRequest[]>(`/approvals?tenant_id=${tenantId}`),
  decideApproval: (approvalId: string, action: "approve" | "reject", reason?: string) =>
    apiFetch<ApprovalRequest>(`/approvals/${approvalId}/decision`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    }),

  // Base de connaissances
  getKnowledge: (tenantId: string) => apiFetch<KnowledgeDoc[]>(`/knowledge?tenant_id=${tenantId}`),
  createKnowledge: (data: { tenant_id: string; title: string; category: string; content: string }) =>
    apiFetch<KnowledgeDoc>("/knowledge", { method: "POST", body: JSON.stringify(data) }),
  deleteKnowledge: (docId: string) =>
    apiFetch<{ message: string }>(`/knowledge/${docId}`, { method: "DELETE" }),

  // Paramètres IA (LLM)
  getSettings: (tenantId: string) =>
    apiFetch<{
      tenant_id: string;
      tenant_name: string;
      llm: {
        provider: string;
        model: string;
        base_url: string;
        api_key_masked: string;
        has_custom_key: boolean;
      };
    }>(`/settings?tenant_id=${tenantId}`),
  updateSettings: (
    tenantId: string,
    data: { provider: string; api_key?: string; base_url?: string; model?: string }
  ) =>
    apiFetch<{ message: string; provider: string }>(`/settings?tenant_id=${tenantId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  testLLM: (data: { provider: string; api_key?: string; base_url?: string; model?: string }) =>
    apiFetch<{ success: boolean; message: string; sample_reply?: string }>("/settings/test-llm", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
