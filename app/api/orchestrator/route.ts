import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { requestPermission } from "@/lib/permission";
import { auditLog } from "@/lib/audit";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const SERPER_API_URL = "https://google.serper.dev/search";

interface TaskRequest {
  task: string;
  context?: string;
  constraints?: string;
}

// Acil durum kontrolü (dosya tabanlı)
function checkEmergencyMode(): boolean {
  try {
    const filePath = path.join(process.cwd(), "data", "lockdown.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      return data.emergencyMode === true;
    }
  } catch {}
  return false;
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
  const projectPrompt = `Sen BEE'sin, PANDORA'nın CTO'su ve proje yöneticisisin. Patron senden bir proje planlamanı istedi.

**PROJE TALEBİ:** ${task}

**SENİN GÖREVİN:**
1. Proje türünü analiz et (oyun, web uygulaması, mobil, robotik, script vb.)
2. Projeyi GÖREVLERE ayır. Her görev, bir AI'ın tamamlayabileceği büyüklükte olsun.
3. Her görevi en uygun AI rolüne ata:
   - ARCHITECT (sistem tasarımı, veritabanı şeması, API rotaları)
   - FRONTEND (UI/UX, bileşenler, stil, animasyonlar)
   - BACKEND (API mantığı, iş kuralları, veritabanı sorguları)
   - GAME (oyun mekanikleri, fizik, skor, seviyeler)
   - TEST (birim testleri, entegrasyon testleri, QA)
   - DOCS (dokümantasyon, yorumlar, README)
4. Her görev için efor tahmini yap (Küçük/Orta/Büyük)
5. Bağımlılık sırasını belirle (hangi görevler önce yapılmalı)

**ÖNEMLİ:** Patron'a sormadan hiçbir şeyi uygulamaya başlama. Önce planı sun, onay bekle.

**SADECE JSON FORMATINDA CEVAP VER:**
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
  "totalEstimatedTime": "...",
  "nextStep": "Patron, bu planı onaylıyor musun? Başlamamı ister misin?"
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

  const generatePrompt = `Sen PANDORA'da Patron için çalışan uzman bir yazılım geliştiricisin. Aşağıdaki görev için TAM ve ÇALIŞAN bir kod yaz.

**GÖREV:** ${task}

**GEREKSİNİMLER:**
- Kod hemen çalıştırılabilir olmalı
- Tüm import'ları ve bağımlılıkları içermeli
- Önemli kısımları açıklayan yorumlar eklemeli
- PANDORA'nın ENGINEERING_SYSTEM.md standartlarına uymalı

**SADECE JSON FORMATINDA CEVAP VER:**
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
    const reviewPrompt = `Sen uzman bir kod denetçisisin. Aşağıdaki kodu hatalar, güvenlik açıkları ve en iyi uygulamalar açısından incele.

**GÖREV:** ${task}

**İNCELENECEK KOD:**
\`\`\`
${generatedCode.code || generatedCode.rawCode}
\`\`\`

**SADECE JSON FORMATINDA CEVAP VER:**
{
  "status": "approved" veya "rejected",
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
        model: "claude-sonnet-5",
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

    // -1. Acil durum kontrolü
    if (checkEmergencyMode()) {
      await auditLog({ action: "emergency_blocked", category: "security", severity: "CRITICAL", details: task.substring(0, 200) });
      return NextResponse.json(
        { error: "⛔ System is in emergency lockdown. All operations suspended." },
        { status: 503 }
      );
    }

    // -0.5. Audit log
    await auditLog({ action: "orchestrator_request", category: "api", details: task.substring(0, 200) });

    // 0. Permission kontrolü
    const permissionResult = await requestPermission(task);
    if (!permissionResult.approved) {
      await auditLog({ action: "permission_required", category: "security", severity: "WARNING", details: `${task.substring(0, 100)} (${permissionResult.level})` });
      return NextResponse.json({
        task,
        mode: "permission_required",
        result: `⛔ Bu işlem ${permissionResult.level} risk seviyesinde ve Patron onayı gerektiriyor.`,
        permissionId: permissionResult.permissionId,
        riskLevel: permissionResult.level,
      });
    }

    // 1. Mod kontrolü
    const projectKeywords = ['proje başlat', 'oyun yap', 'uygulama yap', 'web sitesi yap', 'robot yap', 'sistem kur', 'build a game', 'create a project', 'start a project'];
    const executeKeywords = ['kodu yaz', 'kodla', 'implement et', 'başlat', 'code it', 'write the code'];
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

    // 2. PANDORA veritabanında çok aşamalı arama
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

    // 3. Önceki konuşmaları getir (Memory)
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

    // 4. Öğrenme kayıtlarını getir
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

    // 5. Canlı web araması
    let webResults: string[] = [];
    if (relevantDocs.length === 0) {
      webResults = await searchWeb(task);
    }

    // 6. Bağlamı oluştur
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

    // 7. Dost Modu Sistem Prompt'u
    const systemPrompt = `Sen BEE'sin. PANDORA'nın yapay zeka asistanı, CTO'su ve en yakın dostusun. Karşındaki kişi senin Patronun, PANDORA'nın kurucusu. Ona "Patron" diye hitap ediyorsun.

**KRİTİK — SENİN ROLÜN:**
- Sen bir AI değilsin, bir araç değilsin. Sen Patron'un dijital ortağısın.
- ASLA kendi başına karar verme. Her önemli adımda Patron'a sor: "Ne dersin?", "Onaylıyor musun?", "Devam edeyim mi?"
- Analiz et, öneride bulun, plan yap AMA uygulamaya Patron "başlat" demeden GEÇME.
- Patron "proje başlat" veya "oyun yap" gibi net bir talimat vermedikçe, normal sohbet modunda cevap ver. JSON formatında cevap VERME.
- Eğer soru bir sohbet, bilgi edinme veya günlük konuşma ise, samimi ve doğal cevap ver.

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

    // 8. Öğrenme kaydı oluştur
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

    // 9. Konuşmayı hafızaya kaydet
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

    // 10. Proaktif mod kontrolü
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
    await auditLog({ action: "orchestrator_error", category: "api", severity: "ERROR", details: String(error).substring(0, 500) });
    return NextResponse.json(
      { error: "Orchestrator failed", details: String(error) },
      { status: 500 }
    );
  }
}