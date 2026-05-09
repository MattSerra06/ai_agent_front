export interface AgentConfig {
  name: string;
  modelName: string;
  temperature: number;
  systemPrompt: string;
}

export interface AgentConfigResponse {
  agentId: string;
  name: string;
}

export interface AgentSummary {
  agentId: string;
  name: string;
  modelName: string;
  temperature: number;
  systemPrompt: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export interface CreateConversationRequest {
  agentId?: string;
}

export interface ConversationSummary {
  sessionId: string;
  agentId: string;
  title: string | null;
  createdAt: string;
}

export interface ServerMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tokensGenerated?: number | null;
  timeToFirstTokenMs?: number | null;
  totalGenerationTimeMs?: number | null;
  costUsd?: number | string | null;
  createdAt?: string;
}

export interface ConversationDetail {
  sessionId: string;
  agentId: string;
  title: string | null;
  createdAt: string;
  messages: ServerMessage[];
}

export type Role = 'user' | 'assistant';

export interface MessageMetrics {
  tokensGenerated?: number | null;
  timeToFirstTokenMs?: number | null;
  totalGenerationTimeMs?: number | null;
  costUsd?: number | string | null;
}

export interface ChatMessage extends MessageMetrics {
  id: string;
  role: Role;
  content: string;
  streaming?: boolean;
  ts: number;
}

export interface Agent extends AgentConfig {
  agentId: string;
  isDefault?: boolean;
  createdAt: string;
}

// === Auth ===

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

// === Admin ===

export interface AdminUserSummary {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  isDefaultUser: boolean;
  createdAt: string;
  conversationCount: number;
  totalTokens: number;
  totalCostUsd: number | string;
}

export interface AdminConversationSummary {
  sessionId: string;
  title: string | null;
  agentId: string | null;
  agentName: string | null;
  createdAt: string;
  messageCount: number;
  totalTokens: number;
  totalCostUsd: number | string;
}

export interface AdminConversationDetail {
  sessionId: string;
  title: string | null;
  agentId: string | null;
  agentName: string | null;
  ownerUserId: number | null;
  ownerUsername: string | null;
  createdAt: string;
  messageCount: number;
  totalTokens: number;
  totalCostUsd: number | string;
  messages: ServerMessage[];
}
