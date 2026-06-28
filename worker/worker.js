/**
 * Sentinel Risk Intelligence - Production Cloudflare Worker
 * Kimi 2.6 LLM + KimiVision OCR Backend
 */

async function kimiChat(messages, model, jsonMode, maxTokens) {
  if (typeof KIMI_API_KEY === "undefined" || !KIMI_API_KEY) throw new Error("Kimi API key not configured.");
  var baseUrl = (typeof KIMI_BASE_URL !== "undefined" && KIMI_BASE_URL) ? KIMI_BASE_URL : "https://api.moonshot.ai/v1";
  var chatModel = model || ((typeof KIMI_CHAT_MODEL !== "undefined" && KIMI_CHAT_MODEL) ? KIMI_CHAT_MODEL : "kimi-k2.6");
  var temperature = chatModel.indexOf("kimi-k2") >= 0 ? 1 : 0.6;
  var body = { model: chatModel, messages: messages, temperature: temperature, max_tokens: maxTokens || 4000 };
  if (jsonMode) body.response_format = { type: "json_object" };
  var resp = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + KIMI_API_KEY },
    body: JSON.stringify(body),
  });
  if (!resp.ok) { var detail = await resp.text(); throw new Error("Kimi API error (" + resp.status + "): " + detail.slice(0,300)); }
  var data = await resp.json();
  var msg = data.choices && data.choices[0] ? data.choices[0].message : {};
  var content = (msg.content || "").trim();
  var reasoning = (msg.reasoning_content || "").trim();
  return { content: content || reasoning || "", provider: "kimi", model: chatModel, usage: data.usage ? { promptTokens: data.usage.prompt_tokens || 0, completionTokens: data.usage.completion_tokens || 0, totalTokens: data.usage.total_tokens || 0 } : undefined };
}

async function kimiVision(systemPrompt, userPrompt, imageBase64, imageMimeType, jsonMode, maxTokens) {
  if (typeof KIMI_API_KEY === "undefined" || !KIMI_API_KEY) throw new Error("Kimi API key not configured.");
  var baseUrl = (typeof KIMI_BASE_URL !== "undefined" && KIMI_BASE_URL) ? KIMI_BASE_URL : "https://api.moonshot.ai/v1";
  var visionModel = (typeof KIMI_VISION_MODEL !== "undefined" && KIMI_VISION_MODEL) ? KIMI_VISION_MODEL : "kimi-k2.6";
  var dataUri = "data:" + imageMimeType + ";base64," + imageBase64;
  var body = { model: visionModel, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: [{ type: "image_url", image_url: { url: dataUri } }, { type: "text", text: userPrompt }] }], temperature: 0.1, max_tokens: maxTokens || 4096 };
  if (jsonMode) body.response_format = { type: "json_object" };
  var resp = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + KIMI_API_KEY },
    body: JSON.stringify(body),
  });
  if (!resp.ok) { var detail = await resp.text(); throw new Error("Kimi Vision error (" + resp.status + "): " + detail.slice(0,300)); }
  var data = await resp.json();
  var msg = data.choices && data.choices[0] ? data.choices[0].message : {};
  var content = (msg.content || "").trim();
  var reasoning = (msg.reasoning_content || "").trim();
  return { content: content || reasoning || "", provider: "kimi-vision", model: visionModel };
}

function safeParseJson(raw) {
  var trimmed = raw.trim();
  // Remove markdown code fences (using char code 96 for backtick)
  var bt = String.fromCharCode(96);
  var fence3 = bt + bt + bt;
  if (trimmed.indexOf(fence3) === 0) {
    // Strip opening fence
    var afterOpen = trimmed.indexOf("\n");
    if (afterOpen === -1) afterOpen = 3;
    else afterOpen += 1;
    trimmed = trimmed.slice(afterOpen);
    // Strip closing fence
    var closeIdx = trimmed.lastIndexOf(fence3);
    if (closeIdx > 0) trimmed = trimmed.slice(0, closeIdx);
    trimmed = trimmed.trim();
  }
  try { return JSON.parse(trimmed); } catch(e) {
    var start = trimmed.indexOf("{"); var end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch(e2) { return null; }
  }
}

function normalizeDocType(raw) {
  if (!raw) return "unknown";
  var known = ["drivers_license","passport","state_id","articles_of_organization","operating_agreement","ein_letter","bank_statement","paystub","tax_return","credit_report","lease","title_commitment","appraisal","purchase_agreement","loan_application"];
  if (raw === "passport" || raw === "state_id") return "drivers_license";
  return known.indexOf(raw) >= 0 ? raw : "unknown";
}

async function extractDocument(imageBase64, imageMimeType) {
  var OCR_SYSTEM_PROMPT = "You are a precision OCR extraction engine for mortgage document processing. Read the attached document image and return STRICT JSON. Fields: documentType, rawText, driversLicense{firstName,lastName,fullName,dob,address,licenseNumber,issueDate,expirationDate,issuingState}. Return ONLY valid JSON.";
  var response = await kimiVision(OCR_SYSTEM_PROMPT, "Extract this mortgage document. Return ONLY valid JSON.", imageBase64, imageMimeType, true, 4096);
  var parsed = safeParseJson(response.content);
  if (parsed && parsed.documentType) {
    return { success: true, documentType: normalizeDocType(String(parsed.documentType)), confidence: 0.88, rawText: String(parsed.rawText || ""), ocrEngine: "kimi-vision", ocrConfidence: 0.88, pageCount: 1, driversLicense: parsed.driversLicense || null, forensics: { redFlags: [] } };
  }
  return { success: true, documentType: "unknown", confidence: 0.85, rawText: response.content || "", ocrEngine: "kimi-vision", ocrConfidence: 0.85, pageCount: 1, driversLicense: null, forensics: { redFlags: ["Structured extraction unavailable"] } };
}

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" };
}

