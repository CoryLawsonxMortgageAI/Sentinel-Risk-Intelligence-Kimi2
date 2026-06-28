import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Eye, Upload, FileText, CheckCircle, AlertTriangle, Copy, Loader } from 'lucide-react';
import { api, type OCRResult } from '../api/client';

export const OCR: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  function handleFile(f: File) {
    setError(null);
    setResult(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(f.type)) {
      setError('Please upload a PNG, JPEG, or WEBP image.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function extractDocument() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const ocrResult = await api.extractDocument(file);
      setResult(ocrResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR extraction failed');
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const docTypeLabels: Record<string, string> = {
    drivers_license: "Driver's License",
    passport: 'Passport',
    state_id: 'State ID',
    articles_of_organization: 'Articles of Organization',
    operating_agreement: 'Operating Agreement',
    ein_letter: 'EIN Letter',
    bank_statement: 'Bank Statement',
    paystub: 'Paystub',
    tax_return: 'Tax Return',
    credit_report: 'Credit Report',
    lease: 'Lease Agreement',
    title_commitment: 'Title Commitment',
    appraisal: 'Appraisal',
    purchase_agreement: 'Purchase Agreement',
    loan_application: 'Loan Application',
    unknown: 'Unknown Document',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0f1d2d', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="#/" style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} />
        </a>
        <Eye size={18} color="#3b82f6" />
        <div>
          <h1 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#ffffff' }}>KimiVision OCR</h1>
          <p style={{ margin: 0, fontSize: 9, color: '#6b7280', fontFamily: "'Courier New', monospace" }}>MULTIMODAL DOCUMENT EXTRACTION</p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px' }}>
        {/* Upload Zone */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            backgroundColor: dragOver ? '#eff6ff' : '#ffffff',
            border: `2px dashed ${dragOver ? '#3b82f6' : '#e5e7eb'}`,
            borderRadius: 8,
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: 20,
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <Upload size={28} color={dragOver ? '#3b82f6' : '#d1d5db'} style={{ marginBottom: 10 }} />
          <p style={{ margin: '0 0 4px 0', fontSize: 13, color: '#374151', fontWeight: 500 }}>
            {file ? file.name : 'Drag & drop a document image, or click to browse'}
          </p>
          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', fontFamily: "'Courier New', monospace" }}>
            PNG, JPEG, WEBP &middot; Max 10MB
          </p>
        </div>

        {/* Preview + Extract */}
        {preview && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', padding: '20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 280px' }}>
                <img
                  src={preview}
                  alt="Document preview"
                  style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 4, border: '1px solid #e5e7eb' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 12, fontWeight: 600, color: '#0f1d2d', fontFamily: "'Courier New', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Document Preview
                </h3>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 16 }}>
                  <div>File: {file?.name}</div>
                  <div>Size: {file ? (file.size / 1024).toFixed(1) : 0} KB</div>
                  <div>Type: {file?.type}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); extractDocument(); }}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    backgroundColor: loading ? '#e5e7eb' : '#0f1d2d',
                    color: loading ? '#9ca3af' : '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Courier New', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {loading ? <Loader size={14} className="animate-spin" /> : <Eye size={14} />}
                  {loading ? 'Extracting...' : 'Extract with KimiVision'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', fontSize: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f1d2d', fontFamily: 'Georgia, serif' }}>
                Extraction Results
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="#10b981" />
                <span style={{ fontSize: 10, color: '#10b981', fontWeight: 500, fontFamily: "'Courier New', monospace" }}>
                  {result.ocrEngine} &middot; {(result.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>

            {/* Document Type */}
            <ResultSection title="Document Type">
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1d2d' }}>
                {docTypeLabels[result.documentType] || result.documentType}
              </div>
            </ResultSection>

            {/* Drivers License Fields */}
            {result.driversLicense && result.documentType === 'drivers_license' && (
              <ResultSection title="Extracted Fields">
                {Object.entries(result.driversLicense).map(([key, value]) => (
                  value ? (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: 10, color: '#6b7280', fontFamily: "'Courier New', monospace", textTransform: 'uppercase' }}>{key}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: '#0f1d2d', fontWeight: 500 }}>{value}</span>
                        <button onClick={() => copyText(value, key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                          {copiedField === key ? <CheckCircle size={10} color="#10b981" /> : <Copy size={10} color="#9ca3af" />}
                        </button>
                      </div>
                    </div>
                  ) : null
                ))}
              </ResultSection>
            )}

            {/* Raw Text */}
            <ResultSection title="Raw Text Extraction">
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => copyText(result.rawText, 'raw')}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  {copiedField === 'raw' ? <CheckCircle size={12} color="#10b981" /> : <Copy size={12} color="#9ca3af" />}
                </button>
                <pre style={{ margin: 0, padding: '12px', backgroundColor: '#f8f9fa', borderRadius: 4, fontSize: 11, color: '#374151', lineHeight: 1.5, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {result.rawText}
                </pre>
              </div>
            </ResultSection>

            {/* Forensics */}
            {result.forensics.redFlags.length > 0 && (
              <ResultSection title="Forensic Flags">
                {result.forensics.redFlags.map((flag, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: '#f59e0b', fontSize: 11 }}>
                    <AlertTriangle size={12} />
                    {flag}
                  </div>
                ))}
              </ResultSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ResultSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}>
    <h4 style={{ margin: '0 0 8px 0', fontSize: 9, color: '#9ca3af', fontFamily: "'Courier New', monospace", textTransform: 'uppercase', letterSpacing: '0.15em' }}>
      {title}
    </h4>
    {children}
  </div>
);
