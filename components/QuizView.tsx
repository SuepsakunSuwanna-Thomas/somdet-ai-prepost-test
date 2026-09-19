'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Send,
  ArrowLeft, X, Clock, Music, Volume2, VolumeX, Sparkles, Check
} from 'lucide-react';
import { Trainee, QuizQuestionClient } from '@/lib/supabase';
import { submitQuizAction } from '@/actions/quiz';

interface QuizViewProps {
  trainee: Trainee;
  testType: 'pre' | 'post';
  questions: QuizQuestionClient[];
  onBack: () => void;
  onSubmitSuccess: (result: any) => void;
}

// =========================================================================
// RELAXING CHILL / LOFI AMBIENT MUSIC ENGINE (High-Fidelity Web Audio API)
// Produces a warm, soothing 4-chord progression with soft Rhodes chime arpeggios
// =========================================================================
class RelaxingAmbientEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: any = null;
  private masterGain: GainNode | null = null;
  private chordIndex = 0;

  // Soothing 4-chord jazz/chill progression
  private chords = [
    // 1. C major 9 (warm & open)
    { root: 130.81, notes: [261.63, 329.63, 392.00, 493.88, 587.33] },
    // 2. A minor 9 (peaceful & introspective)
    { root: 110.00, notes: [220.00, 261.63, 329.63, 392.00, 493.88] },
    // 3. F major 7 (gentle & hopeful)
    { root: 87.31,  notes: [174.61, 220.00, 261.63, 329.63, 392.00] },
    // 4. G suspended 9 (cozy resolution)
    { root: 98.00,  notes: [196.00, 261.63, 293.66, 392.00, 493.88] },
  ];

  public start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      
      // Auto-resume if browser started suspended
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime); // Pleasant audible study volume
      this.masterGain.connect(this.ctx.destination);
      this.isPlaying = true;

      const playNextChord = () => {
        if (!this.ctx || !this.isPlaying || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const currentChord = this.chords[this.chordIndex % this.chords.length];
        this.chordIndex++;

        // 1. Soft Warm Ambient Pad Drone
        const padOsc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        const padFilter = this.ctx.createBiquadFilter();

        padOsc.type = 'triangle';
        padOsc.frequency.setValueAtTime(currentChord.root * 2, now);

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(450, now);

        const padDuration = 3.8;
        padGain.gain.setValueAtTime(0.001, now);
        padGain.gain.linearRampToValueAtTime(0.045, now + 1.0);
        padGain.gain.exponentialRampToValueAtTime(0.001, now + padDuration);

        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.masterGain);

        padOsc.start(now);
        padOsc.stop(now + padDuration);

        // 2. Gentle Rhodes / Chime Arpeggio (3 soft bell notes)
        const notesToPlay = [
          currentChord.notes[0],
          currentChord.notes[2],
          currentChord.notes[3] || currentChord.notes[1]
        ];

        notesToPlay.forEach((freq, i) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.45);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1200, now);

          const noteStart = now + i * 0.45;
          const noteDuration = 2.8;

          gain.gain.setValueAtTime(0.0001, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.07, noteStart + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain);

          osc.start(noteStart);
          osc.stop(noteStart + noteDuration + 0.1);
        });
      };

      playNextChord();
      this.timerId = setInterval(playNextChord, 3600);
    } catch (e) {
      console.warn('Audio Context init error:', e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) clearInterval(this.timerId);
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// Gentle click / option sound
const playInteractionSound = (type: 'select' | 'nav') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'select') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'nav') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }
  } catch (e) {}
};

