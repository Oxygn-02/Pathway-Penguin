#!/usr/bin/env node
/**
 * Pathway Penguin — Load Test Script
 *
 * Simulates 10 concurrent users each performing an 11-step journey against the
 * API server.  Uses Node's native fetch (v24+) with manual cookie handling.
 *
 * Usage:
 *   node scripts/load-test.mjs              # defaults to port 8080
 *   node scripts/load-test.mjs --port 3000  # override port
 */

const PORT = (() => {
  const i = process.argv.indexOf("--port");
  return i !== -1 && process.argv[i + 1] ? Number(process.argv[i + 1]) : 8080;
})();

const BASE = `http://localhost:${PORT}`;
const NUM_USERS = 10;
const SUBJECT = "Physics";

const QUESTION_SYSTEM = `You are generating a GCSE exam question for a student.
Return ONLY valid JSON with no markdown:
{
  "question": "The full question text.",
  "marks": 1,
  "partAnswers": null,
  "answer": "full model answer",
  "steps": ["step 1", "step 2", "step 3"],
  "traceTable": null
}
- marks: total marks available. For a single-part question set marks: 1 and partAnswers: null.
Max 4 steps, each one short plain sentence.`;

const CHECK_SYSTEM = `Check a GCSE student's answer and award marks. Return ONLY valid JSON:
{"marksAwarded":1,"marksAvailable":1,"noWorkings":false,"feedback":"one short encouraging sentence"}`;

const TOPICS = Array.from({ length: 10 }, (_, i) => ({
  id: `${Math.floor(i / 3) + 1}.${(i % 3) + 1}`,
  description: [
    "Ohm's Law and resistance",
    "Kirchhoff's current laws",
    "Series and parallel circuits",
    "Electrical power and energy",
    "Alternating and direct current",
    "Electromagnetic induction",
    "Transformers and the national grid",
    "Static electricity and charge",
    "Electric fields",
    "Current-voltage characteristics",
  ][i],
  confidence: (i % 4) + 1,
}));

let peakConcurrentAI = 0;
let currentConcurrentAI = 0;
let totalAICalls = 0;
let totalInputTokens = 0;
let totalOutputTokens = 0;
const aiUsageSamples = [];
const allActionLogs = [];
const failedRequests = [];

function aiEnter() {
  currentConcurrentAI++;
  totalAICalls++;
  if (currentConcurrentAI > peakConcurrentAI) peakConcurrentAI = currentConcurrentAI;
}
function aiExit() {
  currentConcurrentAI--;
}

async function timedAction(userId, name, fn) {
  const start = performance.now();
  let ok = true;
  let errorMsg = null;
  try {
    const result = await fn();
    return result;
  } catch (e) {
    ok = false;
    errorMsg = e.message || String(e);
    failedRequests.push({ userId, action: name, error: errorMsg });
    throw e;
  } finally {
    const ms = Math.round(performance.now() - start);
    const status = ok ? "\x1b[32mOK\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
    const line = `  [User ${String(userId).padStart(2)}] ${name.padEnd(38)} ${String(ms).padStart(6)} ms  ${status}${errorMsg ? "  " + errorMsg : ""}`;
    console.log(line);
    allActionLogs.push({ userId, action: name, ms, ok, error: errorMsg });
  }
}

async function apiFetch(path, opts = {}, cookie = "") {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (cookie) headers["Cookie"] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const sessionCookie = setCookie
    .map((c) => c.split(";")[0])
    .find((c) => c.startsWith("pp_session="));
  const json = res.headers.get("content-type")?.includes("json")
    ? await res.json()
    : null;
  if (!res.ok && res.status !== 302) {
    throw new Error(`${res.status} ${json?.error || res.statusText}`);
  }
  return { json, status: res.status, sessionCookie: sessionCookie || null };
}

