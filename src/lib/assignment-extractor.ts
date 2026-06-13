export type ExtractedAssignment = {
  title: string;
  type: "assignment" | "exam" | "quiz" | "project";
  dueDate: Date;
  priority: "low" | "medium" | "high";
  sourceLine: string;
};

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const WEEKDAYS =
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;

const ASSIGNMENT_KEYWORDS =
  /\b(assignment|homework|hw|quiz|exam|midterm|final|project|paper|essay|lab|problem set|pset|discussion|reading|report|presentation|deliverable|module|unit|chapter|test|portfolio|reflection|worksheet|activity|checkpoint|milestone)\b/i;

const DATE_PATTERNS = [
  /\b(?<month>\d{1,2})[/-](?<day>\d{1,2})(?:[/-](?<year>\d{2,4}))?\b/g,
  /\b(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})\b/g,
  /\b(?<weekday>monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+(?<monthName>jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(?<day>\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(?<year>\d{4}))?\b/gi,
  /\b(?<monthName>jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(?<day>\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(?<year>\d{4}))?\b/gi,
  /\b(?<day>\d{1,2})(?:st|nd|rd|th)?\s+(?<monthName>jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\.|,)?(?:\s+(?<year>\d{4}))?\b/gi,
];

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeYear(rawYear: string | undefined, month: number, day: number) {
  const now = new Date();
  if (rawYear) {
    const numeric = Number(rawYear);
    return numeric < 100 ? 2000 + numeric : numeric;
  }

  let year = now.getFullYear();
  const date = new Date(year, month, day, 23, 59, 0, 0);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  if (date < sixMonthsAgo) year += 1;
  return year;
}

function parseDateFromMatch(groups: Record<string, string | undefined>) {
  const day = Number(groups.day);
  let month: number;

  if (groups.monthName) {
    month = MONTHS[groups.monthName.toLowerCase().replace(".", "")];
  } else {
    month = Number(groups.month) - 1;
  }

  if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
  const year = normalizeYear(groups.year, month, day);
  const date = new Date(year, month, day, 23, 59, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function isSpuriousDayFirstMatch(line: string, match: RegExpMatchArray) {
  const index = match.index ?? 0;
  const prefix = line.slice(Math.max(0, index - 24), index).toLowerCase();
  return /\b(homework|hw|week|assignment|chapter|unit|module|part|page|quiz|exam|lab|problem|reading|lesson|step|#)\s*$/i.test(
    prefix,
  );
}

function scoreDateMatch(raw: string, line: string) {
  let score = raw.length;
  if (/^\d{1,2}[/-]\d{1,2}/.test(raw)) score += 4;
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(raw)) score += 4;
  if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(raw))
    score += 3;
  if (ASSIGNMENT_KEYWORDS.test(line) && !ASSIGNMENT_KEYWORDS.test(raw)) score += 1;
  return score;
}

function findDates(line: string) {
  const matches: { raw: string; date: Date; index: number; score: number }[] =
    [];

  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of line.matchAll(pattern)) {
      if (pattern.source.includes("day") && isSpuriousDayFirstMatch(line, match)) {
        continue;
      }

      const date = parseDateFromMatch(match.groups ?? {});
      if (date) {
        const raw = match[0];
        matches.push({
          raw,
          date,
          index: match.index ?? 0,
          score: scoreDateMatch(raw, line),
        });
      }
    }
  }

  const sorted = matches.sort((a, b) => b.score - a.score || a.index - b.index);
  const deduped: typeof matches = [];

  for (const match of sorted) {
    const duplicate = deduped.some(
      (existing) =>
        existing.date.getTime() === match.date.getTime() ||
        existing.raw === match.raw,
    );
    if (!duplicate) deduped.push(match);
  }

  return deduped.sort((a, b) => a.index - b.index);
}

function inferType(text: string): ExtractedAssignment["type"] {
  const lower = text.toLowerCase();
  if (/\b(exam|midterm|final)\b/.test(lower)) return "exam";
  if (/\bquiz\b/.test(lower)) return "quiz";
  if (/\b(project|presentation|paper|essay|portfolio|report)\b/.test(lower))
    return "project";
  return "assignment";
}

