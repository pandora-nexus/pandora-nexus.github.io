import fs from "fs";
import path from "path";

const LOCKDOWN_FILE = path.join(process.cwd(), "data", "lockdown.json");

function ensureDataDir() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLockdown(): { emergencyMode: boolean; lockdownReason: string } {
  try {
    ensureDataDir();
    if (fs.existsSync(LOCKDOWN_FILE)) {
      const data = fs.readFileSync(LOCKDOWN_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch {}
  return { emergencyMode: false, lockdownReason: "" };
}

function writeLockdown(data: { emergencyMode: boolean; lockdownReason: string }) {
  ensureDataDir();
  fs.writeFileSync(LOCKDOWN_FILE, JSON.stringify(data, null, 2));
}

export function isEmergencyMode() {
  return readLockdown().emergencyMode;
}

export function getLockdownReason() {
  return readLockdown().lockdownReason;
}

export function activateLockdown(reason: string) {
  writeLockdown({ emergencyMode: true, lockdownReason: reason || "Founder initiated lockdown" });
}

export function deactivateLockdown() {
  writeLockdown({ emergencyMode: false, lockdownReason: "" });
}