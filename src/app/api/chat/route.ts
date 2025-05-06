import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ใช้ API ของ Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const faqPath = path.join(process.cwd(), 'src/app/data/faq.json');
const faqData = JSON.parse(fs.readFileSync(faqPath, 'utf-8'));

// ฟังก์ชันสำหรับส่งคำขอไปยัง Gemini API
async function queryGemini(userInput: string) {
  const body = {
    contents: [{
      parts: [{
        text: `
        
        คุณมีหน้าที่เลือกหัวข้อที่ตรงที่สุด และต้องวิเคราะห์คำถามของผู้ใช้เพื่อหาหัวข้อที่ใกล้เคียงที่สุดกับคำถามนั้น
        โดยคุณต้องพิจารณาความหมายของคำถามและเลือกหัวข้อที่ตรงที่สุดจากรายการต่อไปนี้:
        ${Object.keys(faqData).map((key) => `- ${key}`).join('\n')}

        และคุณต้องวิเคราะห์คำถามของผู้ใช้เพื่อหาหัวข้อที่ใกล้เคียงที่สุดกับคำถามนั้น
        โดยคุณต้องพิจารณาความหมายของคำถามและเลือกหัวข้อที่ตรงที่สุด

        ห้ามแต่งข้อความใหม่ ห้ามดัดแปลง ห้ามตอบคำอื่นนอกจากชื่อหัวข้อที่มีให้เลือกเท่านั้น

        ข้อความผู้ใช้: "${userInput}"

        ตอบเฉพาะชื่อหัวข้อที่มีอยู่เท่านั้น`
      }]
    }]
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Error querying Gemini API: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// ฟังก์ชันค้นหาหัวข้อที่ใกล้เคียงที่สุด
function findClosestIntent(intent: string, faqData: any): string {
  const lowerIntent = intent.toLowerCase();
  let bestMatch = 'กลับหน้าเริ่มต้น';
  let highestMatch = 0;

  for (const [key, data] of Object.entries(faqData)) {
    let similarity = calculateSimilarity(lowerIntent, key.toLowerCase());
    if (similarity > highestMatch) {
      bestMatch = key;
      highestMatch = similarity;
    }
  }
  return bestMatch;
}

// ฟังก์ชันนี้จะคำนวณความเหมือนของสองข้อความ
function calculateSimilarity(str1: string, str2: string): number {
  let diff = levenshtein(str1, str2);
  let maxLength = Math.max(str1.length, str2.length);
  return (maxLength - diff) / maxLength;  // คืนค่าความคล้ายออกมาเป็นเปอร์เซ็นต์
}

// ฟังก์ชันคำนวณ Levenshtein Distance
function levenshtein(a: string, b: string): number {
  let tmp;
  let i, j;
  const alen = a.length;
  const blen = b.length;
  const arr = [];

  if (alen === 0) { return blen; }
  if (blen === 0) { return alen; }

  for (i = 0; i <= alen; i++) {
    arr[i] = [i];
  }

  for (j = 0; j <= blen; j++) {
    arr[0][j] = j;
  }

  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      tmp = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      arr[i][j] = Math.min(arr[i - 1][j] + 1, arr[i][j - 1] + 1, arr[i - 1][j - 1] + tmp);
    }
  }
  return arr[alen][blen];
}

export async function POST(req: NextRequest) {
  const { userInput } = await req.json();

  try {
    const geminiResponse = await queryGemini(userInput);
    const candidates = geminiResponse?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates found in Gemini API response');
    }

    const content = candidates[0]?.content?.parts[0]?.text || 'ไม่มีคำตอบที่ตรงกับคำถามนี้';

    const matchedKey = findClosestIntent(content, faqData);
    const matchedData = faqData[matchedKey];

    console.log('User Input:', userInput);
    console.log('Matched Key:', matchedKey);
    console.log('Matched Data:', matchedData);

    return NextResponse.json(matchedData);
  } catch (error) {
    console.error('Error querying Gemini API:', error);
    return NextResponse.json({ error: 'Failed to get response from Gemini' }, { status: 500 });
  }
}
