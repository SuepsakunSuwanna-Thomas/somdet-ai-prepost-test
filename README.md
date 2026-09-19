# somdet-ai-prepost-test

ระบบแบบทดสอบก่อนเรียนและหลังเรียน (Pre-test & Post-test System) พร้อมระบบประเมินผลการเรียนรู้และวิเคราะห์ข้อสอบ สำหรับโครงการอบรมเชิงปฏิบัติการ **AI Assistants for Teachers** โรงเรียนสมเด็จพิทยาคม

---

## 🌟 ฟีเจอร์หลัก (Key Features)

- 📝 **ระบบทำแบบทดสอบก่อนเรียน - หลังเรียน (Pre-test & Post-test)**
- 🔀 **ระบบสลับข้อและสลับชอยส์ตัวเลือกอัตโนมัติ (Randomize Questions & Choices)**
- 💾 **ระบบบันทึกความคืบหน้าอัตโนมัติ (Autosave & Offline Draft Resilience)** กู้คืนข้อสอบที่ทำค้างไว้ได้ทันที
- 🎵 **ดนตรีคลอสร้างสมาธิ (Relaxing Ambient Engine)** พัฒนาด้วย Web Audio API คุณภาพสูง
- 📊 **แอดมินแดชบอร์ดและการวิเคราะห์ผล (Admin Analytics & Item Analysis)**
  - วิเคราะห์ระดับความยากง่าย ($p$) และค่าอำนาจจำแนก ($r$) ของข้อสอบแต่ละข้อ
  - สรุปคะแนนเฉลี่ย พัฒนาการ (Gain Score) และคะแนนจำแนกรายบุคคล
  - ส่งออกผลคะแนนเป็นไฟล์ Excel / CSV ได้ทันที
- 🔒 **ระบบความปลอดภัย Server-Side** ป้องกันการส่งข้อสอบซ้ำ และระบบรหัสผ่านผู้ดูแลระบบที่ปลอดภัย

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend / Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS, Framer Motion, Lucide React
- **Backend / Database**: Supabase PostgreSQL 16
- **Audio**: Web Audio API (High-Fidelity Ambient Sound Generator)

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Getting Started)

1. Clone โปรเจกต์:
```bash
git clone https://github.com/SuepsakunSuwanna-Thomas/somdet-ai-prepost-test.git
cd somdet-ai-prepost-test
```

2. ติดตั้ง Dependencies:
```bash
npm install
```

3. สร้างไฟล์ `.env.local` และตั้งค่าการเชื่อมต่อ:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_PASSWORD=somdet2026
```

4. เริ่มต้นใช้งานในโหมด Development:
```bash
npm run dev
```

เปิดเว็บเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)
