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
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export interface ConversationDetail {
  sessionId: string;
  agentId: string;
  title: string | null;
  createdAt: string;
  messages: ServerMessage[];
}

export type Role = 'user' | 'assistant';

export interface ChatMessage {
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
