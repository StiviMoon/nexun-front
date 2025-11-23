export function formatMeetingDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d).toUpperCase().replace('.', '');
}

export function formatMeetingTime(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d).toUpperCase();
}


export function formatHistoryDate(date: Date | string): string {
  const d = new Date(date);
  
  const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' })
    .format(d)
    .replace(/^\w/, (c) => c.toUpperCase());
  
  const day = d.getDate().toString().padStart(2, '0');
  
  const month = new Intl.DateTimeFormat('es-ES', { month: 'short' })
    .format(d)
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace('.', '');
  
  const year = d.getFullYear();
  
  const time = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d).toUpperCase();

  return `${dayName}, ${day} ${month} ${year} - ${time}`;
}