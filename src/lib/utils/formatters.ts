import { format, formatDistanceToNow, isToday, isPast, isTomorrow, parseISO } from 'date-fns';

/**
 * Format any timestamp or date into a clean display string
 */
export function formatCRMDate(dateInput: any, formatPattern: string = 'dd MMM yyyy'): string {
  if (!dateInput) return '—';
  try {
    let date: Date;
    if (typeof dateInput === 'string') {
      date = parseISO(dateInput);
    } else if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (dateInput?.seconds) {
      date = new Date(dateInput.seconds * 1000);
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return '—';
    return format(date, formatPattern);
  } catch (err) {
    return '—';
  }
}

/**
 * Format relative time (e.g. "2 hours ago", "In 3 days")
 */
export function formatRelativeTime(dateInput: any): string {
  if (!dateInput) return 'Never';
  try {
    let date: Date;
    if (typeof dateInput === 'string') {
      date = parseISO(dateInput);
    } else if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (dateInput?.seconds) {
      date = new Date(dateInput.seconds * 1000);
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return '—';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (err) {
    return '—';
  }
}

/**
 * Format Indian Phone Numbers nicely (+91 98765 43210)
 */
export function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  } else if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return phone;
}

/**
 * Generate a WhatsApp Web/App direct link
 */
export function getWhatsAppLink(phone: string | undefined, message?: string): string {
  if (!phone) return '#';
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    clean = `91${clean}`;
  }
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${textParam}`;
}

/**
 * Generate a Tel link for instant calling
 */
export function getTelLink(phone: string | undefined): string {
  if (!phone) return '#';
  return `tel:${phone.replace(/\s+/g, '')}`;
}

/**
 * Helper to check if a follow-up date is overdue
 */
export function isFollowUpOverdue(dateInput: any): boolean {
  if (!dateInput) return false;
  try {
    let date: Date;
    if (dateInput?.toDate) date = dateInput.toDate();
    else if (dateInput?.seconds) date = new Date(dateInput.seconds * 1000);
    else date = new Date(dateInput);

    return isPast(date) && !isToday(date);
  } catch {
    return false;
  }
}

/**
 * Helper to check if a date is today
 */
export function isFollowUpToday(dateInput: any): boolean {
  if (!dateInput) return false;
  try {
    let date: Date;
    if (dateInput?.toDate) date = dateInput.toDate();
    else if (dateInput?.seconds) date = new Date(dateInput.seconds * 1000);
    else date = new Date(dateInput);

    return isToday(date);
  } catch {
    return false;
  }
}
