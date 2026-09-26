const shortMonthDayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const shortMonthDayYearFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeTime(isoString: string): string {
  const timestamp = parseDate(isoString);
  if (!timestamp) {
    return "";
  }

  const diffSeconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
  if (diffSeconds < 0) {
    return timestamp.getFullYear() === new Date().getFullYear()
      ? shortMonthDayFormatter.format(timestamp)
      : shortMonthDayYearFormatter.format(timestamp);
  }

  if (diffSeconds < 60) {
    return "just now";
  }

  if (diffSeconds < 3_600) {
    return `${Math.floor(diffSeconds / 60)}m ago`;
  }

  if (diffSeconds < 86_400) {
    return `${Math.floor(diffSeconds / 3_600)}h ago`;
  }

  if (diffSeconds < 604_800) {
    return `${Math.floor(diffSeconds / 86_400)}d ago`;
  }

  return timestamp.getFullYear() === new Date().getFullYear()
    ? shortMonthDayFormatter.format(timestamp)
    : shortMonthDayYearFormatter.format(timestamp);
}

export function formatMonthDay(isoString: string): string {
  const timestamp = parseDate(isoString);
  return timestamp ? shortMonthDayFormatter.format(timestamp) : "";
}

export function formatLongDate(isoString: string): string {
  const timestamp = parseDate(isoString);
  return timestamp ? longDateFormatter.format(timestamp) : "";
}
