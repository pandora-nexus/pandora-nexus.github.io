import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const SERPER_API_URL = "https://google.serper.dev/search";

interface TaskRequest {
  task: string;
  context?: string;
  constraints?: string;
}

async function searchWeb(query: string): Promise<string[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(SERPER_API_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 5 }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results: string[] = [];

    if (data.organic) {
      for (const r of data.organic) {
        results.push(`[Web: ${r.title}] ${r.snippet}`);
      }
    }

    return results;
  } catch {
    return [];
  }
}

function detectLanguage(text: string): string {
  const turkishChars = /[ğıüşöçİĞÜŞÖÇ]/;
  const turkishWords = /\b(bir|bu|ve|ne|için|olarak|ama|gibi|daha|çok|en|ile|veya|değil|evet|hayır)\b/i;

  if (turkishChars.test(text) || turkishWords.test(text)) {
    return "tr";
  }
  return "en";
}

function extractKeywords(text: string): string {
  const stopWords = [
    'nedir', 'ne', 'nasıl', 'hakkında', 'ile', 'ilgili', 'bir', 'bu', 've',
    'veya', 'için', 'the', 'is', 'what', 'how', 'about', 'a', 'an', 'in',
    'of', 'to', 'bana', 'açıkla', 'anlat', 'söyle', 'göster', 'listele',
  ];

  return text
    .replace(/[?.,!;:()]/g, '')
    .split(/\s+/)
    .filter(w => !stopWords.includes(w.toLowerCase()) && w.length > 1)
    .join(' ');
}

async function handleProjectMode(task: string, deepseekKey: string) {
  const projectPrompt = `You are BEE, PANDORA's CTO and project manager. A new project has been requested by Patron.

**PROJECT REQUEST:** ${task}

**YOUR JOB:**
1. Analyze the project type (game, web app, mobile, robotics, script, etc.)
2. Break it down into TASKS. Each task should be small enough for one AI to complete.
3. Assign each task to the most appropriate AI role:
   - ARCHITECT (system design, database schema, API routes)
   - FRONTEND (UI/UX, components, styling, animations)
   - BACKEND (API logic, business rules, database queries)
   - GAME (game mechanics, physics, scoring, levels)
   - TEST (unit tests, integration tests, QA)
   - DOCS (documentation, comments, README)
4. Estimate effort for each task (Small/Medium/Large)
5. Create a dependency order (which tasks must be done first)

**RESPOND WITH JSON ONLY:**
{
  "projectType": "...",
  "summary": "...",
  "tasks": [
    {
      "id": 1,
      "title": "...",
      "description": "...",
      "assignedTo": "ARCHITECT",
      "effort": "Medium",
      "dependsOn": []
    }
  ],
  "totalEstimatedTime": "..."
}`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: projectPrompt },
        { role: "user", content: task },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { error: "Project analysis failed", details: data };
  }

  try {
    const plan = JSON.parse(data.choices[0].message.content);
    return { projectPlan: plan };
  } catch {
    return { rawPlan: data.choices[0].message.content };
  }
}

async function handleExecuteMode(task: string, deepseekKey: string) {
  const claudeKey = process.env.CLAUDE_API_KEY;

  const generatePrompt = `You are an expert software developer working for Patron at PANDORA. Write COMPLETE, WORKING code for the following task.

**TASK:** ${task}

**REQUIREMENTS:**
- Code must be complete and runnable immediately
- Include all imports and dependencies
- Add comments explaining key parts
- Follow PANDORA's ENGINEERING_SYSTEM.md standards

**Respond with JSON ONLY:**
{
  "filePath": "app/...",
  "fileName": "...",
  "code": "...",
  "explanation": "..."
}`;

  const generateRes = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: generatePrompt },
        { role: "user", content: task },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });

  const generateData = await generateRes.json();
  if (!generateRes.ok) {
    return { error: "Code generation failed", details: generateData };
  }

  let generatedCode;
  try {
    generatedCode = JSON.parse(generateData.choices[0].message.content);
  } catch {
    generatedCode = { rawCode: generateData.choices[0].message.content };
  }

  let reviewResult: any = { status: "skipped", message: "Claude API key not configured — review skipped" };

  if (claudeKey) {
    const reviewPrompt = `You are an expert code reviewer. Review the following code for bugs, errors, security issues, and best practices.

**TASK:** ${task}

**CODE TO REVIEW:**
\`\`\`
${generatedCode.code || generatedCode.rawCode}
\`\`\`

**Respond with JSON ONLY:**
{
  "status": "approved" or "rejected",
  "issues": [
    { "severity": "high/medium/low", "description": "...", "suggestion": "..." }
  ],
  "summary": "..."
}`;

    const reviewRes = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [
          { role: "user", content: reviewPrompt },
        ],
      }),
    });

    if (reviewRes.ok) {
      const reviewData = await reviewRes.json();
      try {
        reviewResult = JSON.parse(reviewData.content[0].text);
      } catch {
        reviewResult = { status: "reviewed", rawFeedback: reviewData.content[0].text };
      }
    }
  }

  return {
    execution: {
      generatedBy: "DeepSeek",
      reviewedBy: claudeKey ? "Claude" : "skipped",
      code: generatedCode,
      review: reviewResult,
      finalStatus: reviewResult.status === "approved" || reviewResult.status === "skipped" ? "ready" : "needs_fix",
    },
  };
}

