import { NextResponse } from "next/server";
import { getPendingProposals, approveKnowledgeUpdate, rejectKnowledgeUpdate, proposeKnowledgeUpdate } from "@/lib/knowledge-evolution";

export async function GET() {
  const proposals = await getPendingProposals();
  return NextResponse.json(proposals);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  if (body.action === "approve" && body.proposalId) {
    const result = await approveKnowledgeUpdate(body.proposalId);
    return NextResponse.json({ status: "approved", result });
  }
  
  if (body.action === "reject" && body.proposalId) {
    const result = await rejectKnowledgeUpdate(body.proposalId);
    return NextResponse.json({ status: "rejected", result });
  }
  
  if (body.action === "propose") {
    const result = await proposeKnowledgeUpdate(body);
    return NextResponse.json({ status: "proposed", result });
  }
  
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}