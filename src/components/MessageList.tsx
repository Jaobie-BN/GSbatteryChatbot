'use client';
import { Message } from '@/types';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <>
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}
    </>
  );
}