async function callAI(cookie, system, user, max_tokens = 1024) {
  aiEnter();
  try {
    const { json } = await apiFetch("/api/ai/message", {
      method: "POST",
      body: { system, user, max_tokens },
    }, cookie);
    if (json?.usage) {
      const u = json.usage;
      totalInputTokens += u.input_tokens || 0;
      totalOutputTokens += u.output_tokens || 0;
      aiUsageSamples.push(u);
    }
    return json?.text || "";
  } finally {
    aiExit();
  }
}

function parseJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in AI response");
  return JSON.parse(match[0]);
}

async function runUser(userId) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const username = `lt${userId}_${suffix}`;
  const email = `lt${userId}_${suffix}@utcportsmouth.org`;
  const password = "Test1234";
  let cookie = "";

  // 1. Sign up
  await timedAction(userId, "1. Sign up", async () => {
    const { sessionCookie } = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: {
        username,
        email,
        password,
        yearGroup: 10,
        optionSubjects: ["Computer Science", "Geography"],
      },
    });
    if (sessionCookie) cookie = sessionCookie;
  });

  // 2. Log in
  await timedAction(userId, "2. Log in", async () => {
    const { sessionCookie } = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    if (sessionCookie) cookie = sessionCookie;
  });

  // 3. Upload pathway
  let pathwayId = null;
  await timedAction(userId, "3. Upload pathway", async () => {
    const { json } = await apiFetch("/api/pathways", {
      method: "POST",
      body: { subject: SUBJECT, topics: TOPICS },
    }, cookie);
    pathwayId = json?.id;
  });

  // 4. Generate questions (10 concurrent AI calls)
  const questions = [];
  await timedAction(userId, "4. Generate questions (10 topics)", async () => {
    const results = await Promise.all(
      TOPICS.map(async (topic) => {
        const raw = await callAI(
          cookie,
          QUESTION_SYSTEM,
          `Topic ID: ${topic.id}\nTopic: "${topic.description}"\nConfidence level: ${topic.confidence}`,
        );
        const q = parseJSON(raw);
        return { topicId: topic.id, ...q };
      }),
    );
    questions.push(...results);
    if (pathwayId) {
      await apiFetch(`/api/pathways/${pathwayId}/questions`, {
        method: "PATCH",
        body: { questions: results },
      }, cookie);
    }
  });

  // 5. Answer all 10 questions (alternating correct/incorrect)
  const quizResults = [];
  await timedAction(userId, "5. Answer 10 questions", async () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const isCorrect = i % 2 === 0;
      const studentAnswer = isCorrect
        ? (q.answer || "correct answer")
        : "I don't know";
      const raw = await callAI(
        cookie,
        CHECK_SYSTEM,
        `Question: ${q.question}\nMarks available: ${q.marks ?? 1}\nCorrect answer: ${q.answer}\nStudent answer: ${studentAnswer}\n\nAward marks.`,
        200,
      );
      const result = parseJSON(raw);
      quizResults.push({
        topicId: q.topicId,
        marksAwarded: result.marksAwarded,
        marksAvailable: result.marksAvailable,
        correct: result.marksAwarded === result.marksAvailable,
      });
    }
  });

  // 6. Save quiz results
  await timedAction(userId, "6. Save quiz results", async () => {
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await apiFetch("/api/quiz-results", {
      method: "POST",
      body: {
        subject: SUBJECT,
        sessionId,
        results: quizResults.map((r) => ({
          topicId: r.topicId,
          topicDesc: TOPICS.find((t) => t.id === r.topicId)?.description || "",
          correct: r.correct,
        })),
      },
    }, cookie);
  });

  // 7. Fetch weak topics (follow-up practice)
  await timedAction(userId, "7. Fetch weak topics", async () => {
    await apiFetch(`/api/quiz-results/weak?subject=${encodeURIComponent(SUBJECT)}`, {}, cookie);
  });

  // 8. Open calendar
  await timedAction(userId, "8. Open calendar", async () => {
    await apiFetch("/api/calendar", {}, cookie);
  });

  // 9. Add 3 calendar entries
  await timedAction(userId, "9. Add 3 calendar entries", async () => {
    for (const [dayOfWeek, subject] of [[0, "Maths"], [2, "Physics"], [4, "Computer Science"]]) {
      await apiFetch("/api/calendar", {
        method: "POST",
        body: { subject, dayOfWeek, durationMinutes: 60 },
      }, cookie);
    }
  });

  // 10. Log out, log back in, verify pathway saved
  await timedAction(userId, "10. Logout + re-login + verify", async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }, cookie);
    const { sessionCookie } = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    if (sessionCookie) cookie = sessionCookie;
    const { json } = await apiFetch("/api/pathways", {}, cookie);
    const pathways = json?.pathways || [];
    if (pathways.length === 0) throw new Error("No pathways found after re-login");
    if (pathwayId && !pathways.some((p) => p.id === pathwayId)) {
      throw new Error(`Created pathway ${pathwayId} not found after re-login`);
    }
  });

  // 11. Resume session — verify cached questions
  await timedAction(userId, "11. Resume (verify cached questions)", async () => {
    const { json } = await apiFetch("/api/pathways", {}, cookie);
    const pathways = json?.pathways || [];
    const pw = pathways[0];
    if (!pw) throw new Error("No pathway to resume");
    if (!pw.questions || !Array.isArray(pw.questions)) {
      throw new Error("Pathway has no cached questions — resume would fail");
    }
  });
}

