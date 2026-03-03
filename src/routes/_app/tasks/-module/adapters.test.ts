import { describe, expect, it } from "vitest";
import {
  normalizeTaskDetail,
  normalizeTaskHistoryEntry,
  normalizeTaskMachine,
  normalizeTaskStatus,
} from "./adapters";

describe("tasks adapters", () => {
  it("normalizes task status with snake_case fields", () => {
    const normalized = normalizeTaskStatus({
      task_id: 42,
      status: "running",
      owner_id: 9,
      name: "SealSDR",
      posted_at: "2026-03-02T08:00:00Z",
    });

    expect(normalized).toEqual({
      taskId: 42,
      status: "running",
      ownerId: 9,
      name: "SealSDR",
      postedAt: "2026-03-02T08:00:00Z",
    });
  });

  it("normalizes task machine when API uses PascalCase fields", () => {
    const normalized = normalizeTaskMachine({
      MachineID: 7,
      Name: "worker-07",
      MachineAddr: "10.0.0.7:4701",
      Actors: "f01234,f04567",
    });

    expect(normalized.machineId).toBe(7);
    expect(normalized.name).toBe("worker-07");
    expect(normalized.address).toBe("10.0.0.7:4701");
    expect(normalized.actors).toBe("f01234,f04567");
  });

  it("normalizes task machine when API uses snake_case fields", () => {
    const normalized = normalizeTaskMachine({
      machine_id: 11,
      machine_name: "worker-11",
      host_and_port: "10.0.0.11:4701",
      miners: "f09999",
    });

    expect(normalized.machineId).toBe(11);
    expect(normalized.name).toBe("worker-11");
    expect(normalized.address).toBe("10.0.0.11:4701");
    expect(normalized.actors).toBe("f09999");
  });

  it("computes duration for history entry when Took is missing", () => {
    const normalized = normalizeTaskHistoryEntry({
      ID: 99,
      TaskID: 555,
      Name: "TreeRC",
      WorkStart: "2026-03-02T08:00:00Z",
      WorkEnd: "2026-03-02T08:00:07Z",
      Posted: "2026-03-02T07:59:50Z",
      Result: false,
      Err: "worker timeout",
      CompletedBy: "worker-01",
      CompletedById: 1,
      CompletedByName: "worker-01",
      Events: [],
    });

    expect(normalized.took).toBe("7s");
    expect(normalized.result).toBe(false);
    expect(normalized.err).toBe("worker timeout");
  });

  it("drops unsafe integer identifiers instead of keeping imprecise values", () => {
    const normalized = normalizeTaskDetail({
      ID: Number.MAX_SAFE_INTEGER + 1,
      Name: "TreeRC",
      UpdateTime: "2026-03-02T08:00:07Z",
      PostedTime: "2026-03-02T08:00:00Z",
      OwnerID: 1,
      OwnerAddr: "10.0.0.1:4701",
      OwnerName: "worker-01",
    });

    expect(normalized.id).toBe(0);
  });
});
