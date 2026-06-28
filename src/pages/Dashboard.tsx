import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Eye, MessageSquare, FileText, Zap, Globe, Server } from 'lucide-react';
import { api, type StatusResponse } from '../api/client';

export const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    try {
      setLoading(true);
      const s = await api.getStatus();
      setStatus(s);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: '#0f1d2d', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Zap size={20} color="#10b981" />
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff', fontFamily: 'Georgia, serif' }}>Sentinel Risk Intelligence</h1>
            <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontFamily: "'Courier New', monospace", letterSpacing: '0.1em' }}>KIMI 2.6 INTEGRATION DASHBOARD</p>
          </div>
        </div>
        <StatusBadge status={status?.configured ? 'online' : 'offline'} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: '24px', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 600, color: '#0f1d2d', fontFamily: 'Georgia, serif' }}>Kimi 2.6 Backend Status</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>Real-time connection status for the Cloudflare Worker-hosted Kimi 2.6 LLM and KimiVision OCR services.</p>
          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', fontSize: 12 }}>{error}</div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatusCard icon={<Cpu size={18} color="#10b981" />} title="Kimi 2.6 LLM" subtitle={status?.chatModel || 'kimi-k2.6'} status={status?.configured ? 'Online' : 'Offline'} statusColor={status?.configured ? '#10b981' : '#ef4444'} loading={loading} />
          <StatusCard icon={<Eye size={18} color="#3b82f6" />} title="KimiVision OCR" subtitle={status?.visionModel || 'kimi-k2.6'} status={status?.configured ? 'Online' : 'Offline'} statusColor={status?.configured ? '#10b981' : '#ef4444'} loading={loading} />
          <StatusCard icon={<Globe size={18} color="#8b5cf6" />} title="Cloudflare Worker" subtitle="Edge Deployed" status={status ? 'Active' : 'Unknown'} statusColor={status ? '#10b981' : '#9ca3af'} loading={loading} />
          <StatusCard icon={<Server size={18} color="#f59e0b" />} title="API Version" subtitle={status?.version || '2.6.0-cf'} status="Deployed" statusColor="#10b981" loading={loading} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 24 }}>
          <FeatureCard icon={<MessageSquare size={20} color="#0f1d2d" />} title="Tyler AI Chat" description="Interact with Kimi 2.6 for mortgage underwriting analysis, fraud detection, and risk assessment." link="#/chat" linkText="Open Chat" />
          <FeatureCard icon={<FileText size={20} color="#0f1d2d" />} title="KimiVision OCR" description="Extract structured data from mortgage documents using Kimi 2.6 multimodal vision capabilities." link="#/ocr" linkText="Upload Document" />
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 13, fontWeight: 600, color: '#0f1d2d', fontFamily: "'Courier New', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Information</h3>
          <InfoRow label="Provider" value={status?.provider || 'kimi'} />
          <InfoRow label="Chat Model" value={status?.chatModel || 'kimi-k2.6'} />
          <InfoRow label="Vision Model" value={status?.visionModel || 'kimi-k2.6'} />
          <InfoRow label="Base URL" value={status?.baseUrl || 'https://api.moonshot.ai/v1'} />
          <InfoRow label="Last Check" value={status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'Never'} />
          <InfoRow label="Worker URL" value="sentinel-risk-intelligence-kimi.clawson444.workers.dev" />
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: 'online' | 'offline' }> = ({ status }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', backgroundColor: status === 'online' ? '#ecfdf5' : '#fef2f2', borderRadius: 12, border: `1px solid ${status === 'online' ? '#a7f3d0' : '#fecaca'}` }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: status === 'online' ? '#10b981' : '#ef4444' }} />
    <span style={{ fontSize: 11, fontWeight: 500, color: status === 'online' ? '#059669' : '#dc2626', textTransform: 'uppercase', fontFamily: "'Courier New', monospace", letterSpacing: '0.05em' }}>{status}</span>
  </div>
);

const StatusCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; status: string; statusColor: string; loading: boolean }> = ({ icon, title, subtitle, status, statusColor, loading }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#0f1d2d', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 10, color: '#6b7280', fontFamily: "'Courier New', monospace", marginBottom: 4 }}>{subtitle}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {loading ? <Activity size={12} color="#9ca3af" /> : <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusColor }} />}
        <span style={{ fontSize: 10, color: statusColor, fontWeight: 500 }}>{loading ? 'Checking...' : status}</span>
      </div>
    </div>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; link: string; linkText: string }> = ({ icon, title, description, link, linkText }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f1d2d' }}>{title}</h3>
    </div>
    <p style={{ margin: '0 0 14px 0', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{description}</p>
    <a href={link} style={{ display: 'inline-block', fontSize: 11, fontWeight: 500, color: '#fff', backgroundColor: '#0f1d2d', padding: '8px 16px', borderRadius: 4, textDecoration: 'none', fontFamily: "'Courier New', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{linkText}</a>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
    <span style={{ fontSize: 11, color: '#6b7280', fontFamily: "'Courier New', monospace" }}>{label}</span>
    <span style={{ fontSize: 11, color: '#0f1d2d', fontWeight: 500, fontFamily: "'Courier New', monospace" }}>{value}</span>
  </div>
);
