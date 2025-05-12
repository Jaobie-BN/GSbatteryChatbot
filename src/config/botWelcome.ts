// src/config/botWelcome.ts

export const defaultWelcomeMessage: {
  sender: 'user' | 'bot';
  text: string;
  buttons: { label: string; action: string }[];
} = {
  sender: 'bot',
  text: 'ไรโน่ยินดีให้คำปรึกษาครับ กรุณาเลือกหัวข้อที่ต้องการให้ช่วยเหลือได้เลยครับ',
  buttons: [
    { label: 'คุยกับ GS Chat bot', action: 'คุยกับ GS Chat bot' },
    { label: 'เกี่ยวกับแบตเตอรี่', action: 'เกี่ยวกับแบตเตอรี่' },
    { label: 'การเคลมแบตเตอรี่', action: 'การเคลมแบตเตอรี่' },
  ],
};
