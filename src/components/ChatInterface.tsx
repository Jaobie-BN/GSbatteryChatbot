'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { faqLocalData } from '@/config/faqLocal';

interface Button {
  label: string;
  action: string;
  link?: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  buttons?: Button[];
  timestamp?: string;
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initBotWelcome();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initBotWelcome = () => {
    const welcome = faqLocalData['กลับหน้าเริ่มต้น'];
    setMessages([
      {
        sender: 'bot',
        text: welcome.response || '',
        buttons: welcome.buttons,
      },
    ]);
  };

  const handleSendMessage = async (text?: string, link?: string) => {
    const userInput = text || input.trim();
    if (!userInput) return;

    setMessages((prev) => [...prev, { sender: 'user', text: userInput }]);
    setInput('');
    setIsBotTyping(true);
    setLoading(true);
    setMessages((prev) => [...prev, { sender: 'bot', text: 'กำลังพิมพ์...' }]);

    const matched = faqLocalData[userInput];

    if (matched) {
      setTimeout(() => {
        setMessages((prev) => {
          const updated = [...prev];
          updated.pop(); // ลบ "กำลังพิมพ์..."
          return [...updated, { sender: 'bot', text: matched.response || '', buttons: matched.buttons }];
        });
        setIsBotTyping(false);
        setLoading(false);
      }, 500);
    } else {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput }),
        });

        const data = await response.json();

        setTimeout(() => {
          setMessages((prev) => {
            const updated = [...prev];
            updated.pop();
            return [...updated, { sender: 'bot', text: data.response, buttons: data.buttons }];
          });
          setIsBotTyping(false);
        }, 500);
      } catch (error) {
        console.error(error);
        setMessages((prev) => {
          const updated = [...prev];
          updated.pop();
          return [...updated, { sender: 'bot', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }];
        });
        setIsBotTyping(false);
      }
    }

    if (link) window.open(link, '_blank');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-3">
      <div className="flex flex-col w-full max-w-md sm:max-w-lg md:max-w-2xl bg-white text-black rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-blue-500 text-white text-center">
          <h3 className="text-xl font-semibold">GS Chat Bot</h3>
        </div>

        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto bg-white" style={{ minHeight: '70vh', maxHeight: '70vh' }}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className={`max-w-xs p-3 rounded-2xl ${
                  message.sender === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className="flex flex-col">
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                  {message.buttons && (
                    <div className="mt-2 space-y-2 mr-4">
                      {message.buttons.map((button, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (button.link) {
                              window.open(button.link, '_blank');
                            } else {
                              handleSendMessage(button.action);
                            }
                          }}
                          className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm mx-2"
                        >
                          {button.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.timestamp && (
                    <p className="text-[10px] text-gray-400 mt-2 text-right">{message.timestamp}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 p-3 border-2 border-gray-300 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="พิมพ์ข้อความ..."
            disabled={loading}
          />
          <button
            onClick={() => handleSendMessage()}
            className="bg-blue-500 text-white rounded-4xl py-3 px-4 hover:bg-blue-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
          </button>
        </div>
      </div>
    </div>
  );
}
