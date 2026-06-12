type ExtractedAssignment = {
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

const DATE_PATTERNS = [
  /\b(?<month>\d{1,2})[/-](?<day>\d{1,2})(?:[/-](?<year>\d{2,4}))?\b/g,
  /\b(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})\b/g,
  /\b(?<monthName>jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(?<day>\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(?<year>\d{4}))?\b/gi,
  /\b(?<day>\d{1,2})(?:st|nd|rd|th)?\s+(?<monthName>jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\.|,)?(?:\s+(?<year>\d{4}))?\b/gi,
];

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
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

function findDates(line: string) {
  const matches: { raw: string; date: Date }[] = [];

  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of line.matchAll(pattern)) {
      const date = parseDateFromMatch(match.groups ?? {});
      if (date) matches.push({ raw: match[0], date });
    }
  }

  return matches;
}

function inferType(text: string): ExtractedAssignment["type"] {
  const lower = text.toLowerCase();
  if (/\b(exam|midterm|final)\b/.test(lower)) return "exam";
  if (/\bquiz\b/.test(lower)) return "quiz";
  if (/\b(project|presentation|paper|essay)\b/.test(lower)) return "project";
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

function cleanTitle(line: string, rawDate: string) {
  return line
    .replace(rawDate, " ")
    .replace(/\b(due|deadline|date|available|opens?|closes?|by|on)\b/gi, " ")
    .replace(/\b(at|before)\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, " ")
    .replace(/^[\s:;,\-–—|•*]+|[\s:;,\-–—|]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function usefulFallbackTitle(lines: string[], index: number) {
  const candidates = [
    lines[index - 1],
    lines[index + 1],
    lines[index - 2],
    lines[index + 2],
  ].filter(Boolean);

  return (
    candidates.find((candidate) =>
      /\b(assignment|homework|hw|quiz|exam|midterm|final|project|paper|essay|lab|problem set|pset)\b/i.test(
        candidate,
      ),
    ) ?? candidates.find((candidate) => candidate.length > 5)
  );
}

export function extractAssignmentsFromText(text: string): ExtractedAssignment[] {
  const normalized = normalizeText(text);
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const extracted: ExtractedAssignment[] = [];
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    const looksLikeDeadline =
      /\b(due|deadline|assignment|homework|hw|quiz|exam|midterm|final|project|paper|essay|lab|problem set|pset)\b/.test(
        lower,
      );
    const dates = findDates(line);

    if (!looksLikeDeadline || dates.length === 0) return;

    for (const match of dates) {
      let title = cleanTitle(line, match.raw);
      if (title.length < 4 || /^\d+$/.test(title)) {
        title = usefulFallbackTitle(lines, index) ?? title;
      }

      title = title
        .replace(/\b(due|deadline|date)\b/gi, "")
        .replace(/^[\s:;,\-–—|•*]+|[\s:;,\-–—|]+$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      if (title.length < 4) title = `Imported assignment due ${match.raw}`;

      const type = inferType(`${title} ${line}`);
      const key = `${title.toLowerCase()}-${match.date.toISOString().slice(0, 10)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      extracted.push({
        title,
        type,
        dueDate: match.date,
        priority: inferPriority(type, match.date),
        sourceLine: line,
      });
    }
  });

  return extracted
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 100);
}