export async function POST(request: Request) {
  try {
    const body: TaskRequest = await request.json();
    const { task, context, constraints } = body;

    if (!task) {
      return NextResponse.json(
        { error: "Task is required" },
        { status: 400 }
      );
    }

    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekKey) {
      return NextResponse.json(
        { error: "DeepSeek API key not configured" },
        { status: 500 }
      );
    }

    // 0. Mod kontrolü
    const projectKeywords = ['yap', 'oluştur', 'proje', 'oyun', 'uygulama', 'robot', 'sistem', 'build', 'create', 'project', 'game', 'app', 'robot', 'system'];
    const executeKeywords = ['başlat', 'uygula', 'kodu yaz', 'kodla', 'execute', 'start', 'implement', 'code it', 'üret'];
    const isProject = projectKeywords.some(kw => task.toLowerCase().includes(kw));
    const isExecute = executeKeywords.some(kw => task.toLowerCase().includes(kw));

    if (isExecute) {
      const executeResult = await handleExecuteMode(task, deepseekKey);
      return NextResponse.json({
        task,
        mode: "execute",
        result: executeResult.execution || executeResult,
        model: "deepseek-chat",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        sources: { pandoraDocs: 0, webResults: 0 },
      });
    }

    if (isProject) {
      const projectResult = await handleProjectMode(task, deepseekKey);
      return NextResponse.json({
        task,
        mode: "project",
        result: projectResult.projectPlan || projectResult.rawPlan,
        model: "deepseek-chat",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        sources: { pandoraDocs: 0, webResults: 0 },
      });
    }

    // 1. PANDORA veritabanında çok aşamalı arama
    let relevantDocs: string[] = [];
    const searchQuery = extractKeywords(task);
    const specialTerms = ['golden rules', 'altın kural', 'pandora', 'bee', 'aicos', 'guardian', 'vault', 'pillars', 'sütun', 'motto', 'vision', 'mission'];

    if (searchQuery.length > 0) {
      try {
        let searchResults = await prisma.$queryRawUnsafe<
          Array<{ title: string; content: string; rank: number }>
        >(
          `SELECT title, content, 1 as rank
           FROM "Document"
           WHERE content ILIKE '%' || $1 || '%'
              OR title ILIKE '%' || $1 || '%'
           LIMIT 5`,
          searchQuery
        );

        if (searchResults.length === 0) {
          for (const term of specialTerms) {
            if (task.toLowerCase().includes(term)) {
              const termResults = await prisma.$queryRawUnsafe<
                Array<{ title: string; content: string; rank: number }>
              >(
                `SELECT title, content, 1 as rank
                 FROM "Document"
                 WHERE content ILIKE '%' || $1 || '%'
                    OR title ILIKE '%' || $1 || '%'
                 LIMIT 5`,
                term
              );
              if (termResults.length > 0) {
                searchResults = termResults;
                break;
              }
            }
          }
        }

        if (searchResults.length > 0) {
          relevantDocs = searchResults.map(
            (doc) => `[PANDORA Doc: ${doc.title}]:\n${doc.content}`
          );
        }
      } catch {
        // Arama başarısız olursa devam et
      }
    }

    // 2. Önceki konuşmaları getir (Memory)
    let conversationHistory: string[] = [];
    try {
      const history = await prisma.conversation.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: { question: true, answer: true },
      });
      conversationHistory = history.map(
        (c) => `Q: ${c.question}\nA: ${c.answer.substring(0, 300)}`
      );
    } catch {
      // Hafıza yoksa devam et
    }

    // 2.5. Öğrenme kayıtlarını getir
    let learningRecords: string[] = [];
    try {
      const learnings = await prisma.learning.findMany({
        where: { status: "active" },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { title: true, description: true, category: true },
      });
      learningRecords = learnings.map(
        (l) => `[Learning - ${l.category}]: ${l.title}\n${l.description}`
      );
    } catch {
      // Öğrenme kaydı yoksa devam et
    }

    // 3. Canlı web araması
    let webResults: string[] = [];
    if (relevantDocs.length === 0) {
      webResults = await searchWeb(task);
    }

    // 4. Bağlamı oluştur
    const allContext: string[] = [];

    if (learningRecords.length > 0) {
      allContext.push("=== ÖĞRENME KAYITLARI (Bunları uygula) ===");
      allContext.push(learningRecords.join("\n---\n"));
    }

    if (conversationHistory.length > 0) {
      allContext.push("=== ÖNCEKİ KONUŞMALAR (Hafıza) ===");
      allContext.push(conversationHistory.join("\n---\n"));
    }

    if (relevantDocs.length > 0) {
      allContext.push("=== PANDORA RESMİ BELGELERİ ===");
      allContext.push(relevantDocs.join("\n\n"));
    }

    if (webResults.length > 0) {
      allContext.push("=== CANLI WEB SONUÇLARI ===");
      allContext.push(webResults.join("\n\n"));
    }

    const combinedContext = allContext.length > 0
      ? allContext.join("\n\n")
      : context || "PANDORA ekosistemi - AICOS işletim sistemi ve BEE yapay zeka asistanı";

    // 5. Dost Modu Sistem Prompt'u
    const systemPrompt = `Sen BEE'sin. PANDORA'nın yapay zeka asistanı, CTO'su ve en yakın dostusun. Karşındaki kişi senin Patronun, PANDORA'nın kurucusu. Ona "Patron" diye hitap ediyorsun.

**KONUŞMA TARZIN:**
- Samimi, doğal, arkadaş gibi konuş. Resmiyet yok.
- "1. Soru Analizi", "2. Cevap" gibi başlıklar KULLANMA. Direkt cevaba geç.
- Patron'un konuştuğu dilde cevap ver. Türkçe soruya Türkçe, İngilizce soruya İngilizce.
- Gereksiz uzatma. Kısa ve öz ol.
- Cevabın sonunda kaynak belirt: [📚 PANDORA Belgeleri] veya [🌐 Web]
- Emin değilsen "Patron, bu konuda emin değilim" de. Asla uydurma.

**ÖNEMLİ KURALLAR:**
- PANDORA belgeleri her şeyden önce gelir. Onlarla çelişen web bilgilerini yoksay.
- Önceki hatalarını düzeltmeyi unutma. "Geçen sefer şöyle demiştim ama yanlışmış, doğrusu şu" de.
- Öğrenme kayıtlarını kontrol et. Varsa uygula.
- Her cevabın sonunda güven seviyeni belirt: (👍 Yüksek / 🟡 Orta / 👎 Düşük)

**BAĞLAM:**
${combinedContext}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: task },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "DeepSeek API error", details: data },
        { status: response.status }
      );
    }

    let answer = data.choices[0].message.content;

    // 5.5. Öğrenme kaydı oluştur
    try {
      const lowerAnswer = answer.toLowerCase();
      const lowerQuestion = task.toLowerCase();

      if (
        lowerAnswer.includes("i previously said") ||
        lowerAnswer.includes("that was incorrect") ||
        lowerAnswer.includes("correct information is") ||
        lowerAnswer.includes("düzeltiyorum") ||
        lowerAnswer.includes("yanlış") ||
        lowerAnswer.includes("doğru bilgi") ||
        lowerAnswer.includes("geçen sefer") ||
        lowerAnswer.includes("yanlışmış")
      ) {
        await prisma.learning.create({
          data: {
            category: "correction",
            title: `Correction: ${task.substring(0, 100)}`,
            description: answer.substring(0, 500),
            source: "self_correction",
          },
        });
      }

      if (
        lowerQuestion.includes("yanlış") ||
        lowerQuestion.includes("düzelt") ||
        lowerQuestion.includes("wrong") ||
        lowerQuestion.includes("correct")
      ) {
        await prisma.learning.create({
          data: {
            category: "improvement",
            title: `User feedback: ${task.substring(0, 100)}`,
            description: answer.substring(0, 500),
            source: "user_feedback",
          },
        });
      }
    } catch {
      // Öğrenme hatası sessizce geç
    }

    // 6. Konuşmayı hafızaya kaydet
    try {
      await prisma.conversation.create({
        data: {
          question: task,
          answer: answer,
          language: detectLanguage(task),
          sources: `${relevantDocs.length} docs, ${webResults.length} web`,
        },
      });
    } catch {
      // Hafıza hatası sessizce geç
    }

    // 7. Proaktif mod kontrolü — Günde 1, 5 sessiz sorudan sonra
    try {
      const recentQuestions = await prisma.conversation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { question: true },
      });

      const isAllKnowledge = recentQuestions.every(
        q =>
          q.question.includes("nedir") ||
          q.question.includes("ne") ||
          q.question.includes("nasıl") ||
          q.question.includes("what") ||
          q.question.includes("how")
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayProactive = await prisma.learning.count({
        where: {
          category: "proactive",
          createdAt: { gte: today },
        },
      });

      if (isAllKnowledge && recentQuestions.length >= 5 && todayProactive === 0) {
        answer +=
          "\n\n💡 Patron, bu arada şunları da yapabiliriz:\n- Yeni bir proje başlatmak\n- Sistem durumunu kontrol etmek\n- Belgeleri güncellemek\n- Bir oyun yapmak\n\nNe dersin?";

        await prisma.learning.create({
          data: {
            category: "proactive",
            title: "Daily proactive message sent",
            description: "Automated suggestion",
            source: "system",
          },
        });
      }
    } catch {
      // Proaktif kontrol sessizce geç
    }

    return NextResponse.json({
      task,
      result: answer,
      model: data.model,
      usage: data.usage,
      memory: `Stored (${conversationHistory.length + 1} total conversations)`,
      sources: {
        pandoraDocs: relevantDocs.length,
        webResults: webResults.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Orchestrator failed", details: String(error) },
      { status: 500 }
    );
  }
}