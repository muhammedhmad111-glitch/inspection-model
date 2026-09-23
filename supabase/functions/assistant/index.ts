// CPIIS assistant: an LLM plus tools over the plant's own data and knowledge base.
// Read tools run with the caller's JWT so RLS applies. No writes happen here:
// the model can only propose a finding, which the UI asks the user to confirm.
//
// Two providers are supported. Anthropic wins when its key is present, so adding
// ANTHROPIC_API_KEY later switches the assistant over with no code change.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Read a value from an env secret first, else the access-controlled app_secrets table.
async function getSecret(name: string): Promise<string | null> {
  const env = Deno.env.get(name);
  if (env) return env;
  const url = Deno.env.get("SUPABASE_URL");
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !svc) return null;
  const admin = createClient(url, svc, { auth: { persistSession: false } });
  const { data } = await admin.from("app_secrets").select("value").eq("key", name).maybeSingle();
  return data?.value ?? null;
}

const SYSTEM = [
  "You are the CPIIS assistant for the Amreyah Cement plant inspection and maintenance system.",
  "You help inspection and maintenance engineers with their daily work.",
  "",
  "Rules:",
  "1. Always answer in Arabic. Keep technical terms and equipment names in English as they appear in the data.",
  "2. Search before answering. For a technical spec, limit, or maintenance procedure use search_manuals. For equipment condition, tasks, or findings use the system tools. Do not answer from general knowledge when the manuals or the system hold the answer.",
  "3. Cite the source. When answering from a manual, name the document and the page.",
  "4. If the information is not there, say so plainly and suggest what document should be uploaded. Never invent numbers or limits.",
  "5. Never write to the system directly. If the user wants to record a finding, use propose_finding and let them confirm it.",
  "6. Be brief and practical: engineer to engineer. Lead with the answer, then the detail.",
  "7. If there is a safety risk or a critical limit has been exceeded, say so first and clearly.",
].join("\n");

const TOOLS = [
  {
    name: "search_manuals",
    description:
      "Semantic search across the uploaded equipment manuals and reference documents. Use for any question about specifications, acceptable limits, maintenance steps, fault diagnosis, or procedures. Write the query in English when the manuals are in English.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look for, e.g. 'belt conveyor bearing temperature limit'" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_equipment",
    description: "Find plant equipment by name, code, or location. Returns the equipment with its area, status, and criticality.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Equipment name, partial name, or code" } },
      required: ["query"],
    },
  },
  {
    name: "get_equipment_overview",
    description:
      "Full status for one piece of equipment: overdue and upcoming tasks, open findings, maintenance actions, and the latest condition rating. Call search_equipment first to get the equipment_id.",
    input_schema: {
      type: "object",
      properties: { equipment_id: { type: "string", description: "Equipment UUID" } },
      required: ["equipment_id"],
    },
  },
  {
    name: "query_tasks",
    description: "Query inspection tasks by status: overdue, upcoming, scheduled, in progress, or completed.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["Overdue", "Upcoming", "Scheduled", "In Progress", "Completed"] },
        limit: { type: "integer", description: "How many results (default 15)" },
      },
      required: ["status"],
    },
  },
  {
    name: "query_findings",
    description: "Query recorded findings and problems, optionally filtered by severity.",
    input_schema: {
      type: "object",
      properties: {
        only_open: { type: "boolean", description: "Open findings only (default true)" },
        severity: { type: "string", enum: ["Critical", "High", "Medium", "Low"] },
        limit: { type: "integer" },
      },
      required: [],
    },
  },
  {
    name: "propose_finding",
    description:
      "Propose a new finding to record. This does NOT write to the system: it shows the user a draft to confirm themselves. Use only when the user asks to record a finding.",
    input_schema: {
      type: "object",
      properties: {
        equipment_id: { type: "string", description: "Equipment UUID" },
        finding_title: { type: "string", description: "Short, clear title" },
        description: { type: "string", description: "Description of the finding" },
        severity: { type: "string", enum: ["Critical", "High", "Medium", "Low"] },
      },
      required: ["equipment_id", "finding_title", "severity"],
    },
  },
];

const FALLBACK_ANSWER = "معلش، مقدرتش أوصل لإجابة. جرّب تصوغ السؤال بطريقة تانية.";

type Turn = { role: "user" | "assistant"; content: string };
type RunTool = (name: string, input: Record<string, any>) => Promise<string>;

// Only plain text turns are replayed; tool traffic is rebuilt fresh each request.
function cleanHistory(history: unknown): Turn[] {
  if (!Array.isArray(history)) return [];
  const turns: Turn[] = [];
  for (const m of history.slice(-10)) {
    if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") {
      turns.push({ role: m.role, content: m.content });
    }
  }
  return turns;
}

