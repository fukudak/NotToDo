import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotToDoData } from "../domain/types.ts";

vi.mock("../infrastructure/planRepository.ts", () => ({
  readPlans: vi.fn(),
  writePlans: vi.fn(),
}));

vi.mock("../infrastructure/dataRepository.ts", () => ({
  readData: vi.fn(),
  writeData: vi.fn(),
}));

import { readPlans } from "../infrastructure/planRepository.ts";
import { readData, writeData } from "../infrastructure/dataRepository.ts";
import { getPlan, PlanLimitError } from "../domain/planService.ts";
import { addItem } from "../domain/itemService.ts";

const mockedReadPlans = vi.mocked(readPlans);
const mockedReadData = vi.mocked(readData);
const mockedWriteData = vi.mocked(writeData);

const makeItem = (id: string, userId: "userA" | "userB" = "userA") => ({
  id,
  title: `item${id}`,
  reason: "理由",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  startDate: "2026-01-01",
  targetDays: 66,
  currentAttempt: 1,
  userId,
});

describe("planService", () => {
  beforeEach(() => {
    mockedReadPlans.mockReset();
    mockedReadData.mockReset();
    mockedWriteData.mockReset();
    mockedWriteData.mockResolvedValue(undefined);
  });

  describe("getPlan", () => {
    it("プランが未登録の場合、無料プラン（maxItems=3）をデフォルトで返す", async () => {
      mockedReadPlans.mockResolvedValue({ plans: [] });

      const plan = await getPlan("userA");

      expect(plan.userId).toBe("userA");
      expect(plan.plan).toBe("free");
      expect(plan.maxItems).toBe(3);
    });

    it("登録済みのプロプランを返す", async () => {
      mockedReadPlans.mockResolvedValue({
        plans: [{ userId: "userA", plan: "pro", maxItems: 9999 }],
      });

      const plan = await getPlan("userA");

      expect(plan.plan).toBe("pro");
      expect(plan.maxItems).toBe(9999);
    });

    it("別ユーザーのプランを正しく返す", async () => {
      mockedReadPlans.mockResolvedValue({
        plans: [
          { userId: "userA", plan: "free", maxItems: 3 },
          { userId: "userB", plan: "pro", maxItems: 9999 },
        ],
      });

      const planB = await getPlan("userB");

      expect(planB.plan).toBe("pro");
    });
  });
});

describe("addItem 件数制限", () => {
  beforeEach(() => {
    mockedReadPlans.mockReset();
    mockedReadData.mockReset();
    mockedWriteData.mockReset();
    mockedWriteData.mockResolvedValue(undefined);
  });

  it("無料版で3件に達したら PlanLimitError をスローする", async () => {
    mockedReadPlans.mockResolvedValue({ plans: [] }); // free, maxItems=3
    const store: NotToDoData = {
      items: [makeItem("1"), makeItem("2"), makeItem("3")],
      reviews: [],
    };
    mockedReadData.mockResolvedValue({ ...store });

    await expect(
      addItem({ title: "4件目", reason: "理由", userId: "userA" }),
    ).rejects.toThrow(PlanLimitError);

    expect(mockedWriteData).not.toHaveBeenCalled();
  });

  it("PlanLimitError のメッセージに maxItems が含まれる", async () => {
    mockedReadPlans.mockResolvedValue({ plans: [] }); // free, maxItems=3
    mockedReadData.mockResolvedValue({
      items: [makeItem("1"), makeItem("2"), makeItem("3")],
      reviews: [],
    });

    try {
      await addItem({ title: "4件目", reason: "理由", userId: "userA" });
      expect.fail("エラーがスローされるはず");
    } catch (e) {
      expect(e).toBeInstanceOf(PlanLimitError);
      expect((e as Error).message).toContain("3");
      expect((e as Error).message).toContain("アップグレード");
    }
  });

  it("無料版で3件未満なら追加できる", async () => {
    mockedReadPlans.mockResolvedValue({ plans: [] }); // free, maxItems=3
    mockedReadData.mockResolvedValue({
      items: [makeItem("1"), makeItem("2")],
      reviews: [],
    });

    const result = await addItem({ title: "3件目", reason: "理由", userId: "userA" });

    expect(result.title).toBe("3件目");
    expect(mockedWriteData).toHaveBeenCalledOnce();
  });

  it("有料版は100件超えても追加できる", async () => {
    mockedReadPlans.mockResolvedValue({
      plans: [{ userId: "userA", plan: "pro", maxItems: 9999 }],
    });
    mockedReadData.mockResolvedValue({
      items: Array.from({ length: 100 }, (_, i) => makeItem(String(i))),
      reviews: [],
    });

    const result = await addItem({ title: "101件目", reason: "理由", userId: "userA" });

    expect(result.title).toBe("101件目");
  });

  it("件数制限はユーザーごとに独立している（userBの件数はuserAの制限に影響しない）", async () => {
    mockedReadPlans.mockResolvedValue({ plans: [] }); // both free, maxItems=3
    mockedReadData.mockResolvedValue({
      items: [makeItem("1", "userB"), makeItem("2", "userB"), makeItem("3", "userB")],
      reviews: [],
    });

    // userA は 0件なので追加できる
    const result = await addItem({ title: "userAの1件目", reason: "理由", userId: "userA" });

    expect(result.title).toBe("userAの1件目");
  });
});
