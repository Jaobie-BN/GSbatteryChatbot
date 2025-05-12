'use client';
import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types';
import { faqLocalData } from '@/config/faqLocal';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const welcome = faqLocalData['กลับหน้าเริ่มต้น'];
    setMessages([{ sender: 'bot', text: welcome.response || '', buttons: welcome.buttons }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const userInput = text || input.trim();
    if (!userInput) return;

    setMessages((prev) => [...prev, { sender: 'user', text: userInput }]);
    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { sender: 'bot', text: 'กำลังพิมพ์...' }]);

    const matched = faqLocalData[userInput];

    if (matched) {
      setTimeout(() => {
        setMessages((prev) => {
          const updated = [...prev];
          updated.pop();
          return [...updated, { sender: 'bot', text: matched.response || '', buttons: matched.buttons }];
        });
        setLoading(false);
      }, 500);
    } else {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput }),
        });
        const data = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated.pop();
          return [...updated, { sender: 'bot', text: data.response, buttons: data.buttons }];
        });
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated.pop();
          return [...updated, { sender: 'bot', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }];
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // ฟัง event จาก MessageBubble
  useEffect(() => {
    const listener = (e: any) => handleSendMessage(e.detail);
    window.addEventListener('chat-button', listener);
    return () => window.removeEventListener('chat-button', listener);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-3">
      <div className="flex flex-col w-full max-w-md sm:max-w-lg md:max-w-2xl bg-white text-black rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-blue-500 text-white text-center">
          <h3 className="text-xl font-semibold">GS Chat Bot</h3>
        </div>

        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto bg-white" style={{ minHeight: '70vh', maxHeight: '70vh' }}>
          <MessageList messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        <ChatInput value={input} onChange={(e) => setInput(e.target.value)} onSubmit={() => handleSendMessage()} disabled={loading} />
      </div>
    </div>
  );
}
