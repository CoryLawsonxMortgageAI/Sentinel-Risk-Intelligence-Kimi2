// API client for Sentinel Risk Intelligence Cloudflare Worker backend
const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://sentinel-risk-intelligence-kimi.clawson444.workers.dev';

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OCRResult {
  success: boolean;
  documentType: string;
  confidence: number;
  rawText: string;
  ocrEngine: string;
  ocrConfidence: number;
  pageCount: number;
  driversLicense: Record<string, string> | null;
  forensics: { redFlags: string[] };
  error?: string;
}

export interface StatusResponse {
  configured: boolean;
  provider: string;
  chatModel: string;
  visionModel: string;
  baseUrl: string;
  timestamp: string;
  version: string;
}

export const api = {
  async getStatus(): Promise<StatusResponse> {
    const resp = await fetch(`${API_BASE}/api/status`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  },

  async sendChat(
    message: string,
    history: ChatMessage[] = [],
    model?: string,
  ): Promise<ChatResponse> {
    const resp = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, model }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }
    return resp.json();
  },

  async extractDocument(file: File): Promise<OCRResult> {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch(`${API_BASE}/api/ocr`, {
      method: 'POST',
      body: formData,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }
    return resp.json();
  },
};