// Fisher-Yates array shuffle utility
function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const QuizView: React.FC<QuizViewProps> = ({
  trainee,
  testType,
  questions,
  onBack,
  onSubmitSuccess,
}) => {
  // Shuffled Question Order & Shuffled Choice Keys State
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestionClient[]>([]);
  const [shuffledChoicesMap, setShuffledChoicesMap] = useState<Record<string, string[]>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [unansweredWarning, setUnansweredWarning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Relaxing ambient music
  const ambientEngineRef = useRef<RelaxingAmbientEngine | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Live Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Initialize and automatically start relaxing background music
  useEffect(() => {
    const engine = new RelaxingAmbientEngine();
    ambientEngineRef.current = engine;
    engine.start();
    setIsMusicPlaying(true);

    return () => {
      engine.stop();
    };
  }, []);

  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Initialize Random Shuffle (Questions + Choices) with LocalStorage Draft Persistence
  useEffect(() => {
    if (!questions || questions.length === 0) return;

    try {
      const draftKey = `quiz_progress_${trainee.id}_${testType}`;
      const saved = localStorage.getItem(draftKey);
      let restoredQOrder: string[] | null = null;
      let restoredChoicesMap: Record<string, string[]> | null = null;
      let savedAnswers: Record<string, string> = {};
      let savedSecs = 0;
      let savedIdx = 0;
      let hadValidDraft = false;

      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (Array.isArray(parsed.questionOrder) && parsed.questionOrder.length > 0) {
            restoredQOrder = parsed.questionOrder;
          }
          if (parsed.choicesOrder && typeof parsed.choicesOrder === 'object') {
            restoredChoicesMap = parsed.choicesOrder;
          }
          if (parsed.answers && typeof parsed.answers === 'object' && Object.keys(parsed.answers).length > 0) {
            savedAnswers = parsed.answers;
            hadValidDraft = true;
          }
          if (typeof parsed.secondsElapsed === 'number' && parsed.secondsElapsed > 0) {
            savedSecs = parsed.secondsElapsed;
          }
          if (typeof parsed.currentIndex === 'number' && parsed.currentIndex >= 0) {
            savedIdx = Math.min(parsed.currentIndex, questions.length - 1);
          }
        }
      }

      // 1. Determine Questions Order (Restored from active draft OR randomly shuffled)
      let orderedQuestions: QuizQuestionClient[] = [];
      if (restoredQOrder) {
        const qMap = new Map(questions.map((q) => [q.id, q]));
        restoredQOrder.forEach((id) => {
          const found = qMap.get(id);
          if (found) {
            orderedQuestions.push(found);
            qMap.delete(id);
          }
        });
        // Append any remaining questions
        qMap.forEach((q) => orderedQuestions.push(q));
      } else {
        // Randomly shuffle questions
        orderedQuestions = shuffleArray(questions);
      }

      // 2. Determine Choices Order per Question (Restored from active draft OR randomly shuffled)
      const choicesMap: Record<string, string[]> = {};
      orderedQuestions.forEach((q) => {
        const originalKeys = Object.keys(q.choices);
        if (restoredChoicesMap && Array.isArray(restoredChoicesMap[q.id])) {
          const savedKeys = restoredChoicesMap[q.id].filter((k) => originalKeys.includes(k));
          const missingKeys = originalKeys.filter((k) => !savedKeys.includes(k));
          choicesMap[q.id] = [...savedKeys, ...missingKeys];
        } else {
          // Randomly shuffle choices for this question
          choicesMap[q.id] = shuffleArray(originalKeys);
        }
      });

      setShuffledQuestions(orderedQuestions);
      setShuffledChoicesMap(choicesMap);

      if (hadValidDraft) {
        setAnswers(savedAnswers);
        setSecondsElapsed(savedSecs);
        setCurrentIndex(savedIdx);
        setIsDraftRestored(true);
      }
      setIsInitialized(true);
    } catch (e) {
      console.warn('Could not initialize/restore quiz state:', e);
      setShuffledQuestions(shuffleArray(questions));
      const fallbackMap: Record<string, string[]> = {};
      questions.forEach((q) => {
        fallbackMap[q.id] = shuffleArray(Object.keys(q.choices));
      });
      setShuffledChoicesMap(fallbackMap);
      setIsInitialized(true);
    }
  }, [trainee.id, testType, questions]);

  // Autosave Progress to LocalStorage on change (including current shuffled orders)
  useEffect(() => {
    if (!isInitialized || shuffledQuestions.length === 0) return;
    if (Object.keys(answers).length > 0 || secondsElapsed > 0) {
      try {
        const draftKey = `quiz_progress_${trainee.id}_${testType}`;
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            answers,
            secondsElapsed,
            currentIndex,
            questionOrder: shuffledQuestions.map((q) => q.id),
            choicesOrder: shuffledChoicesMap,
            updatedAt: Date.now(),
          })
        );
      } catch (e) {
        // Safe failover
      }
    }
  }, [answers, secondsElapsed, currentIndex, shuffledQuestions, shuffledChoicesMap, isInitialized, trainee.id, testType]);

  // Timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleAmbientMusic = () => {
    if (!ambientEngineRef.current) return;
    const nextState = ambientEngineRef.current.toggle();
    setIsMusicPlaying(nextState);
  };

  // Active question list with fallback
  const displayQuestions = shuffledQuestions.length > 0 ? shuffledQuestions : questions;
  const currentQuestion = displayQuestions[currentIndex] || displayQuestions[0];
  const answeredCount = Object.keys(answers).length;
  const totalCount = displayQuestions.length;
  const progressPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  const isAllAnswered = answeredCount === totalCount && totalCount > 0;

  const selectOption = (choiceKey: string) => {
    if (!currentQuestion) return;
    playInteractionSound('select');

    // If music wasn't started due to browser autoplay policy, start it on first tap
    if (ambientEngineRef.current && !ambientEngineRef.current.getIsPlaying() && isMusicPlaying) {
      ambientEngineRef.current.start();
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choiceKey,
    }));
    setUnansweredWarning(null);
  };

  const handleNavigate = (idx: number) => {
    playInteractionSound('nav');
    setCurrentIndex(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const attemptSubmitOrJump = () => {
    const firstUnansweredIdx = displayQuestions.findIndex((q) => !answers[q.id]);
    if (firstUnansweredIdx !== -1) {
      handleNavigate(firstUnansweredIdx);
      setUnansweredWarning(`กรุณาตอบข้อ ${firstUnansweredIdx + 1} ให้เรียบร้อยก่อนส่งแบบทดสอบ (ตอบแล้ว ${answeredCount}/${totalCount} ข้อ)`);
      return;
    }
    setUnansweredWarning(null);
    setShowConfirmModal(true);
  };

  // Submit with Auto-Retry and Exponential Backoff (Handles 160+ simultaneous peak submits)
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setRetryAttempt(0);

    const maxRetries = 3;
    let lastError = 'เกิดข้อผิดพลาดในการส่งข้อสอบ';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          setRetryAttempt(attempt);
          // Wait 1.2s before attempt 2, 2.4s before attempt 3
          await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
        }

        const res = await submitQuizAction(trainee.id, testType, answers, secondsElapsed);
        if (res.success) {
          // Clear autosave draft
          try {
            localStorage.removeItem(`quiz_progress_${trainee.id}_${testType}`);
          } catch (e) {}

          ambientEngineRef.current?.stop();
          onSubmitSuccess(res.result);
          return;
        } else {
          lastError = res.error || lastError;
          // Stop retrying if already submitted or business rule violated
          if (
            res.error?.includes('ท่านได้ส่งแบบทดสอบนี้ไปแล้ว') ||
            res.error?.includes('ผู้เรียนได้ทำแบบทดสอบ') ||
            res.error?.includes('ปิดอยู่ขณะนี้')
          ) {
            break;
          }
        }
      } catch (networkErr: any) {
        lastError = 'การเชื่อมต่อเครือข่ายขัดข้อง กำลังส่งข้อมูลใหม่อัตโนมัติ...';
      }
    }

    setErrorMsg(lastError);
    setIsSubmitting(false);
  };

  if (!currentQuestion) {
    return (
      <div className="text-center py-16 text-slate-500">
        ไม่พบข้อมูลข้อสอบ
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-24 sm:pb-12">
      
      {/* AUTOSAVE DRAFT RESTORED NOTICE (OFFLINE RESILIENCE) */}
      {isDraftRestored && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              ระบบกู้คืนคำตอบและเวลาที่ท่านทำไว้ก่อนหน้าเรียบร้อยแล้ว (สามารถทำต่อได้ทันที)
            </span>
          </div>
          <button
            onClick={() => setIsDraftRestored(false)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MINIMALIST TOP HEADER */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-sky-100 shadow-xs flex items-center justify-between gap-3">
        {/* Left: Candidate Info (Clean, No repeated student number) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs" title={`ลำดับที่ ${trainee.student_no}`}>
            {trainee.student_no}
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
              {trainee.full_name}
            </div>
            <div className="text-[11px] text-sky-700 font-semibold truncate">
              {testType === 'pre' ? 'แบบทดสอบก่อนเรียน (Pre-test)' : 'แบบทดสอบหลังเรียน (Post-test)'}
            </div>
          </div>
        </div>

        {/* Right: Ambient Music & Live Timer */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Relaxing Music Button (Icon only on Mobile) */}
          <button
            onClick={toggleAmbientMusic}
            className={`h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border transition-all ${
              isMusicPlaying
                ? 'bg-sky-50 border-sky-300 text-sky-700 ring-1 ring-sky-200 shadow-xs'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'
            }`}
            title={isMusicPlaying ? 'คลิกเพื่อปิดดนตรีคลอ' : 'คลิกเพื่อเปิดดนตรีคลอ'}
            aria-label={isMusicPlaying ? 'คลิกเพื่อปิดดนตรีคลอ' : 'คลิกเพื่อเปิดดนตรีคลอ'}
          >
            <Music className={`w-3.5 h-3.5 ${isMusicPlaying ? 'text-sky-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-[11px] font-bold hidden sm:inline">
              {isMusicPlaying ? 'ดนตรีคลอ' : 'เปิดเพลง'}
            </span>
            {isMusicPlaying && (
              <span className="hidden sm:flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 h-2 bg-sky-500 rounded-full animate-bounce" />
                <span className="w-0.5 h-2.5 bg-sky-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-0.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </span>
            )}
          </button>

          {/* Live Stopwatch / Total Exam Time */}
          <div
            className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-sky-50/80 border border-sky-200 text-sky-900 font-mono text-xs font-bold shadow-2xs"
            title="เวลาในการทำข้อสอบทั้งหมด"
          >
            <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span className="text-[11px] font-sans font-bold text-sky-700 hidden sm:inline">เวลาที่ใช้:</span>
            <span>{formatTimer(secondsElapsed)}</span>
          </div>
        </div>
      </div>

      {/* QUICK QUESTION JUMP BAR */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-sky-100 shadow-xs space-y-2">
        {/* Number Pills 1-10 */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          {displayQuestions.map((q, idx) => {
            const isDone = !!answers[q.id];
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => handleNavigate(idx)}
                className={`min-w-[34px] sm:min-w-[38px] h-8 sm:h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 border ${
                  isCurrent
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/25 scale-105'
                    : isDone
                    ? 'bg-sky-50 text-sky-800 border-sky-200 font-bold'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* UNANSWERED WARNING BANNER */}
      <AnimatePresence>
        {unansweredWarning && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{unansweredWarning}</span>
            </div>
            <button
              onClick={() => setUnansweredWarning(null)}
              className="text-amber-500 hover:text-amber-700 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN QUESTION CARD (Clean, Minimalist, Distraction-Free) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-3xl p-5 sm:p-7 border border-sky-100 shadow-lg shadow-sky-100/30 space-y-5 relative"
        >
          {/* Question Header */}
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-sky-600 uppercase tracking-wider">
                ข้อที่ {currentIndex + 1} จาก {totalCount}
              </span>
              {answers[currentQuestion.id] && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                  <Check className="w-3 h-3 text-sky-600" /> ตอบแล้ว
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQuestion.prompt}
            </h3>
          </div>

          {/* Choice Cards (Touch Friendly, Clean, Randomly Shuffled) */}
          <div className="space-y-2.5">
            {(shuffledChoicesMap[currentQuestion.id] || Object.keys(currentQuestion.choices)).map((origKey, idx) => {
              const text = currentQuestion.choices[origKey];
              if (text === undefined) return null;
              const isSelected = answers[currentQuestion.id] === origKey;
              const displayLabel = String.fromCharCode(65 + idx); // A, B, C, D

              return (
                <button
                  key={origKey}
                  type="button"
                  onClick={() => selectOption(origKey)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center gap-3.5 min-h-[56px] ${
                    isSelected
                      ? 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-200 shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/20'
                  }`}
                >
                  {/* Choice Letter Circle */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm uppercase shrink-0 transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {displayLabel}
                  </div>

                  {/* Choice Text */}
                  <span className={`text-sm sm:text-base flex-1 leading-snug ${
                    isSelected ? 'font-bold text-sky-950' : 'text-slate-800 font-normal'
                  }`}>
                    {text}
                  </span>

                  {/* Checked Icon */}
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* DESKTOP ACTION BUTTONS */}
      <div className="hidden sm:flex items-center justify-between gap-3 pt-2">
        <button
          disabled={currentIndex === 0}
          onClick={() => handleNavigate(currentIndex - 1)}
          className={`h-11 px-5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
            currentIndex === 0
              ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>ข้อก่อนหน้า</span>
        </button>

        <div className="flex items-center gap-2.5">
          {currentIndex < totalCount - 1 ? (
            <button
              onClick={() => handleNavigate(currentIndex + 1)}
              className="h-11 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>ข้อถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={attemptSubmitOrJump}
              className={`h-11 text-xs font-bold px-7 rounded-xl shadow-md transition-all flex items-center gap-2 ${
                isAllAnswered
                  ? 'gradient-button text-white shadow-sky-500/25 scale-100 hover:scale-[1.02]'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isAllAnswered ? 'ส่งข้อสอบ (ตอบครบแล้ว)' : `ส่งข้อสอบ (${answeredCount}/${totalCount})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR (Thumb-friendly) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-sky-100 p-3 shadow-2xl safe-area-pb">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <button
            disabled={currentIndex === 0}
            onClick={() => handleNavigate(currentIndex - 1)}
            className={`h-11 w-11 rounded-xl border text-xs font-bold flex items-center justify-center shrink-0 ${
              currentIndex === 0
                ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-700 border-slate-200 shadow-xs'
            }`}
            aria-label="ข้อก่อนหน้า"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {currentIndex < totalCount - 1 ? (
            <button
              onClick={() => handleNavigate(currentIndex + 1)}
              className="h-11 flex-1 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 text-center flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>ข้อถัดไป ({currentIndex + 1}/{totalCount})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={attemptSubmitOrJump}
              className={`h-11 flex-1 px-4 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                isAllAnswered
                  ? 'gradient-button text-white shadow-sky-500/25'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-sky-50 hover:text-sky-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isAllAnswered ? 'ส่งข้อสอบ (ตอบครบแล้ว)' : `ส่งข้อสอบ (${answeredCount}/${totalCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* CONFIRM SUBMISSION MODAL (ONLY ACCESSIBLE WHEN ALL ANSWERED) */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-sky-100 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-slate-900">
                  ยืนยันการส่งข้อสอบ?
                </h4>
                <p className="text-xs text-slate-600">
                  คุณได้ตอบครบทั้ง <strong className="text-emerald-700 font-bold">{totalCount}</strong> ข้อแล้ว
                  ระบบจะทำการบันทึกและประเมินผลคะแนนทันที
                </p>
              </div>

              {retryAttempt > 1 && (
                <div className="p-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังส่งข้อมูลใหม่รอบที่ {retryAttempt}/3 (เครือข่ายหนาแน่น)...</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs text-left">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmModal(false)}
                  className="h-11 flex-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  กลับไปแก้ไข
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="h-11 flex-1 rounded-xl gradient-button text-white text-xs font-bold shadow-md shadow-sky-500/25 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังส่ง...</span>
                    </>
                  ) : (
                    <span>ยืนยันส่ง</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
