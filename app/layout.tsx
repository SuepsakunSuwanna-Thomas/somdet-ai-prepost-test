import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const promptFont = Prompt({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin', 'thai'],
  display: 'swap',
  variable: '--font-prompt',
});

export const metadata: Metadata = {
  title: 'ระบบทดสอบก่อน-หลังอบรม | AI Assistants for Teachers โรงเรียนสมเด็จพิทยาคม',
  description: 'โครงการอบรมเชิงปฏิบัติการเพื่อขยายผล โครงการ AI Assistants for Teachers ร่วมขับเคลื่อนการเรียนรู้ ด้วย AI เพื่อยกระดับคุณภาพการสอนอย่างยั่งยืน สำหรับครูผู้สอนชั้น ม.1 - ม.6 โรงเรียนสมเด็จพิทยาคม',
  icons: {
    icon: 'https://i.postimg.cc/wjfX1FjT/1046030632-(4).jpg',
    apple: 'https://i.postimg.cc/wjfX1FjT/1046030632-(4).jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={promptFont.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-gradient-to-br from-slate-50 via-sky-50/50 to-blue-50/40 text-slate-800 min-h-screen selection:bg-sky-100 selection:text-sky-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
