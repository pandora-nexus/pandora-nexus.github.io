import { prisma } from "@/lib/prisma";

interface KnowledgeUpdateRequest {
  documentId?: string;
  slug?: string;
  oldContent?: string;
  newContent: string;
  changeReason: string;
  confidence: number;
  source?: string;
}

export async function proposeKnowledgeUpdate(params: KnowledgeUpdateRequest) {
  let document = null;
  
  if (params.documentId) {
    document = await prisma.document.findUnique({ where: { id: params.documentId } });
  } else if (params.slug) {
    document = await prisma.document.findUnique({ where: { slug: params.slug } });
  }

  const proposal = await prisma.knowledgeEvolution.create({
    data: {
      documentId: document?.id || null,
      oldContent: document?.content || params.oldContent || null,
      newContent: params.newContent,
      changeReason: params.changeReason,
      confidence: params.confidence,
      source: params.source || "bee_research",
      status: "proposed",
    },
  });

  return {
    proposal,
    hasConflict: document ? document.content !== params.newContent : false,
    documentTitle: document?.title || "Yeni Bilgi",
  };
}

export async function approveKnowledgeUpdate(proposalId: string, approvedBy: string = "Patron") {
  const proposal = await prisma.knowledgeEvolution.update({
    where: { id: proposalId },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedBy,
    },
  });

  if (proposal.documentId) {
    await prisma.document.update({
      where: { id: proposal.documentId },
      data: { content: proposal.newContent },
    });
  }

  return proposal;
}

export async function rejectKnowledgeUpdate(proposalId: string, approvedBy: string = "Patron") {
  return prisma.knowledgeEvolution.update({
    where: { id: proposalId },
    data: {
      status: "rejected",
      approvedAt: new Date(),
      approvedBy,
    },
  });
}

export async function getPendingProposals() {
  return prisma.knowledgeEvolution.findMany({
    where: { status: "proposed" },
    orderBy: { proposedAt: "desc" },
    include: { document: true },
  });
}