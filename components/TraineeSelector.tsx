'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, CheckCircle2, Clock, PlayCircle, X,
  Calendar, MapPin, GraduationCap, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trainee, TestResult } from '@/lib/supabase';
import { searchTraineesAction, getTraineeStatusAction, getAllTraineesCachedAction } from '@/actions/quiz';

interface TraineeSelectorProps {
  onSelectTrainee: (trainee: Trainee, testType: 'pre' | 'post') => void;
  onViewResult: (trainee: Trainee, testType: 'pre' | 'post', result: TestResult) => void;
  preOpen?: boolean;
  postOpen?: boolean;
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
  return null;
};

export const TraineeSelector: React.FC<TraineeSelectorProps> = ({
  onSelectTrainee,
  onViewResult,
  preOpen,
  postOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Trainee[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const rosterCacheRef = React.useRef<Trainee[]>([]);

  const [status, setStatus] = useState<{
    preResult: TestResult | null;
    postResult: TestResult | null;
    settings: { pre_open: boolean; post_open: boolean };
  }>({
    preResult: null,
    postResult: null,
    settings: { pre_open: preOpen ?? true, post_open: postOpen ?? true },
  });

  // Keep live settings synchronized instantly with parent
  const isPreOpen = preOpen !== undefined ? preOpen : status.settings.pre_open;
  const isPostOpen = postOpen !== undefined ? postOpen : status.settings.post_open;

  const [isPickingTrainee, setIsPickingTrainee] = useState(false);

  // Preload Roster on Mount for Instant 0ms In-Memory Search (Auditorium Peak Load Resilience)
  useEffect(() => {
    getAllTraineesCachedAction().then((roster) => {
      if (roster && roster.length > 0) {
        rosterCacheRef.current = roster;
      }
    });
  }, []);

  // Instant In-Memory Search + Debounced Fallback with zero premature "ไม่พบข้อมูล" flashing
  useEffect(() => {
    let isSubscribed = true;
    const cleanQuery = searchQuery.trim().toLowerCase();

    if (!cleanQuery) {
      setResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(false);

    // If client roster cache is populated, instant in-memory search with 0 network latency!
    if (rosterCacheRef.current.length > 0) {
      const matched = rosterCacheRef.current
        .filter(
          (t) =>
            t.full_name.toLowerCase().includes(cleanQuery) ||
            t.student_no.includes(cleanQuery)
        )
        .slice(0, 15);

      setResults(matched);
      setIsSearching(false);
      setHasSearched(true);
      return;
    }

    // Fallback debounced server search
    const delayDebounceFn = setTimeout(async () => {
      const res = await searchTraineesAction(cleanQuery);
      if (isSubscribed) {
        setResults(res);
        setIsSearching(false);
        setHasSearched(true);
      }
    }, 150);

    return () => {
      isSubscribed = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery]);

  // Load status before showing the card so it renders smoothly without layout jumping
  const handlePickTrainee = async (trainee: Trainee) => {
    setIsPickingTrainee(true);
    const res = await getTraineeStatusAction(trainee.id);
    setStatus(res);
    setSelectedTrainee(trainee);
    setIsPickingTrainee(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* PREMIUM HERO WELCOME BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-3 pt-2 pb-1"
      >
        {/* Official Badge Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-sky-200/90 shadow-sm shadow-sky-100/60 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
          <span className="text-[11px] font-bold text-sky-900 tracking-wide">
            โครงการอบรมเชิงปฏิบัติการเพื่อขยายผล
          </span>
        </div>

        {/* Grand Typography */}
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            AI Assistants for Teachers
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-sky-700 max-w-xl mx-auto leading-relaxed">
            ร่วมขับเคลื่อนการเรียนรู้ด้วย AI เพื่อยกระดับคุณภาพการสอนอย่างยั่งยืน
          </p>
        </div>

        {/* Event Metadata Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-sky-100 shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
            <span>โรงเรียนสมเด็จพิทยาคม</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-sky-100 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>21 กันยายน 2569</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-sky-100 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>ณ หอประชุมศรีสมเด็จ</span>
          </span>
        </div>
      </motion.div>

      {/* SEARCH INPUT BOX (Only visible when no candidate is selected) */}
      {!selectedTrainee && !isPickingTrainee && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative"
        >
          <div className="bg-white rounded-2xl p-2.5 flex items-center gap-3 border border-sky-200 shadow-lg shadow-sky-100/60 focus-within:border-sky-500 focus-within:ring-3 focus-within:ring-sky-100 transition-all">
            <Search className="w-6 h-6 text-sky-500 ml-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ-นามสกุล เช่น ภูมิศักดิ์ หรือ เลขลำดับ 1 ถึง 161..."
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm sm:text-base outline-none py-2"
              suppressHydrationWarning
              autoFocus
            />

            {/* Search Spinner or Clear Button */}
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-3 shrink-0" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setResults([]);
                  setHasSearched(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 mr-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Dropdown Suggestions */}
          {searchQuery.trim().length > 0 && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-sky-100 shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100"
            >
              {results.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    handlePickTrainee(t);
                    setSearchQuery('');
                    setResults([]);
                    setHasSearched(false);
                  }}
                  className="w-full px-5 py-3.5 text-left hover:bg-sky-50/80 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors shadow-xs shrink-0">
                      {t.student_no}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                        {t.full_name}
                      </div>
                      <div className="text-xs text-sky-600 font-medium">
                        ผู้เข้าสอบลำดับที่ {t.student_no}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-sky-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                    เลือกผู้สอบ <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              ))}
            </motion.div>
          )}

          {/* Not Found Message (Only shown AFTER search has fully executed with 0 results) */}
          {searchQuery.trim().length > 0 && hasSearched && !isSearching && results.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-500 shadow-xl z-30">
              ไม่พบรายชื่อผู้เข้าสอบที่ตรงกับ &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </motion.div>
      )}

      {/* Loading Indicator when selecting trainee */}
      {isPickingTrainee && (
        <div className="py-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span>กำลังเตรียมข้อมูลแบบทดสอบ...</span>
        </div>
      )}

      {/* Selected Trainee Status Card (Smooth Entrance, No Height Pops) */}
      <AnimatePresence mode="wait">
        {selectedTrainee && !isPickingTrainee && (
          <motion.div
            key={selectedTrainee.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-white rounded-3xl p-6 sm:p-7 border border-sky-200/90 space-y-6 relative overflow-hidden shadow-xl shadow-sky-100/50"
          >
            {/* Header: Candidate Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl gradient-button text-white flex items-center justify-center font-black text-base shadow-md shadow-sky-500/25 shrink-0">
                  {selectedTrainee.student_no}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                    {selectedTrainee.full_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                    <span className="inline-flex items-center gap-1 font-bold text-sky-800 bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
                      ลำดับที่ {selectedTrainee.student_no}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 font-medium">โรงเรียนสมเด็จพิทยาคม</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTrainee(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50/80 hover:border-rose-200 transition-all shadow-2xs shrink-0 self-end sm:self-auto flex items-center gap-1.5"
              >
                <span>เปลี่ยนผู้สอบ</span>
              </button>
            </div>

            {/* Pre-test & Post-test Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* PRE-TEST CARD */}
              <div className="bg-gradient-to-b from-white to-sky-50/20 rounded-2xl p-5 border border-sky-100 shadow-sm flex flex-col justify-between space-y-4 hover:border-sky-300 transition-all">
                <div className="space-y-2.5">
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-xl bg-sky-100 text-sky-800 text-xs font-black uppercase tracking-wider shrink-0 border border-sky-200/70">
                      Pre-test
                    </span>
                    {status.preResult ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>เสร็จสิ้น</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-2xs whitespace-nowrap shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>รอดำเนินการ</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                    แบบทดสอบก่อนเรียน
                  </h4>
                </div>

                {status.preResult ? (
                  <div className="bg-white rounded-2xl p-4 text-xs space-y-2 border border-sky-100 shadow-2xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium text-slate-500">คะแนนที่ได้:</span>
                      <span className="font-black text-emerald-600 text-base">
                        {status.preResult.score} / {status.preResult.total_questions} ({status.preResult.percentage}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" /> เวลาที่ใช้:
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatDuration((status.preResult as any).duration_seconds, status.preResult.submitted_at) || 'ประมาณ 4-6 นาที'}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[10px] pt-0.5">
                      ทำเมื่อ: {new Date(status.preResult.submitted_at).toLocaleString('th-TH')}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed py-1">
                    ทดสอบความรู้พื้นฐานก่อนเข้าร่วมการอบรม เพื่อใช้เปรียบเทียบวัดผลความก้าวหน้า
                  </p>
                )}

                <div className="pt-2">
                  {status.preResult ? (
                    <button
                      onClick={() => onViewResult(selectedTrainee, 'pre', status.preResult!)}
                      className="h-11 w-full rounded-xl bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold transition-all border border-sky-200 shadow-2xs hover:scale-[1.01] flex items-center justify-center gap-1.5"
                    >
                      <span>ดูผลคะแนน Pre-test</span>
                    </button>
                  ) : (
                    <button
                      disabled={!isPreOpen}
                      onClick={() => onSelectTrainee(selectedTrainee, 'pre')}
                      className={`h-11 w-full rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isPreOpen
                          ? 'gradient-button text-white shadow-md shadow-sky-500/25 hover:scale-[1.01]'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                      }`}
                    >
                      <PlayCircle className={`w-4 h-4 ${isPreOpen ? 'animate-pulse' : ''}`} />
                      {isPreOpen ? 'เริ่มทำ Pre-test' : '🔒 ปิดรับการทำแบบทดสอบชั่วคราว'}
                    </button>
                  )}
                </div>
              </div>

              {/* POST-TEST CARD */}
              <div className="bg-gradient-to-b from-white to-blue-50/20 rounded-2xl p-5 border border-sky-100 shadow-sm flex flex-col justify-between space-y-4 hover:border-sky-300 transition-all">
                <div className="space-y-2.5">
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider shrink-0 border border-blue-200/70">
                      Post-test
                    </span>
                    {status.postResult ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>เสร็จสิ้น</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 shadow-2xs whitespace-nowrap shrink-0">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>รอดำเนินการ</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                    แบบทดสอบหลังเรียน
                  </h4>
                </div>

                {status.postResult ? (
                  <div className="bg-white rounded-2xl p-4 text-xs space-y-2 border border-sky-100 shadow-2xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium text-slate-500">คะแนนที่ได้:</span>
                      <span className="font-black text-sky-600 text-base">
                        {status.postResult.score} / {status.postResult.total_questions} ({status.postResult.percentage}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" /> เวลาที่ใช้:
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatDuration((status.postResult as any).duration_seconds, status.postResult.submitted_at) || 'ประมาณ 4-6 นาที'}
                      </span>
                    </div>
                    {status.postResult.gain_score !== null && (
                      <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-100">
                        <span className="text-slate-500">คะแนนพัฒนาการ (+Gain):</span>
                        <span className="font-black text-emerald-600 text-xs">
                          +{status.postResult.gain_score} คะแนน
                        </span>
                      </div>
                    )}
                    <div className="text-slate-400 text-[10px] pt-0.5">
                      ทำเมื่อ: {new Date(status.postResult.submitted_at).toLocaleString('th-TH')}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed py-1">
                    วัดผลสัมฤทธิ์หลังเสร็จสิ้นการอบรม เพื่อประเมินทักษะและคำนวณ Gain Score
                  </p>
                )}

                <div className="pt-2">
                  {status.postResult ? (
                    <button
                      onClick={() => onViewResult(selectedTrainee, 'post', status.postResult!)}
                      className="h-11 w-full rounded-xl bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold transition-all border border-sky-200 shadow-2xs hover:scale-[1.01] flex items-center justify-center gap-1.5"
                    >
                      <span>ดูผลคะแนน Post-test</span>
                    </button>
                  ) : (
                    <button
                      disabled={!isPostOpen}
                      onClick={() => onSelectTrainee(selectedTrainee, 'post')}
                      className={`h-11 w-full rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isPostOpen
                          ? 'gradient-button text-white shadow-md shadow-sky-500/25 hover:scale-[1.01]'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                      }`}
                    >
                      <PlayCircle className={`w-4 h-4 ${isPostOpen ? 'animate-pulse' : ''}`} />
                      {isPostOpen ? 'เริ่มทำ Post-test' : '🔒 ปิดรับการทำแบบทดสอบชั่วคราว'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
