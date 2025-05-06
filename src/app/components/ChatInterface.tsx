'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Button {
  label: string;
  action: string;
  link?: string;  // เพิ่มฟิลด์ link สำหรับการเปิดลิงก์ภายนอก
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
  const [isBotTyping, setIsBotTyping] = useState(false);
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

  const initBotWelcome = async () => {
    setLoading(true);
    try {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: 'กลับหน้าเริ่มต้น' }),
      });

      const data = await response.json();
      setMessages([
        {
          sender: 'bot',
          text: data.response || 'ไรโน่ยินดีให้คำปรึกษาครับ กรุณาเลือกหัวข้อที่ต้องการช่วยเหลือได้เลยครับ',
          buttons: data.buttons,
          timestamp: now,
        },
      ]);
    } catch (error) {
      console.error('Error initializing bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text?: string, link?: string) => {
    const userInput = text || input.trim();
    if (!userInput) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setLoading(true);
    setMessages((prev) => [...prev, { sender: 'user', text: userInput, timestamp: now }]);
    setInput('');

    setIsBotTyping(true);
    setMessages((prev) => [...prev, { sender: 'bot', text: 'กำลังพิมพ์...', timestamp: now }]);

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
          updated.pop(); // ลบข้อความ "กำลังพิมพ์..."
          return [
            ...updated,
            {
              sender: 'bot',
              text: data.response,
              buttons: data.buttons,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
        setIsBotTyping(false);
      }, 800);
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        return [...updated, { sender: 'bot', text: 'ขออภัยครับ มีข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', timestamp: now }];
      });
      setIsBotTyping(false);
    } finally {
      setLoading(false);
    }

    // ตรวจสอบว่ามี link หรือไม่
    if (link) {
      window.open(link, '_blank'); // เปิดลิงค์ในแท็บใหม่
    } else {
      console.log('No link provided'); // ถ้าไม่มีลิงค์
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="flex flex-col w-full max-w-md sm:max-w-lg md:max-w-2xl bg-white text-black rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-blue-500 text-white text-center">
          <h3 className="text-xl font-semibold">GS Chat Bot</h3>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto bg-white" style={{ minHeight: '300px', maxHeight: '75vh' }}>
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
                  <p className="text-sm">{message.text}</p>

                  {/* ปุ่มแสดงถัดไป */}
                  {message.buttons && (
                    <div className="mt-2 space-y-2 mr-4">
                      {message.buttons.map((button, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (button.link) {
                              window.open(button.link, '_blank'); // เปิดลิงค์ถ้าเป็นลิงค์
                              console.log(`Opening link: ${button.link}`);
                            } else {
                              handleSendMessage(button.action); // ส่งข้อความถ้าไม่มีลิงค์
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

        {/* Input */}
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
            placeholder="Type a message..."
            disabled={loading}
          />
          <button
            onClick={() => handleSendMessage()}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
