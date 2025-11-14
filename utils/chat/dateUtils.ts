/**
 * Utilidades para formatear fechas y tiempos en el chat
 */

export const formatTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  
  if (isToday) {
    return "Hoy";
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  
  if (isYesterday) {
    return "Ayer";
  }
  
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "hace un momento";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} ${diffInMinutes === 1 ? "minuto" : "minutos"}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `hace ${diffInDays} ${diffInDays === 1 ? "día" : "días"}`;
  }
  
  return formatDate(d);
};

export const shouldShowDateSeparator = (
  currentMessage: Date | string,
  previousMessage: Date | string | null
): boolean => {
  if (!previousMessage) {
    return true;
  }
  
  const current = typeof currentMessage === "string" ? new Date(currentMessage) : currentMessage;
  const previous = typeof previousMessage === "string" ? new Date(previousMessage) : previousMessage;
  
  return formatDate(current) !== formatDate(previous);
};

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  
  return d1.toDateString() === d2.toDateString();
};

export const isSameSender = (
  currentMessage: { senderId: string },
  previousMessage: { senderId: string } | null
): boolean => {
  if (!previousMessage) {
    return false;
  }
  
  return currentMessage.senderId === previousMessage.senderId;
};

