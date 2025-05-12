// src/types.ts

export interface Button {
  label: string;
  action: string;
  link?: string;
}

export interface Message {
  sender: 'user' | 'bot';
  text: string;
  buttons?: Button[];
  timestamp?: string;
}