function buildHtml() {
  return '<!DOCTYPE html><html><head><title>SRI - Kimi 2.6</title><style>' +
    'body{font-family:system-ui,sans-serif;max-width:800px;margin:60px auto;padding:20px;color:#0f1d2d}' +
    'h1{font-family:Georgia,serif;font-size:2em}p{color:#6b7280}' +
    '.ep{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px}' +
    '.st{display:flex;align-items:center;gap:8px;margin:16px 0;padding:12px 16px;background:#f8f9fa;border-radius:8px;border:1px solid #e5e7eb}' +
    '.dot{width:8px;height:8px;border-radius:50%;background:#10b981}' +
    '.bg{display:inline-block;padding:2px 8px;border-radius:4px;background:#ecfdf5;color:#059669;font-size:11px;font-weight:500;margin-left:8px}' +
    '</style></head><body>' +
    '<div class="st"><div class="dot"></div><div><span style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;font-family:monospace">Kimi 2.6</span><strong style="margin-left:8px">Backend Active</strong><span class="bg">v2.6.0-cf</span></div></div>' +
    '<h1>Sentinel Risk Intelligence</h1><p>Kimi 2.6 + KimiVision OCR on Cloudflare Workers.</p>' +
    '<h3 style="margin-top:24px;font-size:14px;color:#0f1d2d">API Endpoints</h3>' +
    '<div class="ep"><span><code>GET /api/status</code></span><span>Health check</span></div>' +
    '<div class="ep"><span><code>POST /api/chat</code></span><span>Kimi 2.6 chat (Tyler AI)</span></div>' +
    '<div class="ep"><span><code>POST /api/ocr</code></span><span>KimiVision document OCR</span></div>' +
    '<div class="ep"><span><code>POST /api/vision</code></span><span>Multimodal vision analysis</span></div>' +
    '<p style="margin-top:24px;font-size:11px;color:#9ca3af;font-family:monospace">Sentinel Intelligence 2026 - Powered by Moonshot AI Kimi 2.6</p>' +
    '</body></html>';
}

async function handleRequest(request) {
  var url = new URL(request.url);
  var path = url.pathname;
  var method = request.method;
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

  if (path === "/api/status" && method === "GET") {
    var configured = (typeof KIMI_API_KEY !== "undefined" && !!KIMI_API_KEY);
    return new Response(JSON.stringify({ configured: configured, provider: "kimi", chatModel: (typeof KIMI_CHAT_MODEL !== "undefined" && KIMI_CHAT_MODEL) ? KIMI_CHAT_MODEL : "kimi-k2.6", visionModel: (typeof KIMI_VISION_MODEL !== "undefined" && KIMI_VISION_MODEL) ? KIMI_VISION_MODEL : "kimi-k2.6", baseUrl: (typeof KIMI_BASE_URL !== "undefined" && KIMI_BASE_URL) ? KIMI_BASE_URL : "https://api.moonshot.ai/v1", timestamp: new Date().toISOString(), version: "2.6.0-cf" }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
  }

  if (path === "/api/chat" && method === "POST") {
    try {
      var body = await request.json();
      var message = body.message;
      var history = body.history || [];
      if (!message || typeof message !== "string") return new Response(JSON.stringify({ error: "Message is required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } });
      var messages = [{ role: "system", content: "You are Tyler, the AI assistant for Sentinel Risk Intelligence, a mortgage underwriting and commercial lending due diligence platform. Powered by Kimi 2.6 with 1M context window. Be precise, professional. Current date: " + new Date().toISOString().split("T")[0] + "." }];
      for (var i = 0; i < history.length; i++) messages.push({ role: history[i].role, content: history[i].content });
      messages.push({ role: "user", content: message });
      var response = await kimiChat(messages, body.model, body.jsonMode, 4000);
      return new Response(JSON.stringify({ content: response.content, provider: response.provider, model: response.model, usage: response.usage }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
    } catch (err) { return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } }); }
  }

  if (path === "/api/ocr" && method === "POST") {
    try {
      var formData = await request.formData();
      var file = formData.get("file");
      if (!file) return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } });
      var bytes = new Uint8Array(await file.arrayBuffer());
      var mimeType = file.type;
      var validTypes = ["image/png", "image/jpeg", "image/webp"];
      if (validTypes.indexOf(mimeType) === -1) return new Response(JSON.stringify({ error: "Unsupported type: " + mimeType }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } });
      var chars = "";
      for (var i = 0; i < bytes.length; i++) chars += String.fromCharCode(bytes[i]);
      var base64 = btoa(chars);
      var result = await extractDocument(base64, mimeType);
      return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
    } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } }); }
  }

  if (path === "/api/vision" && method === "POST") {
    try {
      var body = await request.json();
      var response = await kimiVision(body.systemPrompt || "You are a document analysis AI.", body.prompt || "Analyze this document.", body.imageBase64, body.imageMimeType || "image/png", body.jsonMode, 4096);
      return new Response(JSON.stringify({ content: response.content, provider: response.provider, model: response.model }), { headers: { "Content-Type": "application/json", ...corsHeaders() } });
    } catch (err) { return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } }); }
  }

  return new Response(buildHtml(), { headers: { "Content-Type": "text/html", ...corsHeaders() } });
}

addEventListener("fetch", function(event) {
  event.respondWith(handleRequest(event.request));
});