function inferPriority(type: ExtractedAssignment["type"], dueDate: Date) {
  const daysAway = Math.ceil(
    (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (type === "exam" || daysAway <= 3) return "high";
  if (type === "project" || daysAway <= 7) return "medium";
  return "low";
}

function cleanTitle(raw: string) {
  return raw
    .replace(/\t/g, " ")
    .replace(WEEKDAYS, " ")
    .replace(/\b(due|deadline|date|available|opens?|closes?|by|on|at|before)\b/gi, " ")
    .replace(/\b(at|before)\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, " ")
    .replace(/\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi, " ")
    .replace(/^[\s:;,\-–—|•*]+|[\s:;,\-–—|]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const EXACT_HEADER_LABELS =
  /^(date|due(?:\s+date)?|deadline|assignment(?:\s+name)?|activity|topic|week|module|item|points|weight|grade|description|title|name)$/i;

function isHeaderLine(line: string) {
  const lower = line.toLowerCase().trim();
  if (EXACT_HEADER_LABELS.test(lower)) return true;

  const cells = splitRow(line);
  if (cells.length >= 2) {
    const headerHits = cells.filter((cell) => EXACT_HEADER_LABELS.test(cell.trim())).length;
    const hasDates = cells.some((cell) => findDates(cell).length > 0);
    if (headerHits >= 2 && !hasDates) return true;
  }

  return false;
}

function isNoiseLine(line: string) {
  const lower = line.toLowerCase();
  if (line.length < 3) return true;
  if (/^(page \d+|copyright|all rights reserved)/i.test(lower)) return true;
  if (/^https?:\/\//i.test(line)) return true;
  return false;
}

function isWeightCell(cell: string) {
  return /^\d+(\.\d+)?%?$/.test(cell.trim());
}

function splitRow(line: string) {
  if (line.includes("\t")) {
    return line.split("\t").map((cell) => cell.trim()).filter(Boolean);
  }
  if (line.includes("|")) {
    return line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell && !/^[-:]+$/.test(cell));
  }
  if (/\s{2,}/.test(line)) {
    return line.split(/\s{2,}/).map((cell) => cell.trim()).filter(Boolean);
  }
  return [line.trim()];
}

function titleFromContext(line: string, rawDate: string, lines: string[], index: number) {
  let title = cleanTitle(line.replace(rawDate, " "));

  if (
    title.length >= 4 &&
    !/^\d+$/.test(title) &&
    (ASSIGNMENT_KEYWORDS.test(title) || !/\b(due|deadline)\b/i.test(title))
  ) {
    return title;
  }

  const dateFirst = line.match(
    /^(?<prefix>.*?\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+)?(?<date>.+?)(?:\s*[-–—:]\s*|\s+-\s+)(?<title>.+)$/i,
  );
  if (dateFirst?.groups?.title) {
    title = cleanTitle(dateFirst.groups.title);
    if (title.length >= 4) return title;
  }

  const dueMatch = line.match(
    /^(?<title>.+?)\s*(?:[-–—:]\s*)?\b(?:due|deadline)\b[:\s]*/i,
  );
  if (dueMatch?.groups?.title) {
    title = cleanTitle(dueMatch.groups.title);
    if (title.length >= 4) return title;
  }

  const candidates = [
    lines[index - 1],
    lines[index + 1],
    lines[index - 2],
    lines[index + 2],
  ].filter((candidate) => candidate && !isNoiseLine(candidate));

  const keywordCandidate = candidates.find(
    (candidate) =>
      ASSIGNMENT_KEYWORDS.test(candidate) && findDates(candidate).length === 0,
  );
  if (keywordCandidate) return cleanTitle(keywordCandidate);

  const genericCandidate = candidates.find(
    (candidate) =>
      candidate.length > 5 &&
      !isHeaderLine(candidate) &&
      findDates(candidate).length === 0,
  );
  if (genericCandidate) return cleanTitle(genericCandidate);

  if (title.length >= 4 && !/^\d+$/.test(title)) return title;
  if (ASSIGNMENT_KEYWORDS.test(line)) {
    const keywordMatch = line.match(
      /(?:assignment|homework|hw|quiz|exam|midterm|final|project|paper|essay|lab|report|presentation)\s*[^|\t\n]*/i,
    );
    if (keywordMatch) {
      title = cleanTitle(keywordMatch[0]);
      if (title.length >= 4) return title;
    }
  }
  return `Assignment due ${rawDate}`;
}

function addAssignment(
  extracted: ExtractedAssignment[],
  seen: Set<string>,
  title: string,
  dueDate: Date,
  sourceLine: string,
) {
  const cleaned = cleanTitle(title);
  if (cleaned.length < 3 || isHeaderLine(cleaned)) return;

  const type = inferType(`${cleaned} ${sourceLine}`);
  const key = `${cleaned.toLowerCase()}-${dueDate.toISOString().slice(0, 10)}`;
  if (seen.has(key)) return;
  seen.add(key);

  extracted.push({
    title: cleaned,
    type,
    dueDate,
    priority: inferPriority(type, dueDate),
    sourceLine,
  });
}

const SCHEDULE_LABEL =
  /^(introduction|overview|review|lecture|discussion|no class|holiday|break|spring break|thanksgiving|reading day)$/i;

function isScheduleLabel(text: string) {
  const cleaned = cleanTitle(text);
  if (SCHEDULE_LABEL.test(cleaned) || /^module\s*\d+$/i.test(cleaned)) {
    return true;
  }
  if (/^week\s*\d+$/i.test(cleaned)) return true;
  return /^week\s*\d+\b/i.test(cleaned) && !ASSIGNMENT_KEYWORDS.test(cleaned);
}

function extractFromTableRows(lines: string[]) {
  const extracted: ExtractedAssignment[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isNoiseLine(line) || isHeaderLine(line)) continue;

    const cells = splitRow(line);
    if (cells.length < 2) continue;

    const datedCells = cells
      .map((cell, cellIndex) => ({
        cell,
        cellIndex,
        dates: findDates(cell),
      }))
      .filter((entry) => entry.dates.length > 0);

    if (datedCells.length === 0) continue;

    const dateEntry = datedCells[0];
    const date = dateEntry.dates[0];

    const titleCells = cells.filter(
      (_, cellIndex) => cellIndex !== dateEntry.cellIndex,
    );
    const titleCandidate =
      titleCells.find(
        (cell) => ASSIGNMENT_KEYWORDS.test(cell) && !isWeightCell(cell),
      ) ??
      titleCells.find(
        (cell) =>
          !isWeightCell(cell) &&
          cell.length > 2 &&
          !/^\d+$/.test(cell) &&
          !/^week\s*\d+$/i.test(cell),
      ) ??
      titleCells.find((cell) => !isWeightCell(cell));

    if (!titleCandidate) continue;

    const datedCellLooksLikeDue =
      /^(due|deadline|date)\b/i.test(dateEntry.cell) ||
      findDates(dateEntry.cell).length > 0;

    if (isScheduleLabel(titleCandidate) && !ASSIGNMENT_KEYWORDS.test(titleCandidate)) {
      continue;
    }

    if (!datedCellLooksLikeDue && !ASSIGNMENT_KEYWORDS.test(titleCandidate)) {
      continue;
    }

    addAssignment(extracted, seen, titleCandidate, date.date, line);
  }

  return extracted;
}

function extractFromDeadlineLines(lines: string[]) {
  const extracted: ExtractedAssignment[] = [];
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    if (isNoiseLine(line) || isHeaderLine(line)) return;

    const dates = findDates(line);
    if (dates.length === 0) return;

    const lower = line.toLowerCase();
    const hasKeyword = ASSIGNMENT_KEYWORDS.test(lower);
    const hasDueWord = /\b(due|deadline|submit|turn in|deliverable)\b/.test(lower);
    const hasWeek = /\bweek\s*\d+\b/i.test(line);

    if (!hasKeyword && !hasDueWord && !hasWeek) return;

    for (const match of dates) {
      const title = titleFromContext(line, match.raw, lines, index);
      if (isScheduleLabel(title) && !ASSIGNMENT_KEYWORDS.test(title)) return;
      addAssignment(extracted, seen, title, match.date, line);
    }
  });

  return extracted;
}

function extractFromDateOnlyLines(lines: string[]) {
  const extracted: ExtractedAssignment[] = [];
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    if (isNoiseLine(line) || isHeaderLine(line)) return;

    const dates = findDates(line);
    if (dates.length !== 1) return;

    const withoutDate = cleanTitle(line.replace(dates[0].raw, " "));
    if (withoutDate.length > 3 && ASSIGNMENT_KEYWORDS.test(withoutDate)) {
      addAssignment(extracted, seen, withoutDate, dates[0].date, line);
      return;
    }

    const neighbors = [lines[index - 1], lines[index + 1]].filter(Boolean);
    const titleNeighbor = neighbors.find(
      (neighbor) =>
        ASSIGNMENT_KEYWORDS.test(neighbor) && findDates(neighbor).length === 0,
    );
    if (titleNeighbor) {
      addAssignment(extracted, seen, titleNeighbor, dates[0].date, line);
    }
  });

  return extracted;
}

