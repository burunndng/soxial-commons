import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNowStrict } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAge(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const str = formatDistanceToNowStrict(d, { addSuffix: false });
    return str
      .replace(" seconds", "s")
      .replace(" second", "s")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" hours", "h")
      .replace(" hour", "h")
      .replace(" days", "d")
      .replace(" day", "d")
      .replace(" months", "mo")
      .replace(" month", "mo")
      .replace(" years", "y")
      .replace(" year", "y");
  } catch {
    return "";
  }
}

export const COMMUNITY_META: Record<string, { icon: string; accentColor?: string }> = {
  technology: { icon: "cpu" },
  design: { icon: "palette" },
  science: { icon: "flask-conical" },
  books: { icon: "book-open" },
  general: { icon: "message-circle" },
};
