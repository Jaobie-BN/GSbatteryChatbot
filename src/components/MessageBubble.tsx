'use client';
import { motion } from 'framer-motion';
import { Message } from '@/types';

export default function MessageBubble({ message }: { message: Message }) {
  return (
    <motion.div
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`max-w-xs p-3 rounded-2xl ${message.sender === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-900'}`}>
        <div className="flex flex-col">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          {message.buttons && (
            <div className="mt-2 space-y-2 mr-4">
              {message.buttons.map((button, idx) => (
                <button
                  key={idx}
                  aria-label={button.label}
                  onClick={() => {
                    if (button.link) {
                      window.open(button.link, '_blank', 'noopener,noreferrer');
                    } else {
                      window.dispatchEvent(new CustomEvent('chat-button', { detail: button.action }));
                    }
                  }}
                  className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm mx-2"
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
