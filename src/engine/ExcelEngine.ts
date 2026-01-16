import * as XLSX from 'xlsx';
import { HyperFormula } from 'hyperformula';
import type { RoiAssumptions, RoiInputs, RoiMonthlyPoint, RoiResult } from '../types/roi';

type PercentMode = 'fraction' | 'percent';

function colLettersToIndex(colLetters: string): number {
  let n = 0;
  for (const ch of colLetters.toUpperCase()) {
    if (ch < 'A' || ch > 'Z') throw new Error(`Invalid column: ${colLetters}`);
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1; // 0-based
}

function a1ToRowCol(a1: string): { row: number; col: number } {
  const m = /^([A-Za-z]+)(\d+)$/.exec(a1.trim());
  if (!m) throw new Error(`Invalid A1 address: ${a1}`);
  const col = colLettersToIndex(m[1]);
  const row = Number(m[2]) - 1;
  if (!Number.isFinite(row) || row < 0) throw new Error(`Invalid row in A1 address: ${a1}`);
  return { row, col };
}

function sheetTo2D(ws: XLSX.WorkSheet): (string | number | boolean | null)[][] {
  const ref = ws['!ref'] ?? 'A1';
  const range = XLSX.utils.decode_range(ref);
  const rows = range.e.r + 1;
  const cols = range.e.c + 1;
  const data: (string | number | boolean | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  for (const key of Object.keys(ws)) {
    if (key.startsWith('!')) continue;
    const cell = ws[key] as XLSX.CellObject;
    const addr = XLSX.utils.decode_cell(key);

    if (cell.f) {
      data[addr.r][addr.c] = `=${cell.f}`;
      continue;
    }

    const v = (cell as any).v;
    if (v === undefined || v === null) {
      data[addr.r][addr.c] = null;
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      data[addr.r][addr.c] = v;
    } else {
      data[addr.r][addr.c] = String(v);
    }
  }

  return data;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export class ExcelEngine {
  private hf: HyperFormula;
  private modelSheetId: number;

  private percentModes: Record<keyof Pick<
    RoiInputs,
    'pctTicketsMigrated' | 'onboardingEfficiencyGainPct' | 'efficiencyGainPct'
  >, PercentMode>;

  private constructor(hf: HyperFormula) {
    this.hf = hf;
    const modelSheetId = hf.getSheetId('RoI model');
    if (modelSheetId === undefined) {
      throw new Error('Workbook must contain sheet "RoI model"');
    }
    this.modelSheetId = modelSheetId;

    // Filled in by load() after reading defaults
    this.percentModes = {
      pctTicketsMigrated: 'percent',
      onboardingEfficiencyGainPct: 'percent',
      efficiencyGainPct: 'percent',
    };
  }

  static async load(url = '/roi_model_v2.xlsx'): Promise<ExcelEngine> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load workbook from ${url} (HTTP ${res.status})`);
    }
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });

    const sheets: Record<string, (string | number | boolean | null)[][]> = {};
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      if (!ws) continue;
      if (!ws['!ref']) continue;
      sheets[name] = sheetTo2D(ws);
    }
    if (!sheets['RoI model']) {
      throw new Error('Workbook must contain sheet "RoI model"');
    }

    const hf = HyperFormula.buildFromSheets(sheets, {
      licenseKey: 'gpl-v3',
    });

    const engine = new ExcelEngine(hf);

    // Detect percent storage mode by reading workbook defaults in those cells.
    const defaultPctTicketsMigrated = engine.readInputRaw('D17');
    const defaultOnboardingGain = engine.readInputRaw('F17');
    const defaultEfficiencyGain = engine.readInputRaw('H16');

    engine.percentModes = {
      pctTicketsMigrated: defaultPctTicketsMigrated <= 1 ? 'fraction' : 'percent',
      onboardingEfficiencyGainPct: defaultOnboardingGain <= 1 ? 'fraction' : 'percent',
      efficiencyGainPct: defaultEfficiencyGain <= 1 ? 'fraction' : 'percent',
    };

    return engine;
  }

  private addr(sheetId: number, a1: string) {
    const { row, col } = a1ToRowCol(a1);
    return { sheet: sheetId, row, col };
  }

  private readInputRaw(a1: string): number {
    const v = this.hf.getCellValue(this.addr(this.modelSheetId, a1));
    return asNumber(v, 0);
  }

  private readOutputRaw(a1: string): number {
    const v = this.hf.getCellValue(this.addr(this.modelSheetId, a1));
    return asNumber(v, 0);
  }

  private writeInputRaw(a1: string, value: string | number | boolean | null) {
    this.hf.setCellContents(this.addr(this.modelSheetId, a1), value);
  }

  private percentUiToRaw(key: keyof typeof this.percentModes, uiValue: number): number {
    const mode = this.percentModes[key];
    // UI always uses 0-100.
    return mode === 'fraction' ? uiValue / 100 : uiValue;
  }

  private percentRawToUi(key: keyof typeof this.percentModes, rawValue: number): number {
    const mode = this.percentModes[key];
    return mode === 'fraction' ? rawValue * 100 : rawValue;
  }

  getInitialState(): { inputs: RoiInputs; assumptions: RoiAssumptions } {
    const inputs: RoiInputs = {
      developers: this.readInputRaw('D5'),
      avgYearlyLoadedCost: this.readInputRaw('D6'),

      ticketsPerDevPerMonth: this.readInputRaw('D15'),
      avgHandlingTimeHours: this.readInputRaw('D16'),
      pctTicketsMigrated: this.percentRawToUi('pctTicketsMigrated', this.readInputRaw('D17')),

      devsOnboardedPerYear: this.readInputRaw('F15'),
      timeToOnboardWeeks: this.readInputRaw('F16'),
      onboardingEfficiencyGainPct: this.percentRawToUi('onboardingEfficiencyGainPct', this.readInputRaw('F17')),
      seniorEngineerTimePerNewDevHours: this.readInputRaw('F18'),

      nonCoreTimePerDevPerMonthHours: this.readInputRaw('H15'),
      efficiencyGainPct: this.percentRawToUi('efficiencyGainPct', this.readInputRaw('H16')),

      agenticWorkflowsLive: this.readInputRaw('J16'),
      timeSavedPerWorkflowTriggerHours: this.readInputRaw('J17'),
      workflowTriggersPerDevPerMonth: this.readInputRaw('J18'),
    };

    const assumptions: RoiAssumptions = {
      licenseCost: this.readInputRaw('L5'),
      portFte: this.readInputRaw('L6'),
      launchOffset: this.readInputRaw('L7'),
      adoptionMonths: this.readInputRaw('L8'),
    };

    return { inputs, assumptions };
  }

  calculate(inputs: RoiInputs, assumptions: RoiAssumptions): RoiResult {
    // Write inputs
    this.writeInputRaw('D5', inputs.developers);
    this.writeInputRaw('D6', inputs.avgYearlyLoadedCost);

    // TicketOps
    this.writeInputRaw('D15', inputs.ticketsPerDevPerMonth);
    this.writeInputRaw('D16', inputs.avgHandlingTimeHours);
    this.writeInputRaw('D17', this.percentUiToRaw('pctTicketsMigrated', inputs.pctTicketsMigrated));

    // Onboarding
    this.writeInputRaw('F15', inputs.devsOnboardedPerYear);
    this.writeInputRaw('F16', inputs.timeToOnboardWeeks);
    this.writeInputRaw('F17', this.percentUiToRaw('onboardingEfficiencyGainPct', inputs.onboardingEfficiencyGainPct));
    this.writeInputRaw('F18', inputs.seniorEngineerTimePerNewDevHours);

    // Efficiency
    this.writeInputRaw('H15', inputs.nonCoreTimePerDevPerMonthHours);
    this.writeInputRaw('H16', this.percentUiToRaw('efficiencyGainPct', inputs.efficiencyGainPct));

    // Agentic
    this.writeInputRaw('J16', inputs.agenticWorkflowsLive);
    this.writeInputRaw('J17', inputs.timeSavedPerWorkflowTriggerHours);
    this.writeInputRaw('J18', inputs.workflowTriggersPerDevPerMonth);

    // Assumptions (editable)
    this.writeInputRaw('L5', assumptions.licenseCost);
    this.writeInputRaw('L6', assumptions.portFte);
    this.writeInputRaw('L7', assumptions.launchOffset);
    this.writeInputRaw('L8', assumptions.adoptionMonths);

    // HyperFormula recalculates incrementally, but we still call recalc if available.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyHf = this.hf as any;
    if (typeof anyHf.recalculate === 'function') anyHf.recalculate();

    const breakdown: RoiResult['breakdown'] = {
      ticketops: {
        hoursSaved: this.readOutputRaw('D23'),
        dollarsSaved: this.readOutputRaw('D24'),
      },
      onboarding: {
        hoursSaved: this.readOutputRaw('F23'),
        dollarsSaved: this.readOutputRaw('F24'),
      },
      efficiency: {
        hoursSaved: this.readOutputRaw('H23'),
        dollarsSaved: this.readOutputRaw('H24'),
      },
      agentic: {
        hoursSaved: this.readOutputRaw('J23'),
        dollarsSaved: this.readOutputRaw('J24'),
      },
    };

    const totals = {
      hoursSaved:
        breakdown.ticketops.hoursSaved +
        breakdown.onboarding.hoursSaved +
        breakdown.efficiency.hoursSaved +
        breakdown.agentic.hoursSaved,
      dollarsSaved:
        breakdown.ticketops.dollarsSaved +
        breakdown.onboarding.dollarsSaved +
        breakdown.efficiency.dollarsSaved +
        breakdown.agentic.dollarsSaved,
    };

    const nextAssumptions: RoiAssumptions = {
      licenseCost: this.readInputRaw('L5'),
      portFte: this.readInputRaw('L6'),
      launchOffset: this.readInputRaw('L7'),
      adoptionMonths: this.readInputRaw('L8'),
    };

    // Monthly series (36 points): months in O4..AX4, cumulative ROI in O7..AX7
    const monthly: RoiMonthlyPoint[] = [];
    const startCol = colLettersToIndex('O'); // 14
    const endCol = colLettersToIndex('AX'); // 49

    for (let col = startCol; col <= endCol; col++) {
      const idx = col - startCol;
      const monthValue = this.hf.getCellValue({ sheet: this.modelSheetId, row: 3, col }); // row 4
      const roiValue = this.hf.getCellValue({ sheet: this.modelSheetId, row: 6, col }); // row 7
      const month = asNumber(monthValue, idx + 1);
      const roi = asNumber(roiValue, 0);
      monthly.push({ month, roi });
    }

    return { totals, breakdown, monthly, assumptions: nextAssumptions };
  }
}

export function validateInputs(inputs: RoiInputs): string[] {
  const errs: string[] = [];
  const nonNeg = (k: keyof RoiInputs, label: string) => {
    const v = inputs[k];
    if (!Number.isFinite(v)) errs.push(`${label} must be a number.`);
    else if (v < 0) errs.push(`${label} must be ≥ 0.`);
  };

  nonNeg('developers', 'Number of developers');
  nonNeg('avgYearlyLoadedCost', 'Average developer loaded cost (yearly) ($)');

  nonNeg('ticketsPerDevPerMonth', 'Tickets opened per dev per month');
  nonNeg('avgHandlingTimeHours', 'Average handling time per ticket (hours)');
  nonNeg('pctTicketsMigrated', '% tickets migrated to self-service');
  if (Number.isFinite(inputs.pctTicketsMigrated) && (inputs.pctTicketsMigrated < 0 || inputs.pctTicketsMigrated > 100)) {
    errs.push('% tickets migrated must be between 0 and 100.');
  }

  nonNeg('devsOnboardedPerYear', 'Devs onboarded per year');
  nonNeg('timeToOnboardWeeks', 'Time required to onboard a new developer (weeks)');
  nonNeg('onboardingEfficiencyGainPct', 'Accelerated developer onboarding gain (%)');
  if (
    Number.isFinite(inputs.onboardingEfficiencyGainPct) &&
    (inputs.onboardingEfficiencyGainPct < 0 || inputs.onboardingEfficiencyGainPct > 90)
  ) {
    errs.push('Accelerated developer onboarding gain must be between 0 and 90.');
  }
  nonNeg('seniorEngineerTimePerNewDevHours', 'Senior engineer time per new dev (hours)');

  nonNeg('nonCoreTimePerDevPerMonthHours', 'Non-core time per dev per month (hrs)');
  nonNeg('efficiencyGainPct', 'Efficiency gain with Port (%)');
  if (Number.isFinite(inputs.efficiencyGainPct) && (inputs.efficiencyGainPct < 0 || inputs.efficiencyGainPct > 100)) {
    errs.push('Efficiency gain must be between 0 and 100.');
  }

  nonNeg('agenticWorkflowsLive', '# agentic workflows live');
  nonNeg('timeSavedPerWorkflowTriggerHours', 'Time saved per workflow trigger (hrs)');
  nonNeg('workflowTriggersPerDevPerMonth', 'Workflow triggers per dev per month');

  return errs;
}

export function validateAssumptions(a: RoiAssumptions): string[] {
  const errs: string[] = [];
  const nonNeg = (v: number, label: string) => {
    if (!Number.isFinite(v)) errs.push(`${label} must be a number.`);
    else if (v < 0) errs.push(`${label} must be ≥ 0.`);
  };

  nonNeg(a.licenseCost, 'Yearly license cost');
  nonNeg(a.portFte, 'Full Time Engineers dedicated to IDP');
  nonNeg(a.launchOffset, 'launch offset (months)');
  nonNeg(a.adoptionMonths, 'Months to reach 100% adoption');

  return errs;
}
