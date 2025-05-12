import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ตรวจสอบว่า API KEY ถูกตั้งหรือไม่
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const faqPath = path.join(process.cwd(), 'src/app/data/faq.json');
let faqData: any = {};

try {
  faqData = JSON.parse(fs.readFileSync(faqPath, 'utf-8'));
} catch (err) {
  console.error("โหลดไฟล์ FAQ ไม่สำเร็จ:", err);
}

async function queryGemini(userInput: string) {
  const body = {
    contents: [{
      parts: [{
        text: `
คุณมีหน้าที่เลือกหัวข้อที่ตรงที่สุดจากรายการต่อไปนี้:
${Object.keys(faqData).map((key) => `- ${key}`).join('\n')}

ห้ามแต่งข้อความใหม่ ห้ามดัดแปลง ห้ามตอบคำอื่นนอกจากชื่อหัวข้อที่มีให้เลือกเท่านั้น

ข้อความผู้ใช้: "${userInput}"

ตอบเฉพาะชื่อหัวข้อที่มีอยู่เท่านั้น`
      }]
    }],
    generationConfig: {
      temperature: 0.25,
      topK: 3,
      topP: 0.3,
    }
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`❌ Error querying Gemini API: ${response.statusText}`);
  }

  return await response.json();
}

function findClosestIntent(intent: string, faqData: any): string {
  const lowerIntent = intent.toLowerCase();
  let bestMatch = 'กลับหน้าเริ่มต้น';
  let highestMatch = 0;

  for (const [key] of Object.entries(faqData)) {
    const similarity = calculateSimilarity(lowerIntent, key.toLowerCase());
    if (similarity > highestMatch) {
      bestMatch = key;
      highestMatch = similarity;
    }
  }

  console.log(`🔍 [Similarity Matching] "${intent}" matched with "${bestMatch}" (${(highestMatch * 100).toFixed(2)}%)`);
  return bestMatch;
}

function calculateSimilarity(str1: string, str2: string): number {
  const diff = levenshtein(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return (maxLength - diff) / maxLength;
}

function levenshtein(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  // กำหนดประเภทของ matrix ให้เป็น number[][]
  const matrix: number[][] = Array.from({ length: aLen + 1 }, () =>
    new Array(bLen + 1).fill(0)
  );

  for (let i = 0; i <= aLen; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // ลบ
        matrix[i][j - 1] + 1,      // เพิ่ม
        matrix[i - 1][j - 1] + cost // แทนที่
      );
    }
  }

  return matrix[aLen][bLen];
}

export async function POST(req: NextRequest) {
  const { userInput } = await req.json();
  console.log("User Input:", userInput);

  try {
    const geminiResponse = await queryGemini(userInput);
    const content = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    console.log("Gemini Response:", content);

    let matchedKey: string;

    if (content && faqData[content]) {
      matchedKey = content;
      console.log("ตรงหัวข้อใน FAQ โดยตรง:", matchedKey);
    } else {
      matchedKey = findClosestIntent(content || userInput, faqData);
      console.log("ใช้ Levenshtein fallback:", matchedKey);
    }

    const matchedData = faqData[matchedKey] || { title: matchedKey, answer: "ไม่พบข้อมูลในระบบ" };
    return NextResponse.json(matchedData);

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    return NextResponse.json({ error: 'ไม่สามารถตอบคำถามได้ในขณะนี้' }, { status: 500 });
  }
}