async function runClaude(
  apiKey: string,
  history: Turn[],
  question: string,
  runTool: RunTool,
): Promise<string> {
  const { default: Anthropic } = await import("npm:@anthropic-ai/sdk@0.71.0");
  const client = new Anthropic({ apiKey });

  const messages: any[] = history.map((m) => ({ role: m.role, content: m.content }));
  messages.push({ role: "user", content: question });

  for (let turn = 0; turn < 8; turn++) {
    const stream = client.messages.stream({
      model: Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-4-8",
      max_tokens: 4096,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      tools: TOOLS as any,
      messages,
    });
    const response = await stream.finalMessage();
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      return response.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n")
        .trim();
    }

    const toolResults: any[] = [];
    for (const block of response.content as any[]) {
      if (block.type !== "tool_use") continue;
      let result: string;
      try {
        result = await runTool(block.name, block.input as Record<string, any>);
      } catch (err) {
        result = "Tool error: " + (err instanceof Error ? err.message : String(err));
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }
    messages.push({ role: "user", content: toolResults });
  }
  return "";
}

// Gemini takes the same tools in OpenAPI shape: input_schema becomes parameters,
// and an empty required list is dropped because the schema validator rejects it.
const GEMINI_TOOLS = [{
  functionDeclarations: TOOLS.map((t) => {
    const { required, ...rest } = t.input_schema as Record<string, any>;
    const parameters = required && required.length ? { ...rest, required } : rest;
    return { name: t.name, description: t.description, parameters };
  }),
}];

// The free tier meters each model separately and overloads them independently,
// so when one is busy the next one down usually answers straight away.
const MODEL_CHAIN = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
];