function estimateCost(numUsers, avgInputPerCall, avgOutputPerCall, callsPerUser) {
  const totalInput = numUsers * callsPerUser * avgInputPerCall;
  const totalOutput = numUsers * callsPerUser * avgOutputPerCall;
  const inputCost = (totalInput / 1_000_000) * 3;
  const outputCost = (totalOutput / 1_000_000) * 15;
  return { totalInput, totalOutput, inputCost, outputCost, totalCost: inputCost + outputCost };
}

function countDbOps() {
  const reads = {
    login: 2, me: 2, pathways: 3, calendar: 1, weakTopics: 3, bestTopics: 1, sessions: 1,
  };
  const writes = {
    signup: 11, pathway: 1, quizResults: 10, calendarEntry: 1,
    patchQuestions: 1,
  };
  const perUser = {
    reads: reads.login + reads.pathways + reads.weakTopics + reads.calendar + reads.login + reads.pathways + reads.pathways,
    writes: writes.signup + writes.pathway + writes.quizResults + (writes.calendarEntry * 3) + writes.patchQuestions,
  };
  return {
    perUser,
    totalReads: perUser.reads * NUM_USERS,
    totalWrites: perUser.writes * NUM_USERS,
  };
}

async function main() {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  Pathway Penguin Load Test — ${NUM_USERS} concurrent users`);
  console.log(`  Target: ${BASE}`);
  console.log(`${"=".repeat(70)}\n`);

  const wallStart = performance.now();

  const results = await Promise.allSettled(
    Array.from({ length: NUM_USERS }, (_, i) => runUser(i + 1)),
  );

  const wallMs = Math.round(performance.now() - wallStart);

  console.log(`\n${"=".repeat(70)}`);
  console.log("  SUMMARY");
  console.log(`${"=".repeat(70)}\n`);

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`  Users completed:          ${succeeded}/${NUM_USERS}`);
  console.log(`  Users failed:             ${failed}`);
  console.log(`  Total wall-clock time:    ${(wallMs / 1000).toFixed(1)} s\n`);

  // Average time per action
  const actionMap = {};
  for (const log of allActionLogs) {
    if (!actionMap[log.action]) actionMap[log.action] = { total: 0, count: 0 };
    actionMap[log.action].total += log.ms;
    actionMap[log.action].count++;
  }
  console.log("  Average time per action:");
  for (const [action, data] of Object.entries(actionMap).sort((a, b) => {
    const numA = parseInt(a[0]);
    const numB = parseInt(b[0]);
    return numA - numB;
  })) {
    console.log(`    ${action.padEnd(40)} ${Math.round(data.total / data.count).toString().padStart(6)} ms avg  (${data.count} runs)`);
  }

  // Anthropic stats
  const callsPerUser = totalAICalls / NUM_USERS;
  const avgInput = aiUsageSamples.length > 0
    ? Math.round(totalInputTokens / aiUsageSamples.length)
    : 0;
  const avgOutput = aiUsageSamples.length > 0
    ? Math.round(totalOutputTokens / aiUsageSamples.length)
    : 0;

  console.log(`\n  Anthropic API:`);
  console.log(`    Total calls:            ${totalAICalls}`);
  console.log(`    Calls per user:         ${callsPerUser}`);
  console.log(`    Peak concurrent calls:  ${peakConcurrentAI}`);
  console.log(`    Total input tokens:     ${totalInputTokens.toLocaleString()}`);
  console.log(`    Total output tokens:    ${totalOutputTokens.toLocaleString()}`);
  console.log(`    Avg input/call:         ${avgInput.toLocaleString()}`);
  console.log(`    Avg output/call:        ${avgOutput.toLocaleString()}`);

  // DB ops
  const db = countDbOps();
  console.log(`\n  Database operations (estimated):`);
  console.log(`    Per user:               ${db.perUser.reads} reads, ${db.perUser.writes} writes`);
  console.log(`    Total:                  ${db.totalReads} reads, ${db.totalWrites} writes`);

  // Failed requests
  if (failedRequests.length > 0) {
    console.log(`\n  Failed requests (${failedRequests.length}):`);
    for (const f of failedRequests) {
      console.log(`    [User ${f.userId}] ${f.action}: ${f.error}`);
    }
  } else {
    console.log(`\n  Failed requests:          0`);
  }

  // Cost projection
  console.log(`\n  Cost projection (claude-sonnet-4-6: $3/M input, $15/M output):`);
  console.log(`  ${"─".repeat(60)}`);
  console.log(`  ${"Users".padEnd(8)} ${"Input Tok".padEnd(14)} ${"Output Tok".padEnd(14)} ${"Input $".padEnd(10)} ${"Output $".padEnd(10)} Total $`);
  console.log(`  ${"─".repeat(60)}`);
  for (const n of [10, 50, 150, 300]) {
    const est = estimateCost(n, avgInput, avgOutput, callsPerUser);
    console.log(
      `  ${String(n).padEnd(8)} ${est.totalInput.toLocaleString().padEnd(14)} ${est.totalOutput.toLocaleString().padEnd(14)} $${est.inputCost.toFixed(2).padEnd(9)} $${est.outputCost.toFixed(2).padEnd(9)} $${est.totalCost.toFixed(2)}`,
    );
  }
  console.log(`  ${"─".repeat(60)}`);

  console.log(`\n${"=".repeat(70)}\n`);

  await runAutocannonBenchmark();
}

async function runAutocannonBenchmark() {
  let autocannon;
  try {
    autocannon = (await import("autocannon")).default;
  } catch {
    console.log("  [autocannon] Not installed — skipping throughput benchmark.\n");
    return;
  }

  console.log(`${"=".repeat(70)}`);
  console.log("  THROUGHPUT BENCHMARK (autocannon)");
  console.log(`${"=".repeat(70)}\n`);

  const endpoints = [
    { title: "GET /api/health", url: `${BASE}/api/health`, method: "GET" },
  ];

  for (const ep of endpoints) {
    console.log(`  ${ep.title}  (10s, 10 connections)`);
    const result = await new Promise((resolve, reject) => {
      const instance = autocannon({
        url: ep.url,
        method: ep.method,
        connections: 10,
        duration: 10,
      }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
      autocannon.track(instance, { renderProgressBar: false });
    });

    console.log(`    Requests/sec:  avg ${result.requests.average}  max ${result.requests.max}`);
    console.log(`    Latency (ms):  avg ${result.latency.average}  p99 ${result.latency.p99}  max ${result.latency.max}`);
    console.log(`    Throughput:    ${(result.throughput.average / 1024).toFixed(1)} KB/s avg`);
    console.log(`    Errors:        ${result.errors}\n`);
  }

  console.log(`${"=".repeat(70)}\n`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
