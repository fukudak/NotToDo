import { join } from "path";
import type { UserPlan } from "../domain/types.ts";

const DATA_DIR = join(import.meta.dir, "../../data");
const PLAN_FILE = join(DATA_DIR, "plans.json");

export interface PlansData {
  plans: UserPlan[];
}

export async function readPlans(): Promise<PlansData> {
  const file = Bun.file(PLAN_FILE);
  const exists = await file.exists();
  if (!exists) {
    return { plans: [] };
  }
  const text = await file.text();
  return JSON.parse(text) as PlansData;
}

export async function writePlans(data: PlansData): Promise<void> {
  const fs = await import("fs/promises");
  await fs.mkdir(DATA_DIR, { recursive: true });
  await Bun.write(PLAN_FILE, JSON.stringify(data, null, 2));
}
