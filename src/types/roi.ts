export type RoiInputs = {
  developers: number;
  avgYearlyLoadedCost: number;

  // TicketOps / Self-service
  ticketsPerDevPerMonth: number;
  avgHandlingTimeHours: number;
  pctTicketsMigrated: number; // UI: 0-100

  // Onboarding
  devsOnboardedPerYear: number;
  timeToOnboardWeeks: number;
  onboardingEfficiencyGainPct: number; // UI: 0-100
  seniorEngineerTimePerNewDevHours: number;

  // Efficiency
  nonCoreTimePerDevPerMonthHours: number;
  efficiencyGainPct: number; // UI: 0-100

  // Agentic workflows
  agenticWorkflowsLive: number;
  timeSavedPerWorkflowTriggerHours: number;
  workflowTriggersPerDevPerMonth: number;
};

export type UseCaseResult = {
  hoursSaved: number;
  dollarsSaved: number;
};

export type RoiAssumptions = {
  licenseCost: number;
  portFte: number;
  launchOffset: number;
  adoptionMonths: number;
};

export type RoiMonthlyPoint = {
  month: number;
  roi: number;
};

export type RoiResult = {
  totals: {
    hoursSaved: number;
    dollarsSaved: number;
  };
  breakdown: {
    ticketops: UseCaseResult;
    onboarding: UseCaseResult;
    efficiency: UseCaseResult;
    agentic: UseCaseResult;
  };
  monthly: RoiMonthlyPoint[];
  assumptions: RoiAssumptions;
};