function extractFromWeekBlocks(lines: string[]) {
  const extracted: ExtractedAssignment[] = [];
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    if (isNoiseLine(line)) return;

    const weekMatch = line.match(/\bweek\s*(?<num>\d+)\b/i);
    if (!weekMatch) return;

    const dates = findDates(line);
    if (dates.length === 0) return;

    const inlineTitle = cleanTitle(
      line
        .replace(weekMatch[0], " ")
        .replace(dates[0].raw, " "),
    );

    const title =
      inlineTitle.length >= 4 && ASSIGNMENT_KEYWORDS.test(inlineTitle)
        ? inlineTitle
        : titleFromContext(line, dates[0].raw, lines, index);

    if (isScheduleLabel(title) && !ASSIGNMENT_KEYWORDS.test(title)) return;

    addAssignment(extracted, seen, title, dates[0].date, line);
  });

  return extracted;
}

function normalizeTitleKey(title: string) {
  return title
    .toLowerCase()
    .replace(/[|\t]/g, " ")
    .replace(/\s+\d+(\.\d+)?%?$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function preferTitle(a: string, b: string) {
  const aKey = normalizeTitleKey(a);
  const bKey = normalizeTitleKey(b);
  if (aKey === bKey) return a.length <= b.length ? a : b;
  if (aKey.includes(bKey)) return b;
  if (bKey.includes(aKey)) return a;
  return a.length <= b.length ? a : b;
}

function mergeExtracted(groups: ExtractedAssignment[][]) {
  const merged: ExtractedAssignment[] = [];

  for (const group of groups) {
    for (const item of group) {
      const duplicateIndex = merged.findIndex((existing) => {
        const sameDate =
          existing.dueDate.toISOString().slice(0, 10) ===
          item.dueDate.toISOString().slice(0, 10);
        if (!sameDate) return false;

        const existingKey = normalizeTitleKey(existing.title);
        const itemKey = normalizeTitleKey(item.title);
        return (
          existingKey === itemKey ||
          existingKey.includes(itemKey) ||
          itemKey.includes(existingKey)
        );
      });

      if (duplicateIndex === -1) {
        merged.push(item);
        continue;
      }

      merged[duplicateIndex] = {
        ...merged[duplicateIndex],
        title: preferTitle(merged[duplicateIndex].title, item.title),
      };
    }
  }

  return merged
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 150);
}

export function extractAssignmentsFromText(text: string): ExtractedAssignment[] {
  const normalized = normalizeText(text);
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  return mergeExtracted([
    extractFromTableRows(lines),
    extractFromDeadlineLines(lines),
    extractFromDateOnlyLines(lines),
    extractFromWeekBlocks(lines),
  ]);
}

export function serializeExtractedAssignments(items: ExtractedAssignment[]) {
  return items.map((item) => ({
    title: item.title,
    type: item.type,
    dueDate: item.dueDate.toISOString(),
    priority: item.priority,
    sourceLine: item.sourceLine,
  }));
}
