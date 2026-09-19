import { createClient } from '@supabase/supabase-js';

export interface SystemSetting {
  key: string;
  value: Record<string, any>;
  description?: string;
  updated_at?: string;
}

export interface Trainee {
  id: string;
  student_no: string;
  full_name: string;
  department: string;
  created_at?: string;
}

export interface Question {
  id: string;
  question_order: number;
  prompt: string;
  choices: Record<string, string>;
  correct_key: string;
  explanation?: string;
  is_active: boolean;
  created_at?: string;
}

export interface QuizQuestionClient {
  id: string;
  question_order: number;
  prompt: string;
  choices: Record<string, string>;
  explanation?: string;
}

export interface TestResult {
  id: string;
  trainee_id: string;
  test_type: 'pre' | 'post';
  score: number;
  total_questions: number;
  percentage: number;
  answers_payload: Record<string, string>;
  gain_score?: number | null;
  submitted_at: string;
  trainees?: Trainee;
}

export interface ItemAnalysis {
  question_id: string;
  question_order: number;
  prompt: string;
  pre_pct: number;
  post_pct: number;
  difficulty_p: number;
  discrimination_r: number;
}

export interface ScoreDistribution {
  range: string;
  pre: number;
  post: number;
}

export interface AdminAnalytics {
  total_trainees: number;
  pre_completed: number;
  post_completed: number;
  completion_rate: number;
  avg_pre_score: number;
  avg_post_score: number;
  avg_gain_score: number;
  normalized_gain: number;
  score_distribution: ScoreDistribution[];
  item_analysis: ItemAnalysis[];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let MOCK_SETTINGS: Record<string, any> = {
  pre_test_open: { enabled: true },
  post_test_open: { enabled: true },
  project_info: {
    title: 'โครงการอบรม เรื่อง การประยุกต์ใช้ AI เพื่อการทำงานและการจัดการเรียนรู้',
    subtitle: 'ระบบประเมินผลการเรียนรู้แบบทดสอบก่อนเรียนและหลังเรียน (Pre-test & Post-test System)',
    date: '2026-09-20',
    location: 'ห้องอบรมคอมพิวเตอร์การประยุกต์ใช้ AI',
  },
};

let MOCK_TRAINEES: Trainee[] = [
  {
    "id": "t1",
    "student_no": "1",
    "full_name": "นายภูมิศักดิ์ แสนกันยา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t2",
    "student_no": "2",
    "full_name": "นางสาวสุนิจ วิลาศรี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t3",
    "student_no": "3",
    "full_name": "นายธนวิทย์ ชารีรักษ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t4",
    "student_no": "4",
    "full_name": "นางสาวลิลวนันท์ วรรณพราหมณ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t5",
    "student_no": "5",
    "full_name": "นางเอมอร บุญพิโย",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t6",
    "student_no": "6",
    "full_name": "นางทิพย์สุดา ยนยุบล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t7",
    "student_no": "7",
    "full_name": "นางอมรวรรณ สุภารีย์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t8",
    "student_no": "8",
    "full_name": "นางบัวคำ ประดิษฐ์จา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t9",
    "student_no": "9",
    "full_name": "นางสุพัทยา ศิลาแก้ว",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t10",
    "student_no": "10",
    "full_name": "นางลักษณา คำก้อน",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t11",
    "student_no": "11",
    "full_name": "นางวลัยรัตน์ แก้วกัณหา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t12",
    "student_no": "12",
    "full_name": "นางเพ็ญศรี แก้วมณี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t13",
    "student_no": "13",
    "full_name": "นางสาวพวงพกา อาจวิชัย",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t14",
    "student_no": "14",
    "full_name": "นายสุริยา แสงเพ็ชร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t15",
    "student_no": "15",
    "full_name": "นายธวัชชัย เถาว์ชาลี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t16",
    "student_no": "16",
    "full_name": "นางภาสุณีย์ ผลชารี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t17",
    "student_no": "17",
    "full_name": "นางสาวสิรินญาพร การเกษม",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t18",
    "student_no": "18",
    "full_name": "นายพิทักษ์ โคตะวินนท์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t19",
    "student_no": "19",
    "full_name": "นางกาญจนา มั่นกิจ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t20",
    "student_no": "20",
    "full_name": "นางสาวรุ่งนภา คำภูษา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t21",
    "student_no": "21",
    "full_name": "นายขวัญชัย ไชยสุข",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t22",
    "student_no": "22",
    "full_name": "นายชินญาณ สระแก้ว",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t23",
    "student_no": "23",
    "full_name": "ว่าทีร.ต.ธนิต ภูพลอย",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t24",
    "student_no": "24",
    "full_name": "นางสาวธิดารัตน์ โสวิราช",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t25",
    "student_no": "25",
    "full_name": "นางสาวพรรธนวัลย์ อับเซ็น",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t26",
    "student_no": "26",
    "full_name": "นายธนพล ผลชารี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t27",
    "student_no": "27",
    "full_name": "นางสาวนารีรัตน์ มีนะถา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t28",
    "student_no": "28",
    "full_name": "นายวัชระพล โป๊ะตะคาร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t29",
    "student_no": "29",
    "full_name": "นางสาวกิ่งกาญจน์ จันทร์สว่าง",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t30",
    "student_no": "30",
    "full_name": "นายเรศ แสงทอง",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t31",
    "student_no": "31",
    "full_name": "นางสาวพัทธ์ธีรา อามาตย์มนตรี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t32",
    "student_no": "32",
    "full_name": "นายเกรียงไกร บุตรพรม",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t33",
    "student_no": "33",
    "full_name": "นายจุลศักดิ์ สมบูรณ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t34",
    "student_no": "34",
    "full_name": "นายวีระพงษ์ เนื่องศรี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t35",
    "student_no": "35",
    "full_name": "นางนิตยา คันธิยงค์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t36",
    "student_no": "36",
    "full_name": "นางณัฐกานต์ วงษาวิลัย",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t37",
    "student_no": "37",
    "full_name": "นางสาวละอองดาว นันวิสุ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t38",
    "student_no": "38",
    "full_name": "นางจรินทร ชลิงสุ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t39",
    "student_no": "39",
    "full_name": "นายอภิชาติ เฉลิมชาติ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t40",
    "student_no": "40",
    "full_name": "นางวราภรณ์ ยนต์ชัย",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t41",
    "student_no": "41",
    "full_name": "นางสาวปาริฉัตร ผลประสาท",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t42",
    "student_no": "42",
    "full_name": "นายสุริยา เฉลิมชาติ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t43",
    "student_no": "43",
    "full_name": "นางสาวกาญจนา มัจฉา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t44",
    "student_no": "44",
    "full_name": "นายนันทวัฒน์ ถนอมภักดิ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t45",
    "student_no": "45",
    "full_name": "นางสุจิรา กอศักดิ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t46",
    "student_no": "46",
    "full_name": "นายสมร พัฒมี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t47",
    "student_no": "47",
    "full_name": "นางพรพิมล เฉลิมชาติ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t48",
    "student_no": "48",
    "full_name": "นางศุภลักษณ์ ปะเสระกัง",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t49",
    "student_no": "49",
    "full_name": "น.ส.สุพิชชากาญจน์ ญาณโชติสฤษฎ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t50",
    "student_no": "50",
    "full_name": "นางสาวศศิกานต์ พันธ์โนราช",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t51",
    "student_no": "51",
    "full_name": "นางสุพรรณี ภูแสงศรี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t52",
    "student_no": "52",
    "full_name": "นางวราภรณ์ เฉลิมชาติ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t53",
    "student_no": "53",
    "full_name": "นางยุภาพร ผลสว่าง",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t54",
    "student_no": "54",
    "full_name": "นางจัตุพร สุตตานนท์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t55",
    "student_no": "55",
    "full_name": "นางสาวดวงกมล เนาวะเศษ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t56",
    "student_no": "56",
    "full_name": "นายปิยพันธุ์ ผ่านจังหาร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t57",
    "student_no": "57",
    "full_name": "นางจันทร์เพ็ญ ดวงทองพล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t58",
    "student_no": "58",
    "full_name": "นางณิชากร สงวนกลิ่น",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t59",
    "student_no": "59",
    "full_name": "นางธันยพร ชินคีรี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t60",
    "student_no": "60",
    "full_name": "นางสาววิริยา พันธุขันธ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t61",
    "student_no": "61",
    "full_name": "นางสาวสิริรัตน์ ภูจ่าพล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t62",
    "student_no": "62",
    "full_name": "นางสาวประกายคำ เทศารินทร์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t63",
    "student_no": "63",
    "full_name": "นายภาณุพงษ์ พลเตชะ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t64",
    "student_no": "64",
    "full_name": "นายสมศักดิ์ ศรีเครือดง",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t65",
    "student_no": "65",
    "full_name": "นางปรางทิพย์ ศรีเครือดง",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t66",
    "student_no": "66",
    "full_name": "นางปานใจ อุดรแผ้ว",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t67",
    "student_no": "67",
    "full_name": "นายภาคิน กุดแถลง",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t68",
    "student_no": "68",
    "full_name": "นางสาวสาวิตรี ศรีขัดเค้า",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t69",
    "student_no": "69",
    "full_name": "นายธนากร ชื่นนิรันดร์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t70",
    "student_no": "70",
    "full_name": "นายวีระศักดิ์ คิสาลัง",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t71",
    "student_no": "71",
    "full_name": "นายสมชาติ ภูสง่า",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t72",
    "student_no": "72",
    "full_name": "นายมนูญ ยางงาม",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t73",
    "student_no": "73",
    "full_name": "นายสุริยนต์ มหาราช",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t74",
    "student_no": "74",
    "full_name": "นายภูวพล บุตรหา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t75",
    "student_no": "75",
    "full_name": "นายสมชัย เยาวรุฒ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t76",
    "student_no": "76",
    "full_name": "นายภานุเดช ยาวะนิล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t77",
    "student_no": "77",
    "full_name": "นายประวิทย์ ไชยเสนา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t78",
    "student_no": "78",
    "full_name": "นางวไลกิติ์ เฮมิลทัน",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t79",
    "student_no": "79",
    "full_name": "นางสาวณัฐธิรา พิมพะทิตย์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t80",
    "student_no": "80",
    "full_name": "นางเพชราภรณ์ แสนพาน",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t81",
    "student_no": "81",
    "full_name": "นางสาวเทียมจิต เทวิญญา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t82",
    "student_no": "82",
    "full_name": "นางฉัตรชนก ถวิล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t83",
    "student_no": "83",
    "full_name": "นางสาววริษา การิโส",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t84",
    "student_no": "84",
    "full_name": "นางสาวมาลิตา พรมโสภา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t85",
    "student_no": "85",
    "full_name": "นางสาวมัญชนา พรมลี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t86",
    "student_no": "86",
    "full_name": "นางสาวสราพร บุญเลิศ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t87",
    "student_no": "87",
    "full_name": "นางสาวสุคนธา ยะไวทย์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t88",
    "student_no": "88",
    "full_name": "นางบุญทวี คำเนตร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t89",
    "student_no": "89",
    "full_name": "นายปิยวัตร วงศ์เครือศร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t90",
    "student_no": "90",
    "full_name": "นางสาวพัสตราภรณ์ เยี่ยมสมบัติ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t91",
    "student_no": "91",
    "full_name": "นางสาวเพชรไพลิน ค้ำชู",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t92",
    "student_no": "92",
    "full_name": "นางสาวอรนิชา คะอังกุ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t93",
    "student_no": "93",
    "full_name": "นางสาวขนิษฐา จำปามูล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t94",
    "student_no": "94",
    "full_name": "นางสาวศลิษา วงศ์ษาพาน",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t95",
    "student_no": "95",
    "full_name": "นางสาวกรองแก้ว อ้วนล่ำ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t96",
    "student_no": "96",
    "full_name": "นายสิรวิชญ์ ศรีธรรมบุตร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t97",
    "student_no": "97",
    "full_name": "นางวราภรณ์ แสบงบาล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t98",
    "student_no": "98",
    "full_name": "นางยุพิน บุญเลิศ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t99",
    "student_no": "99",
    "full_name": "นายอนุชิต กอศักดิ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t100",
    "student_no": "100",
    "full_name": "นางสาวณัฐวดี รักษาภักดี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t101",
    "student_no": "101",
    "full_name": "นางสาวศิริพร ดวงทองพล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t102",
    "student_no": "102",
    "full_name": "นางบังอร สมิทธิกันต์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t103",
    "student_no": "103",
    "full_name": "นายกิตติภัค ไพศาล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t104",
    "student_no": "104",
    "full_name": "นายจิระเดช แก้วกัณหา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t105",
    "student_no": "105",
    "full_name": "นางสาวอุบล มูลเจริญ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t106",
    "student_no": "106",
    "full_name": "นายสุข ศรีทวีกาศ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t107",
    "student_no": "107",
    "full_name": "นางปรียาณัฐ จันทร์ซ้าย",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t108",
    "student_no": "108",
    "full_name": "นางสาวกนกนาฏ ฝางแสงงาม",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t109",
    "student_no": "109",
    "full_name": "นายรัตนพล มีศิลป์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t110",
    "student_no": "110",
    "full_name": "นางสาวพรรณทิพย์ พิสสมัย",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t111",
    "student_no": "111",
    "full_name": "นายเจษฎาภรณ์ สันวิลาศ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t112",
    "student_no": "112",
    "full_name": "นางสาวกานต์ธีรา เหลาสุภาพ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t113",
    "student_no": "113",
    "full_name": "นางสาวปิยะพร นิตยารส",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t114",
    "student_no": "114",
    "full_name": "นางสาวกันย์ชิสา สามารถ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t115",
    "student_no": "115",
    "full_name": "นางฐรัชญา กินรี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t116",
    "student_no": "116",
    "full_name": "นางสาวประกายฟ้า เปียนาค",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t117",
    "student_no": "117",
    "full_name": "นายพุฒิพงษ์ ศิลาแยง",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t118",
    "student_no": "118",
    "full_name": "นางสาวณัฐกานต์ ชื่นชม",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t119",
    "student_no": "119",
    "full_name": "นายอาคม วิชัยศร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t120",
    "student_no": "120",
    "full_name": "นางสาวเมตตา ผาละกัน",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t121",
    "student_no": "121",
    "full_name": "นายจิลลาภัทร มุกดา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t122",
    "student_no": "122",
    "full_name": "นายพจกร แจ่มสุวรรณ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t123",
    "student_no": "123",
    "full_name": "นางสาววัชนี อ่อนเขียว",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t124",
    "student_no": "124",
    "full_name": "นายสมเกียรติ สยองเดช",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t125",
    "student_no": "125",
    "full_name": "นางสาวช่อทิพย์ พรมเสน",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t126",
    "student_no": "126",
    "full_name": "นายเอนก สุวรรณธาดา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t127",
    "student_no": "127",
    "full_name": "นางสาวจีรภา บุดดีคำ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t128",
    "student_no": "128",
    "full_name": "นางสาวสุภาวดี แก้วไวยุธ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t129",
    "student_no": "129",
    "full_name": "นางสาวทิพากร การสรรพ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t130",
    "student_no": "130",
    "full_name": "นายพิชชากร อุตะโม",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t131",
    "student_no": "131",
    "full_name": "นางสาวนิศากร เวงวิถา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t132",
    "student_no": "132",
    "full_name": "นายสมศักดิ์ โกฐาคาน",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t133",
    "student_no": "133",
    "full_name": "นายทินกร รังรส",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t134",
    "student_no": "134",
    "full_name": "นางสาวจตุพร พรมคำบุตร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t135",
    "student_no": "135",
    "full_name": "นางสาวพนิดารัตน์ สว่างวงษ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t136",
    "student_no": "136",
    "full_name": "นายกฤษตยชญิ์ พลภักดี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t137",
    "student_no": "137",
    "full_name": "นางนิตยา มูลพงษ์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t138",
    "student_no": "138",
    "full_name": "นายชาตรี จำนงกิจ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t139",
    "student_no": "139",
    "full_name": "นางศุภลักษณ์ จิตจักร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t140",
    "student_no": "140",
    "full_name": "นายสหรัฐ โคตรชาลี",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t141",
    "student_no": "141",
    "full_name": "นางสาวสุพรรญา พรมคำบุตร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t142",
    "student_no": "142",
    "full_name": "นางสาวสุภัสดา รถเชษฐา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t143",
    "student_no": "143",
    "full_name": "นางสาวมณีรัตน์ สิงหาวาสน์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t144",
    "student_no": "144",
    "full_name": "นางสาวลักษณพร พงษ์ขจร",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t145",
    "student_no": "145",
    "full_name": "นางสาวศิริรัชช์ ศรีปัดถา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t146",
    "student_no": "146",
    "full_name": "นางสาวณัฐสุรางค์ ดวงทองพล",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t147",
    "student_no": "147",
    "full_name": "นางสาวสุพิชชา รัตนเกื้อ",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t148",
    "student_no": "148",
    "full_name": "นางสาวณัฐวิภา เทียมทัน",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t149",
    "student_no": "149",
    "full_name": "นางสาวจุฑาทิพย์ รินทราช",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t150",
    "student_no": "150",
    "full_name": "นางสาวนนทวรรณ บุญมาก",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t151",
    "student_no": "151",
    "full_name": "นางขนิษฐา อาจมูลลา",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t152",
    "student_no": "152",
    "full_name": "นายธนธัญ เทศารินทร์",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t153",
    "student_no": "153",
    "full_name": "Mr. Le Trung Dung",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t154",
    "student_no": "154",
    "full_name": "Miss Jessa Gutang Madera",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t155",
    "student_no": "155",
    "full_name": "Miss Jeaneanne Dela Cuesta",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t156",
    "student_no": "156",
    "full_name": "Mr. Glenn Laorisa Vallente",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t157",
    "student_no": "157",
    "full_name": "Ms. Mercy Joy Rivera Cafifge",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t158",
    "student_no": "158",
    "full_name": "Weijiayi",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t159",
    "student_no": "159",
    "full_name": "Tao anju",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t160",
    "student_no": "160",
    "full_name": "นางสาวสุมาลี การสวน",
    "department": "คณะครูผู้เข้าอบรม"
  },
  {
    "id": "t161",
    "student_no": "161",
    "full_name": "นายทรงพล ขมิ้นเขียว",
    "department": "คณะครูผู้เข้าอบรม"
  }
];

let MOCK_QUESTIONS: Question[] = [
  {
    "id": "q1",
    "question_order": 1,
    "prompt": "ข้อใดอธิบายความหมายของ AI (Artificial Intelligence) ได้เหมาะสมที่สุด",
    "choices": {
      "a": "โปรแกรมที่ใช้สำหรับพิมพ์เอกสารเท่านั้น",
      "b": "ระบบที่สามารถเรียนรู้ วิเคราะห์ และช่วยแก้ปัญหาจากข้อมูลได้",
      "c": "เว็บไซต์สำหรับค้นหาข้อมูลบนอินเทอร์เน็ต",
      "d": "โปรแกรมที่ใช้สร้างภาพเพียงอย่างเดียว"
    },
    "correct_key": "b",
    "explanation": "AI (Artificial Intelligence) คือระบบคอมพิวเตอร์ที่สามารถเรียนรู้ วิเคราะห์ข้อมูล และช่วยแก้ปัญหาได้เป็นอย่างดี",
    "is_active": true
  },
  {
    "id": "q2",
    "question_order": 2,
    "prompt": "ข้อใดเป็นความสามารถของ Generative AI",
    "choices": {
      "a": "สร้างข้อความ ภาพ เสียง หรือวิดีโอจากคำสั่งของผู้ใช้",
      "b": "ใช้ได้เฉพาะการคำนวณทางคณิตศาสตร์",
      "c": "ใช้ได้เฉพาะการค้นหาเว็บไซต์",
      "d": "ใช้ได้เฉพาะการจัดเก็บไฟล์"
    },
    "correct_key": "a",
    "explanation": "Generative AI มีความสามารถหลักในการสร้างสรรค์คอนเทนต์ใหม่ๆ ทั้งข้อความ ภาพ เสียง หรือวิดีโอจากคำสั่ง (Prompt)",
    "is_active": true
  },
  {
    "id": "q3",
    "question_order": 3,
    "prompt": "หากต้องการให้ AI ช่วยศึกษาและสรุปข้อมูลจากเอกสารจำนวนมาก เครื่องมือใดเหมาะสม",
    "choices": {
      "a": "NotebookLM",
      "b": "Calculator",
      "c": "Google Maps",
      "d": "Paint"
    },
    "correct_key": "a",
    "explanation": "NotebookLM เป็นเครื่องมือ AI ของ Google ที่ออกแบบมาเพื่อการศึกษา สรุป และวิเคราะห์ข้อมูลจากไฟล์เอกสารจำนวนมากโดยเฉพาะ",
    "is_active": true
  },
  {
    "id": "q4",
    "question_order": 4,
    "prompt": "ข้อใดเป็นความแตกต่างสำคัญระหว่าง Search Engine กับ Generative AI",
    "choices": {
      "a": "Search Engine สร้างคำตอบใหม่ทุกครั้งโดยไม่ค้นเว็บไซต์",
      "b": "Generative AI ทำหน้าที่ค้นหาเว็บไซต์เพียงอย่างเดียว",
      "c": "Search Engine ช่วยค้นหาแหล่งข้อมูล ส่วน Generative AI สามารถสร้างหรือสังเคราะห์คำตอบจากคำสั่งได้",
      "d": "ทั้งสองอย่างทำงานเหมือนกันทุกประการ"
    },
    "correct_key": "c",
    "explanation": "Search Engine ดึงและแสดงลิงก์แหล่งข้อมูลเดิม ในขณะที่ Generative AI สามารถสังเคราะห์ สรุป และสร้างคำตอบใหม่ขึ้นมาได้",
    "is_active": true
  },
  {
    "id": "q5",
    "question_order": 5,
    "prompt": "หากต้องการให้ AI สร้างคำตอบได้ตรงความต้องการมากขึ้น สิ่งใดสำคัญที่สุด",
    "choices": {
      "a": "เขียน Prompt ให้ชัดเจนและมีรายละเอียดครบ",
      "b": "พิมพ์คำสั่งให้สั้นที่สุดเสมอ",
      "c": "ไม่ต้องระบุเป้าหมายของงาน",
      "d": "ใช้คำสั่งเดิมกับทุกงาน"
    },
    "correct_key": "a",
    "explanation": "การเขียน Prompt ที่มีความชัดเจน มีบริบท และระบุรายละเอียดครบถ้วน จะช่วยให้ AI สร้างคำตอบตรงตามวัตถุประสงค์",
    "is_active": true
  },
  {
    "id": "q6",
    "question_order": 6,
    "prompt": "ข้อใดเป็นองค์ประกอบหนึ่งของการเขียน Prompt ที่ดีตามหลัก Role–Context–Task–Format–Constraints",
    "choices": {
      "a": "Role หรือบทบาทที่ต้องการให้ AI ทำ",
      "b": "Password ของผู้ใช้",
      "c": "จำนวนผู้ใช้อินเทอร์เน็ต",
      "d": "ยี่ห้อคอมพิวเตอร์"
    },
    "correct_key": "a",
    "explanation": "หลัก Role-Context-Task-Format-Constraints กำหนดให้มี Role (การกำหนดบทบาทให้ AI) เป็นองค์ประกอบสำคัญ",
    "is_active": true
  },
  {
    "id": "q7",
    "question_order": 7,
    "prompt": "หากต้องการให้ AI ช่วย “ออกข้อสอบวิทยาศาสตร์ ม.1 จำนวน 10 ข้อ พร้อมเฉลย” ข้อความดังกล่าวส่วนใดถือเป็น Task",
    "choices": {
      "a": "วิทยาศาสตร์",
      "b": "ม.1",
      "c": "ออกข้อสอบจำนวน 10 ข้อพร้อมเฉลย",
      "d": "AI"
    },
    "correct_key": "c",
    "explanation": "Task คือคำสั่งหรืองานที่ต้องการให้ AI ลงมือทำ ในที่นี้คือ การออกข้อสอบจำนวน 10 ข้อพร้อมเฉลย",
    "is_active": true
  },
  {
    "id": "q8",
    "question_order": 8,
    "prompt": "Token ในระบบ AI หมายถึงอะไร",
    "choices": {
      "a": "เงินดิจิทัลสำหรับซื้อโปรแกรม AI เท่านั้น",
      "b": "หน่วยย่อยของข้อความที่ AI ใช้อ่านและประมวลผล",
      "c": "รหัสผ่านสำหรับเข้าใช้งาน AI",
      "d": "จำนวนภาพที่ AI สามารถสร้างได้"
    },
    "correct_key": "b",
    "explanation": "Token คือหน่วยย่อยของคำหรือข้อความที่โมเดล AI ตัดแบ่งเพื่อใช้อ่าน ประมวลผล และคำนวณค่าบริบท",
    "is_active": true
  },
  {
    "id": "q9",
    "question_order": 9,
    "prompt": "“Context Window” เกี่ยวข้องกับข้อใดมากที่สุด",
    "choices": {
      "a": "ขนาดหน้าจอคอมพิวเตอร์",
      "b": "ปริมาณข้อมูลหรือบริบทที่ AI สามารถพิจารณาในการประมวลผลครั้งหนึ่ง",
      "c": "จำนวนผู้ใช้งาน AI พร้อมกัน",
      "d": "ความเร็วของอินเทอร์เน็ต"
    },
    "correct_key": "b",
    "explanation": "Context Window คือขนาดของความจำชั่วคราว หรือปริมาณข้อมูลสูงสุดที่ AI สามารถอ่านและพิจารณาประมวลผลได้ในหนึ่งรอบ",
    "is_active": true
  },
  {
    "id": "q10",
    "question_order": 10,
    "prompt": "วิธีใดช่วยใช้ AI ได้อย่างมีประสิทธิภาพและประหยัด Token มากที่สุด",
    "choices": {
      "a": "ส่งข้อมูลทั้งหมดโดยไม่คัดเลือก",
      "b": "เขียนคำสั่งยาวซ้ำไปซ้ำมา",
      "c": "กำหนด Prompt ให้ชัดเจน ตัดข้อมูลที่ไม่จำเป็น และระบุรูปแบบผลลัพธ์ที่ต้องการ",
      "d": "ถามหลายเรื่องที่ไม่เกี่ยวข้องกันในคำสั่งเดียว"
    },
    "correct_key": "c",
    "explanation": "การตัดข้อมูลขยะออกและกำหนด Prompt ให้กระชับ สัดทัด ชัดเจน ช่วยลดจำนวน Token และทำให้ AI ตอบได้รวดเร็วและตรงจุด",
    "is_active": true
  }
];

let MOCK_TEST_RESULTS: TestResult[] = [
  {
    id: 'r1',
    trainee_id: 't1',
    test_type: 'pre',
    score: 5,
    total_questions: 10,
    percentage: 50.0,
    answers_payload: { q1: 'b', q2: 'a', q3: 'a', q4: 'c', q5: 'b', q6: 'a', q7: 'b', q8: 'a', q9: 'b', q10: 'c' },
    gain_score: null,
    submitted_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'r2',
    trainee_id: 't1',
    test_type: 'post',
    score: 9,
    total_questions: 10,
    percentage: 90.0,
    answers_payload: { q1: 'b', q2: 'a', q3: 'a', q4: 'c', q5: 'a', q6: 'a', q7: 'c', q8: 'b', q9: 'b', q10: 'c' },
    gain_score: 4,
    submitted_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const getMockData = () => ({
  settings: MOCK_SETTINGS,
  trainees: MOCK_TRAINEES,
  questions: MOCK_QUESTIONS,
  results: MOCK_TEST_RESULTS,
});
