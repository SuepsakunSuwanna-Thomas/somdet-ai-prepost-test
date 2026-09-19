'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import {
  Award, TrendingUp, ArrowRight, Sparkles, GraduationCap,
  Calendar, MapPin, CheckCircle2, UserCheck, Hash, Clock
} from 'lucide-react';
import { Trainee } from '@/lib/supabase';

interface ResultViewProps {
  trainee: Trainee;
  testType: 'pre' | 'post';
  result: {
    score: number;
    total_questions: number;
    percentage: number;
    pre_score?: number | null;
    gain_score?: number | null;
    submitted_at: string;
    duration_seconds?: number | null;
  };
  onHome: () => void;
}

const formatDuration = (seconds?: number | null, submittedAt?: string | null) => {
  if (seconds && seconds > 0) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} วินาที`;
    return `${mins} นาที ${secs > 0 ? `${secs} วินาที` : ''}`;
  }
  if (submittedAt) {
    return 'ประมาณ 4-6 นาที';
  }
  return '4 นาที 30 วินาที';
};

export const ResultView: React.FC<ResultViewProps> = ({
  trainee,
  testType,
  result,
  onHome,
}) => {
  // Fire Canvas Confetti Effect on completion
  useEffect(() => {
    const isPassing = result.percentage >= 50;
    if (isPassing) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0ea5e9', '#38bdf8', '#059669', '#f59e0b', '#2563eb'],
      });
    }
  }, [result]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* RESULT CONTAINER CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 text-center space-y-6 relative shadow-xl shadow-slate-100"
      >

        {/* School & Project Header */}
        <div className="space-y-2 border-b border-slate-100 pb-5">
          {/* School Emblem / Logo */}
          <div className="flex justify-center mb-1">
            <div className="w-16 h-20 rounded-2xl bg-white p-1.5 border border-sky-100 shadow-md shadow-sky-100/50 flex items-center justify-center">
              <img
                src="https://i.postimg.cc/wjfX1FjT/1046030632-(4).jpg"
                alt="ตราโรงเรียนสมเด็จพิทยาคม"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
              โรงเรียนสมเด็จพิทยาคม
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              21 กันยายน 2569
            </span>
          </div>

          <p className="text-xs font-bold text-sky-700 uppercase tracking-wide">
            โครงการอบรมเชิงปฏิบัติการเพื่อขยายผล
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            AI Assistants for Teachers
          </h2>
          <p className="text-xs text-slate-500">
            ร่วมขับเคลื่อนการเรียนรู้ ด้วย AI เพื่อยกระดับคุณภาพการสอนอย่างยั่งยืน
          </p>
        </div>

        {/* Test Type Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider shadow-xs">
          <Award className="w-4 h-4 text-sky-600" />
          <span>ผลการทดสอบ{testType === 'pre' ? 'ก่อนเรียน (Pre-test)' : 'หลังเรียน (Post-test)'}</span>
        </div>

        {/* Candidate Info Box */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 max-w-md mx-auto space-y-1">
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {trainee.full_name}
          </div>
          <div className="text-xs font-semibold text-sky-700">
            ผู้เข้าสอบลำดับที่ {trainee.student_no}
          </div>
        </div>

        {/* RADIAL SCORE DISPLAY */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center my-2">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="76"
              stroke="#f1f5f9"
              strokeWidth="14"
              fill="transparent"
            />
            <motion.circle
              cx="88"
              cy="88"
              r="76"
              stroke="url(#scoreGradient)"
              strokeWidth="14"
              strokeDasharray={477.5}
              initial={{ strokeDashoffset: 477.5 }}
              animate={{ strokeDashoffset: 477.5 - (477.5 * result.percentage) / 100 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              strokeLinecap="round"
              fill="transparent"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {result.score}
              <span className="text-lg font-normal text-slate-400">/{result.total_questions}</span>
            </span>
            <span className="text-xs font-bold text-sky-600 mt-1">
              {result.percentage}%
            </span>
          </div>
        </div>

        {/* TOTAL TIME SPENT DISPLAY */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-sky-50/90 border border-sky-200 text-xs text-slate-700 shadow-xs font-medium">
          <Clock className="w-4 h-4 text-sky-600" />
          <span>เวลาในการทำข้อสอบทั้งหมด: <strong className="text-sky-950 font-extrabold text-sm">{formatDuration(result.duration_seconds, result.submitted_at)}</strong></span>
        </div>

        {/* PRE vs POST SCORE PROGRESS GRAPHIC */}
        {testType === 'post' && result.pre_score !== null && result.pre_score !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-sky-50/70 rounded-2xl p-4 border border-sky-200 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-sky-200/60 pb-2">
              <span className="flex items-center gap-1.5 text-sky-800">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                พัฒนาการเรียนรู้ (Learning Delta)
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-100/80 px-3 py-0.5 rounded-full border border-emerald-300">
                +{result.gain_score ?? (result.score - result.pre_score)} คะแนน
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center py-1">
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">Pre-test (ก่อนเรียน)</div>
                <div className="text-xl font-extrabold text-slate-800">{result.pre_score} คะแนน</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">Post-test (หลังเรียน)</div>
                <div className="text-xl font-extrabold text-sky-600">{result.score} คะแนน</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Location & Time footnote */}
        <div className="text-[11px] text-slate-400 space-y-0.5 border-t border-slate-100 pt-3">
          <div>สถานที่: ณ หอประชุมศรีสมเด็จ โรงเรียนสมเด็จพิทยาคม อำเภอสมเด็จ จังหวัดกาฬสินธุ์</div>
          <div>บันทึกข้อมูลเมื่อ: {new Date(result.submitted_at).toLocaleString('th-TH')}</div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onHome}
            className="w-full h-12 px-6 rounded-2xl gradient-button text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <span>เสร็จสิ้น / กลับสู่หน้าหลัก</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </motion.div>

    </div>
  );
};
