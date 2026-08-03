import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const GODOT_PATH = "C:/Godot/Godot_v4.7.1-stable_win64.exe";

export interface GodotResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function createGodotProject(projectName: string, projectPath: string): Promise<GodotResult> {
  try {
    const fullPath = `${projectPath}/${projectName}`;
    const { stdout } = await execAsync(`mkdir -p "${fullPath}" && "${GODOT_PATH}" --headless --path "${fullPath}" --quit`);
    return { success: true, output: stdout };
  } catch (error: any) {
    return { success: false, output: "", error: error.stderr || error.message };
  }
}

export async function runGodotScript(scriptPath: string): Promise<GodotResult> {
  try {
    const { stdout } = await execAsync(`"${GODOT_PATH}" --headless --script "${scriptPath}" --quit`);
    return { success: true, output: stdout };
  } catch (error: any) {
    return { success: false, output: "", error: error.stderr || error.message };
  }
}

export async function exportGodotProject(projectPath: string, preset: string, outputPath: string): Promise<GodotResult> {
  try {
    const { stdout } = await execAsync(`"${GODOT_PATH}" --headless --path "${projectPath}" --export-release "${preset}" "${outputPath}" --quit`);
    return { success: true, output: stdout };
  } catch (error: any) {
    return { success: false, output: "", error: error.stderr || error.message };
  }
}

export async function getGodotVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync(`"${GODOT_PATH}" --version`);
    return stdout.trim();
  } catch {
    return "Unknown";
  }
}