type FocusBlock = {
  id: string;
  userId: string;

  goal: string;

  scheduledStart: Date;
  scheduledEnd: Date;

  actualStart?: Date;
  actualEnd?: Date;

  status: "scheduled" | "active" | "completed" | "cancelled" | "abandoned";

  plannedDuration: number; // minutes
  actualDuration?: number; // minutes

  checkIns: {
    timestamp: Date;
    result: "yes" | "no" | "missed";
  }[];

  focusQuality?: number;      // 0 - 1
  completionRatio?: number;   // 0 - 1
  finalScore?: number;        // 0 - 100

  createdAt: Date;
};
