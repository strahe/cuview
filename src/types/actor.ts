export interface ActorSummaryData {
  Address: string;
  CLayers: string[];
  QualityAdjustedPower: string;
  Deadlines: Deadline[];
  ActorBalance: string;
  ActorAvailable: string;
  Win1: number;
  Win7: number;
  Win30: number;
}

export interface DeadlineCount {
  Total: number;
  Active: number;
  Live: number;
  Fault: number;
  Recovering: number;
}

export interface Deadline {
  Current: boolean;
  Proven: boolean;
  PartFaulty: boolean;
  Faulty: boolean;
  Count?: DeadlineCount;
}
