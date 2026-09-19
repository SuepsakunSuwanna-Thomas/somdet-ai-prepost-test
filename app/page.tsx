'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { TraineeSelector } from '@/components/TraineeSelector';
import { QuizView } from '@/components/QuizView';
import { ResultView } from '@/components/ResultView';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Trainee, QuizQuestionClient, TestResult } from '@/lib/supabase';
import { fetchQuizQuestionsAction, getTraineeStatusAction } from '@/actions/quiz';
import { verifyAdminPasscodeAction, logoutAdminAction, checkAdminSessionAction } from '@/actions/admin';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState<'home' | 'quiz' | 'result' | 'admin'>('home');
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [testType, setTestType] = useState<'pre' | 'post'>('pre');
  const [questions, setQuestions] = useState<QuizQuestionClient[]>([]);
  const [resultData, setResultData] = useState<any | null>(null);

  // System Availability Status
  const [preOpen, setPreOpen] = useState(true);
  const [postOpen, setPostOpen] = useState(true);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  // Initial Load: check session & settings
  useEffect(() => {
    const initSettings = async () => {
      const { settings } = await getTraineeStatusAction('placeholder-id');
      setPreOpen(settings.pre_open);
      setPostOpen(settings.post_open);

      // Check existing admin session securely
      const session = await checkAdminSessionAction();
      if (session.isAdmin) {
        setIsAdminLoggedIn(true);
      }
    };
    initSettings();
  }, []);

  // Launch Quiz for Selected Trainee
  const handleStartQuiz = async (trainee: Trainee, type: 'pre' | 'post') => {
    setSelectedTrainee(trainee);
    setTestType(type);
    setIsLoadingQuiz(true);
    setErrorMessage(null);

    const res = await fetchQuizQuestionsAction(type, trainee.id);

    if (res.success && res.data) {
      setQuestions(res.data);
      setActiveView('quiz');
    } else {
      setErrorMessage(res.error || 'ไม่สามารถโหลดแบบทดสอบได้');
    }
    setIsLoadingQuiz(false);
  };

  // View existing test result
  const handleViewResult = (trainee: Trainee, type: 'pre' | 'post', result: TestResult) => {
    setSelectedTrainee(trainee);
    setTestType(type);
    setResultData({
      score: result.score,
      total_questions: result.total_questions,
      percentage: result.percentage,
      pre_score: type === 'post' ? null : result.score,
      gain_score: result.gain_score,
      submitted_at: result.submitted_at,
      duration_seconds: (result as any).answers_payload?._duration_seconds
        ? Number((result as any).answers_payload._duration_seconds)
        : (result as any).duration_seconds ?? null,
    });
    setActiveView('result');
  };

  // Admin Login Handler with Server-Side Verification
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingAdmin(true);
    setAdminAuthError(null);

    const res = await verifyAdminPasscodeAction(adminPassword);
    setIsVerifyingAdmin(false);

    if (res.success) {
      setIsAdminLoggedIn(true);
      setShowAdminModal(false);
      setAdminPassword('');
      setAdminAuthError(null);
      setActiveView('admin');
    } else {
      setAdminAuthError(res.error || 'รหัสผ่านเข้าสู่ระบบไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-x-hidden">
      


      {/* HEADER NAVBAR */}
      <Header
        preOpen={preOpen}
        postOpen={postOpen}
        onOpenAdminModal={() => setShowAdminModal(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onToggleAdminView={() => setActiveView(activeView === 'admin' ? 'home' : 'admin')}
        onLogoutAdmin={async () => {
          await logoutAdminAction();
          setIsAdminLoggedIn(false);
          setActiveView('home');
        }}
        activeView={activeView}
        onGoHome={() => {
          setActiveView('home');
          setSelectedTrainee(null);
          setResultData(null);
        }}
      />

      {/* MAIN CONTENT ROUTER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-8 flex flex-col">
        
        {/* Loading Overlay */}
        {isLoadingQuiz && (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              กำลังสุ่มและจัดเตรียมแบบทดสอบสำหรับคุณ...
            </p>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && !isLoadingQuiz && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isLoadingQuiz && (
          <AnimatePresence mode="wait">
            
            {/* VIEW 1: TRAINEE DISCOVERY & SEARCH */}
            {activeView === 'home' && (
              <motion.div
                key="home-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <TraineeSelector
                  onSelectTrainee={handleStartQuiz}
                  onViewResult={handleViewResult}
                />
              </motion.div>
            )}

            {/* VIEW 2: ULTRA-SMOOTH QUIZ INTERFACE */}
            {activeView === 'quiz' && selectedTrainee && (
              <motion.div
                key="quiz-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              >
                <QuizView
                  trainee={selectedTrainee}
                  testType={testType}
                  questions={questions}
                  onBack={() => setActiveView('home')}
                  onSubmitSuccess={(result) => {
                    setResultData(result);
                    setActiveView('result');
                  }}
                />
              </motion.div>
            )}

            {/* VIEW 3: RESULT & CELEBRATION */}
            {activeView === 'result' && selectedTrainee && resultData && (
              <motion.div
                key="result-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <ResultView
                  trainee={selectedTrainee}
                  testType={testType}
                  result={resultData}
                  onHome={() => {
                    setSelectedTrainee(null);
                    setResultData(null);
                    setActiveView('home');
                  }}
                />
              </motion.div>
            )}

            {/* VIEW 4: MODERN ADMIN DASHBOARD */}
            {activeView === 'admin' && isAdminLoggedIn && (
              <motion.div
                key="admin-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <AdminDashboard
                  onBackToHome={() => setActiveView('home')}
                  onLogout={() => {
                    setIsAdminLoggedIn(false);
                    setActiveView('home');
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>



      {/* ADMIN LOGIN MODAL */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-sky-100 space-y-5 text-center shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Lock className="w-4 h-4 text-sky-600" />
                  <span>เข้าสู่ระบบผู้ดูแลระบบ</span>
                </div>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                    รหัสผ่าน Admin Passcode
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="ระบุรหัสผ่านผู้ดูแลระบบ..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs outline-none focus:border-sky-500 focus:bg-white transition-colors"
                    autoFocus
                  />
                </div>

                {adminAuthError && (
                  <p className="text-[11px] text-rose-700 text-left bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {adminAuthError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingAdmin}
                  className="w-full h-11 rounded-xl gradient-button text-white text-xs font-bold shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 disabled:opacity-70 transition-all hover:scale-[1.01]"
                >
                  {isVerifyingAdmin ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังตรวจสอบสิทธิ์...</span>
                    </>
                  ) : (
                    <span>เข้าสู่แอดมินแดชบอร์ด</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
