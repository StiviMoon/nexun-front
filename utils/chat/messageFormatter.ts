/**
 * Utilidades para formatear y procesar mensajes del chat
 */

import { ChatMessage } from "@/types/chat";

export const formatMessageContent = (content: string): string => {
  // Escapar HTML para seguridad
  const div = document.createElement("div");
  div.textContent = content;
  const escaped = div.innerHTML;
  
  // Convertir saltos de línea a <br>
  return escaped.replace(/\n/g, "<br>");
};

export const truncateMessage = (content: string, maxLength: number = 100): string => {
  if (content.length <= maxLength) {
    return content;
  }
  
  return content.slice(0, maxLength) + "...";
};

export const groupMessagesBySender = (
  messages: ChatMessage[]
): Array<{ sender: string; messages: ChatMessage[] }> => {
  const groups: Array<{ sender: string; messages: ChatMessage[] }> = [];
  
  messages.forEach((message) => {
    const lastGroup = groups[groups.length - 1];
    
    if (lastGroup && lastGroup.sender === message.senderId) {
      lastGroup.messages.push(message);
    } else {
      groups.push({
        sender: message.senderId,
        messages: [message]
      });
    }
  });
  
  return groups;
};

export const getMessageStatus = (message: ChatMessage, isOwn: boolean): {
  status: "sending" | "sent" | "read" | "error";
  icon?: string;
} => {
  if (!isOwn) {
    return { status: "sent" };
  }
  
  // Aquí puedes agregar lógica para determinar el estado del mensaje
  // basado en metadata o flags del servidor
  if (message.metadata?.status === "sending") {
    return { status: "sending", icon: "⏳" };
  }
  
  if (message.metadata?.status === "read") {
    return { status: "read", icon: "✓✓" };
  }
  
  if (message.metadata?.status === "error") {
    return { status: "error", icon: "⚠️" };
  }
  
  return { status: "sent", icon: "✓" };
};