async function runGemini(
  apiKey: string,
  preferred: string | null,
  history: Turn[],
  question: string,
  runTool: RunTool,
): Promise<string> {
  const chain = preferred
    ? [preferred, ...MODEL_CHAIN.filter((m) => m !== preferred)]
    : [...MODEL_CHAIN];

  // Gemini calls the assistant side "model" and carries tool results as a user turn.
  const contents: any[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  contents.push({ role: "user", parts: [{ text: question }] });

  // Gemini 3 rejects a tool conversation whose functionCall parts lost their
  // thought signature, and a signature is only valid for the model that made it.
  // So the chain is a choice made on the opening call; after that we are married
  // to that model and can only wait it out.
  let locked: string | null = null;

  for (let turn = 0; turn < 8; turn++) {
    let body: any = null;
    let lastStatus = 0;
    let lastDetail = "no response";

    for (const model of locked ? [locked] : chain) {
      const attempts = locked ? 3 : 1;
      let settled = false;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" + model +
            ":generateContent",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM }] },
              contents,
              tools: GEMINI_TOOLS,
              generationConfig: { maxOutputTokens: 4096 },
            }),
          },
        );
        if (res.ok) {
          body = await res.json();
          locked = model;
          settled = true;
          break;
        }
        // Always drain the body; reading a response twice throws and hides the status.
        lastStatus = res.status;
        lastDetail = await res.text();
        if (res.status !== 503 && res.status !== 429 && res.status < 500) {
          settled = true; // a real error — trying another model will not help
          break;
        }
        if (attempt < attempts - 1) {
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
      if (settled) break;
    }

    if (!body) {
      if (lastStatus === 503 || lastStatus === 429) {
        throw new Error("كل موديلات Gemini مزحومة أو خلصت حصتها دلوقتي. جرّب تاني بعد شوية.");
      }
      throw new Error("Gemini API " + lastStatus + ": " + lastDetail.slice(0, 400));
    }

    const parts: any[] = body?.candidates?.[0]?.content?.parts ?? [];
    const calls = parts.filter((p) => p.functionCall);

    if (!calls.length) {
      return parts
        .filter((p) => typeof p.text === "string")
        .map((p) => p.text)
        .join("\n")
        .trim();
    }

    contents.push({ role: "model", parts });

    const responses: any[] = [];
    for (const p of calls) {
      const call = p.functionCall;
      let result: string;
      try {
        result = await runTool(call.name, (call.args ?? {}) as Record<string, any>);
      } catch (err) {
        result = "Tool error: " + (err instanceof Error ? err.message : String(err));
      }
      // The id is only present on Gemini 3 models; echo it back when we get one
      // so parallel calls are matched to the right result.
      const fr: Record<string, unknown> = { name: call.name, response: { result } };
      if (call.id) fr.id = call.id;
      responses.push({ functionResponse: fr });
    }
    contents.push({ role: "user", parts: responses });
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Anthropic first: dropping in its key is how you switch back off Gemini.
  const anthropicKey = await getSecret("ANTHROPIC_API_KEY");
  const geminiKey = anthropicKey ? null : await getSecret("GEMINI_API_KEY");
  if (!anthropicKey && !geminiKey) {
    return json({
      error: "المساعد غير مفعّل بعد — لم يُضبط مفتاح Anthropic أو Gemini.",
      needs_key: true,
    }, 400);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const db = createClient(supaUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  try {
    const { messages: history, question } = await req.json();
    if (!question || typeof question !== "string") {
      return json({ error: "question is required" }, 400);
    }

    // @ts-ignore - provided by the Supabase edge runtime
    const embedder = new Supabase.ai.Session("gte-small");
    const sources: { title: string; page_hint: string | null }[] = [];
    let proposedFinding: Record<string, unknown> | null = null;

    const runTool: RunTool = async (name, input) => {
      if (name === "search_manuals") {
        const embedding = await embedder.run(input.query, { mean_pool: true, normalize: true });
        const { data, error } = await db.rpc("match_kb_chunks", {
          query_embedding: Array.from(embedding as number[]),
          match_count: 6,
          min_similarity: 0.2,
        });
        if (error) return "Search error: " + error.message;
        if (!data || data.length === 0) return "Nothing found in the uploaded manuals on this topic.";
        for (const r of data) {
          if (!sources.some((s) => s.title === r.document_title && s.page_hint === r.page_hint)) {
            sources.push({ title: r.document_title, page_hint: r.page_hint });
          }
        }
        return data
          .map((r: any, i: number) =>
            "[excerpt " + (i + 1) + "] source: " + r.document_title +
            (r.page_hint ? " (" + r.page_hint + ")" : "") + "\n" + r.content)
          .join("\n\n---\n\n");
      }

      if (name === "search_equipment") {
        const term = String(input.query).replace(/[%,()]/g, " ").trim();
        const { data, error } = await db
          .from("equipment")
          .select("equipment_id, equipment_code, equipment_name, functional_location, criticality, status, sections(section_name, areas(area_name))")
          .or("equipment_name.ilike.%" + term + "%,equipment_code.ilike.%" + term + "%")
          .eq("active", true)
          .limit(12);
        if (error) return "Error: " + error.message;
        if (!data || !data.length) return "No matching equipment.";
        return JSON.stringify(data, null, 1);
      }

      if (name === "get_equipment_overview") {
        const id = input.equipment_id;
        const [eq, tasks, findings] = await Promise.all([
          db.from("equipment").select("equipment_id, equipment_code, equipment_name, functional_location, criticality, status, sections(section_name, areas(area_name))").eq("equipment_id", id).maybeSingle(),
          db.from("inspection_tasks").select("task_code, status, due_date, completion_date, condition_rating, inspection_activities(activity_name)").eq("equipment_id", id).order("due_date").limit(25),
          db.from("inspection_findings").select("finding_code, finding_title, severity, status, created_at, maintenance_actions(action_title, status, target_date)").eq("equipment_id", id).order("created_at", { ascending: false }).limit(15),
        ]);
        if (!eq.data) return "Equipment not found.";
        const t = tasks.data || [];
        return JSON.stringify({
          equipment: eq.data,
          task_summary: {
            overdue: t.filter((x: any) => x.status === "Overdue").length,
            upcoming: t.filter((x: any) => ["Scheduled", "Upcoming"].indexOf(x.status) >= 0).length,
            completed: t.filter((x: any) => x.status === "Completed").length,
          },
          recent_tasks: t.slice(0, 10),
          findings: findings.data || [],
        }, null, 1);
      }

      if (name === "query_tasks") {
        const { data, error } = await db
          .from("inspection_tasks")
          .select("task_code, status, due_date, priority, equipment(equipment_name, functional_location), inspection_activities(activity_name)")
          .eq("status", input.status)
          .order("due_date")
          .limit(Math.min(input.limit || 15, 40));
        if (error) return "Error: " + error.message;
        if (!data || !data.length) return "No tasks with that status.";
        return JSON.stringify(data, null, 1);
      }

      if (name === "query_findings") {
        let q = db
          .from("inspection_findings")
          .select("finding_code, finding_title, finding_description, severity, status, created_at, equipment(equipment_name, functional_location)")
          .order("created_at", { ascending: false })
          .limit(Math.min(input.limit || 15, 40));
        if (input.only_open !== false) q = q.neq("status", "Closed");
        if (input.severity) q = q.eq("severity", input.severity);
        const { data, error } = await q;
        if (error) return "Error: " + error.message;
        if (!data || !data.length) return "No matching findings.";
        return JSON.stringify(data, null, 1);
      }

      if (name === "propose_finding") {
        const { data: eq } = await db
          .from("equipment")
          .select("equipment_id, equipment_name, functional_location")
          .eq("equipment_id", input.equipment_id)
          .maybeSingle();
        if (!eq) return "Invalid equipment_id - call search_equipment first.";
        proposedFinding = {
          equipment_id: input.equipment_id,
          equipment_name: eq.equipment_name,
          functional_location: eq.functional_location,
          finding_title: input.finding_title,
          description: input.description || "",
          severity: input.severity,
        };
        return "Draft prepared and shown to the user for confirmation. Tell them to press the confirm button to record it.";
      }

      return "Unknown tool: " + name;
    };

    const turns = cleanHistory(history);
    const answer = anthropicKey
      ? await runClaude(anthropicKey, turns, question, runTool)
      : await runGemini(
        geminiKey!,
        await getSecret("GEMINI_MODEL"),
        turns,
        question,
        runTool,
      );

    return json({
      ok: true,
      answer: answer || FALLBACK_ANSWER,
      provider: anthropicKey ? "anthropic" : "gemini",
      sources,
      proposed_finding: proposedFinding,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
