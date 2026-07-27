import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let emergencyMode = false;
let lockdownReason = "";

export async function GET() {
  return NextResponse.json({
    emergencyMode,
    lockdownReason,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, reason } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    switch (action) {
      case "lockdown":
        emergencyMode = true;
        lockdownReason = reason || "Founder initiated lockdown";
        
        // Log'a kaydet
        await prisma.learning.create({
          data: {
            category: "emergency",
            title: `EMERGENCY LOCKDOWN: ${lockdownReason}`,
            description: `System locked down at ${new Date().toISOString()}`,
            source: "founder",
          },
        });
        
        return NextResponse.json({
          status: "LOCKDOWN",
          reason: lockdownReason,
          timestamp: new Date().toISOString(),
        });

      case "unlock":
        emergencyMode = false;
        lockdownReason = "";
        
        await prisma.learning.create({
          data: {
            category: "emergency",
            title: "EMERGENCY LOCKDOWN LIFTED",
            description: `System unlocked at ${new Date().toISOString()}`,
            source: "founder",
          },
        });
        
        return NextResponse.json({
          status: "UNLOCKED",
          timestamp: new Date().toISOString(),
        });

      case "status":
        return NextResponse.json({
          emergencyMode,
          lockdownReason,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Emergency action failed", details: String(error) },
      { status: 500 }
    );
  }
}

export function isEmergencyMode() {
  return emergencyMode;
}