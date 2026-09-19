'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CheckCircle2, TrendingUp, Download, RefreshCw, SwitchCamera,
  BarChart3, FileSpreadsheet, PlusCircle, Edit3, Eye, Search, ShieldCheck, Sparkles, X,
  Trash2, AlertTriangle, RotateCcw, Check, ArrowUpRight, Clock, Award
} from 'lucide-react';
import { AdminAnalytics, Question, supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  getAdminAnalyticsAction, toggleSystemSettingAction, getDetailedResultsAction,
  getQuestionBankAction, upsertQuestionAction, deleteQuestionAction,
  deleteTraineeResultAction, resetAllTestResultsAction
} from '@/actions/admin';
import { getSystemSettingsAction } from '@/actions/quiz';

interface AdminDashboardProps {
  onBackToHome: () => void;
  onLogout?: () => void;
}

// Thai educational evaluation criteria
const getDifficultyBadge = (p: number) => {
  if (p > 0.80) return { label: 'ง่ายมาก', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (p > 0.60) return { label: 'ค่อนข้างง่าย', color: 'bg-sky-50 text-sky-700 border-sky-200' };
  if (p >= 0.40) return { label: 'ยากง่ายพอเหมาะ', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' };
  if (p >= 0.20) return { label: 'ค่อนข้างยาก', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'ยากมาก', color: 'bg-rose-50 text-rose-700 border-rose-200' };
};

const getDiscriminationBadge = (r: number) => {
  if (r >= 0.40) return { label: 'จำแนกดีมาก', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' };
  if (r >= 0.30) return { label: 'จำแนกดี', color: 'bg-teal-50 text-teal-700 border-teal-200' };
  if (r >= 0.20) return { label: 'จำแนกพอใช้', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'ควรปรับปรุง', color: 'bg-rose-50 text-rose-700 border-rose-200' };
};

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

const formatShortDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}ว.`;
  return `${mins}น. ${secs > 0 ? `${secs}ว.` : ''}`;
};

const getTotalDuration = (preSec?: number | null, postSec?: number | null) => {
  const total = (preSec || 0) + (postSec || 0);
  if (total <= 0) return null;
  return formatDuration(total);
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToHome, onLogout }) => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [resultsTable, setResultsTable] = useState<any[]>([]);
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // System toggles state
  const [preOpen, setPreOpen] = useState(true);
  const [postOpen, setPostOpen] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Table filters & sub-tabs
  const [traineeFilter, setTraineeFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [tableSearch, setTableSearch] = useState('');

  // Modals & Tab Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'trainees' | 'item_analysis'>('overview');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  // Confirmation Modals
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [traineeToDeleteResult, setTraineeToDeleteResult] = useState<{ trainee: any; type: 'pre' | 'post' | 'all' } | null>(null);
  const [isDeletingTraineeResult, setIsDeletingTraineeResult] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [analyticsRes, tableRes, qBankRes, settingsRes] = await Promise.all([
      getAdminAnalyticsAction(),
      getDetailedResultsAction(),
      getQuestionBankAction(),
      getSystemSettingsAction(),
    ]);

    if (analyticsRes.success && analyticsRes.data) {
      setAnalytics(analyticsRes.data);
    }
    setResultsTable(tableRes);
    setQuestionBank(qBankRes);
    if (settingsRes) {
      setPreOpen(settingsRes.pre_open);
      setPostOpen(settingsRes.post_open);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime Channel for live settings sync across multiple admin tabs
    let channel: any = null;
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel('realtime_system_settings_admin')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_settings' },
          (payload: any) => {
            if (payload.new && payload.new.key) {
              if (payload.new.key === 'pre_test_open') {
                setPreOpen(payload.new.value?.enabled ?? true);
              } else if (payload.new.key === 'post_test_open') {
                setPostOpen(payload.new.value?.enabled ?? true);
              }
            }
          }
        )
        .subscribe();
    }

    const pollInterval = setInterval(async () => {
      const s = await getSystemSettingsAction();
      setPreOpen(s.pre_open);
      setPostOpen(s.post_open);
    }, 2500);

    return () => {
      if (channel && isSupabaseConfigured()) {
        supabase.removeChannel(channel);
      }
      clearInterval(pollInterval);
    };
  }, []);

  const handleToggleSetting = async (key: 'pre_test_open' | 'post_test_open', currentVal: boolean) => {
    setIsToggling(true);
    const newVal = !currentVal;
    if (key === 'pre_test_open') setPreOpen(newVal);
    if (key === 'post_test_open') setPostOpen(newVal);

    await toggleSystemSettingAction(key, newVal);
    setIsToggling(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!resultsTable || resultsTable.length === 0) return;

    const headers = [
      'Student No',
      'Full Name',
      'Pre Score (10)',
      'Pre Pct (%)',
      'Pre Duration (Sec)',
      'Post Score (10)',
      'Post Pct (%)',
      'Post Duration (Sec)',
      'Total Duration (Sec)',
      'Gain Score',
      'Pre Submitted',
      'Post Submitted',
    ];
    const rows = resultsTable.map((r) => {
      const preDur = r.pre_duration_seconds ?? '';
      const postDur = r.post_duration_seconds ?? '';
      const totalDur = (r.pre_duration_seconds || 0) + (r.post_duration_seconds || 0) || '';
      return [
        `"${r.student_no}"`,
        `"${r.full_name}"`,
        r.pre_score ?? '',
        r.pre_pct ?? '',
        preDur,
        r.post_score ?? '',
        r.post_pct ?? '',
        postDur,
        totalDur,
        r.gain_score ?? '',
        r.pre_submitted ? `"${r.pre_submitted}"` : '',
        r.post_submitted ? `"${r.post_submitted}"` : '',
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quiz_results_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all test results (Clears submissions without deleting trainees or questions)
  const handleResetAllSubmissions = async () => {
    setIsResettingAll(true);
    await resetAllTestResultsAction();
    setIsResettingAll(false);
    setShowResetAllModal(false);
    loadData();
  };

  // Delete individual trainee test results
  const handleDeleteTraineeResult = async () => {
    if (!traineeToDeleteResult) return;
    setIsDeletingTraineeResult(true);
    await deleteTraineeResultAction(traineeToDeleteResult.trainee.id, traineeToDeleteResult.type);
    setIsDeletingTraineeResult(false);
    setTraineeToDeleteResult(null);
    setSelectedCandidate(null);
    loadData();
  };

  // Delete question
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    setIsDeletingQuestion(true);
    await deleteQuestionAction(questionToDelete.id);
    setIsDeletingQuestion(false);
    setQuestionToDelete(null);
    if (editingQuestion && editingQuestion.id === questionToDelete.id) {
      setEditingQuestion(null);
    }
    loadData();
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !editingQuestion.prompt) return;
    await upsertQuestionAction(editingQuestion);
    setEditingQuestion(null);
    loadData();
  };

  // Trainees counts & sorting logic:
  // - "ทำแล้ว": sort by latest submitted_at descending ("ใครทำล่าสุดไว้บนสุด")
  // - "ยังไม่ทำ": sort by student_no ascending ("เรียงเลขด้วยว่าใครมาก่อนมาหลัง")
  // - "ทั้งหมด": sort by student_no ascending
  const completedCount = resultsTable.filter((r) => r.pre_score !== null || r.post_score !== null).length;
  const pendingCount = resultsTable.filter((r) => r.pre_score === null && r.post_score === null).length;

  const filteredAndSortedResults = resultsTable
    .filter((r) => {
      const matchesSearch =
        r.full_name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        r.student_no.includes(tableSearch);
      if (!matchesSearch) return false;

      const hasDone = r.pre_score !== null || r.post_score !== null;
      if (traineeFilter === 'completed') return hasDone;
      if (traineeFilter === 'pending') return !hasDone;
      return true;
    })
    .sort((a, b) => {
      if (traineeFilter === 'completed') {
        const timeA = new Date(a.post_submitted || a.pre_submitted || 0).getTime();
        const timeB = new Date(b.post_submitted || b.pre_submitted || 0).getTime();
        return timeB - timeA;
      }
      const noA = parseInt(a.student_no, 10) || 0;
      const noB = parseInt(b.student_no, 10) || 0;
      return noA - noB;
    });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-sky-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-sky-100 text-sky-700 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <div className="text-xs font-bold text-sky-700 uppercase tracking-wide">
                โรงเรียนสมเด็จพิทยาคม • 21 กันยายน 2569
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                AI Assistants for Teachers Dashboard
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            โครงการอบรมเชิงปฏิบัติการเพื่อขยายผล สำหรับครูผู้สอนชั้น ม.1 - ม.6 ณ หอประชุมศรีสมเด็จ จ.กาฬสินธุ์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadData}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-2 transition-all shadow-xs"
            title="รีเฟรชข้อมูลล่าสุด"
          >
            <RefreshCw className={`w-4 h-4 text-sky-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-10 px-4 rounded-xl gradient-button text-white text-xs font-bold shadow-md shadow-sky-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก CSV</span>
          </button>

          {/* Reset All Test Submissions Button */}
          <button
            onClick={() => setShowResetAllModal(true)}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2 transition-all shadow-xs"
            title="ล้างข้อมูลการทำข้อสอบทั้งหมดของผู้เข้าอบรม (ไม่ลบรายชื่อครูและข้อสอบ)"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>ล้างข้อมูลผลสอบ</span>
          </button>
        </div>
      </div>

      {/* CATEGORY TABS NAVIGATION (Mobile Responsive & Balanced) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex-1 sm:flex-initial ${
            activeTab === 'overview'
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-sky-600 shrink-0" />
          <span>ภาพรวมและสถิติ</span>
        </button>

        <button
          onClick={() => setActiveTab('trainees')}
          className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex-1 sm:flex-initial ${
            activeTab === 'trainees'
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-sky-600 shrink-0" />
          <span>รายชื่อและผลสอบ</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'trainees' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'}`}>
            {completedCount}/{resultsTable.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('item_analysis')}
          className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex-1 sm:flex-initial ${
            activeTab === 'item_analysis'
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>วิเคราะห์ข้อสอบ</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CLEAR VISUAL INSIGHTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* EXECUTIVE KPI CARDS */}
          {analytics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-md shadow-sky-100/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>ผู้เข้าสอบทั้งหมด</span>
                  <Users className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900">{analytics.total_trainees} ท่าน</div>
                <div className="text-[11px] text-slate-500">
                  ทำแล้ว: <strong className="text-sky-700 font-bold">{completedCount}</strong> ท่าน • ยังไม่ทำ: <strong className="text-slate-600 font-bold">{pendingCount}</strong> ท่าน
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-md shadow-sky-100/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>คะแนนเฉลี่ย Pre-test</span>
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-3xl font-extrabold text-sky-700">{analytics.avg_pre_score} <span className="text-base text-slate-400 font-normal">/ 10</span></div>
                <div className="text-[11px] text-slate-500">
                  ทำแล้ว {analytics.pre_completed} ท่าน ({Math.round(analytics.avg_pre_score * 10)}%)
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-md shadow-sky-100/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>คะแนนเฉลี่ย Post-test</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-extrabold text-blue-700">{analytics.avg_post_score} <span className="text-base text-slate-400 font-normal">/ 10</span></div>
                <div className="text-[11px] text-slate-500">
                  ทำแล้ว {analytics.post_completed} ท่าน ({Math.round(analytics.avg_post_score * 10)}%)
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-md shadow-sky-100/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>คะแนนพัฒนาการ (+Gain)</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-600">+{analytics.avg_gain_score} <span className="text-base text-slate-400 font-normal">คะแนน</span></div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  พัฒนาการสัมพัทธ์: {analytics.normalized_gain >= 0.7 ? 'ระดับสูง (High Gain) 🚀' : analytics.normalized_gain >= 0.3 ? 'ระดับปานกลาง (Medium) 👍' : 'ระดับเริ่มต้น'}
                </div>
              </div>

            </div>
          )}

          {/* SIMPLIFIED & INTUITIVE COMPARISON SECTION */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Score Comparison Visual Card */}
              <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-md shadow-sky-100/40 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-sky-600" />
                      เปรียบเทียบคะแนนเฉลี่ย ก่อนเรียน vs หลังเรียน
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      แสดงผลสัมฤทธิ์ทางการเรียนรู้จากการเข้าร่วมอบรม AI Assistants for Teachers
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +{analytics.avg_gain_score} คะแนน
                  </span>
                </div>

                {/* Direct Visual Comparative Bars */}
                <div className="space-y-4 pt-2">
                  {/* Pre-test Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-sky-800 flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>
                        ก่อนเรียน (Pre-test)
                      </span>
                      <span className="text-sky-900 text-sm font-extrabold">{analytics.avg_pre_score} / 10 คะแนน</span>
                    </div>
                    <div className="w-full h-7 bg-slate-100 rounded-2xl overflow-hidden p-1">
                      <div
                        className="h-full rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 flex items-center justify-end pr-2.5 text-[11px] font-bold text-white transition-all duration-1000"
                        style={{ width: `${Math.max(12, (analytics.avg_pre_score / 10) * 100)}%` }}
                      >
                        {Math.round((analytics.avg_pre_score / 10) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Post-test Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-blue-900 flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                        หลังเรียน (Post-test)
                      </span>
                      <span className="text-blue-900 text-sm font-extrabold">{analytics.avg_post_score} / 10 คะแนน</span>
                    </div>
                    <div className="w-full h-7 bg-slate-100 rounded-2xl overflow-hidden p-1">
                      <div
                        className="h-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 flex items-center justify-end pr-2.5 text-[11px] font-bold text-white transition-all duration-1000"
                        style={{ width: `${Math.max(12, (analytics.avg_post_score / 10) * 100)}%` }}
                      >
                        {Math.round((analytics.avg_post_score / 10) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Growth callout highlight */}
                <div className="bg-sky-50/80 rounded-2xl p-4 border border-sky-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-sky-900">อัตราการเติบโตของคะแนน (Score Growth)</div>
                    <div className="text-slate-500 text-[11px]">คุณครูมีระดับความรู้และความเข้าใจเพิ่มขึ้นอย่างมีนัยสำคัญ</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-emerald-600">+{Math.round((analytics.avg_gain_score / 10) * 100)}%</div>
                    <div className="text-[10px] text-slate-400">จากคะแนนเต็ม 10</div>
                  </div>
                </div>
              </div>

              {/* Training Progress Highlights Card */}
              <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-md shadow-sky-100/40 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  สรุปความสำเร็จในการอบรม
                </h3>
                <p className="text-xs text-slate-500">
                  เกณฑ์วัดและประเมินผลสัมฤทธิ์ของครูผู้สอนชั้น ม.1 - ม.6 โรงเรียนสมเด็จพิทยาคม
                </p>

                <div className="space-y-3 pt-1 text-xs">
                  <div className="p-3.5 rounded-2xl border border-sky-100 bg-white shadow-2xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">1. การเข้าทำแบบทดสอบ (Completion Rate)</span>
                      <span className="font-extrabold text-sky-700">{analytics.completion_rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${analytics.completion_rate}%` }}></div>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>สอบครบ {analytics.post_completed} ท่าน</span>
                      <span>ทั้งหมด {analytics.total_trainees} ท่าน</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-sky-100 bg-white shadow-2xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">2. คะแนนหลังเรียนผ่านเกณฑ์ 80% (Mastery)</span>
                      <span className="font-extrabold text-emerald-600">
                        {analytics.avg_post_score >= 8 ? 'ผ่านเกณฑ์ดีเยี่ยม' : 'ระดับปานกลาง'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      คะแนนเฉลี่ยหลังเรียน {analytics.avg_post_score} คะแนน สูงกว่าเกณฑ์มาตรฐาน
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-sky-100 bg-white shadow-2xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">3. ค่าดัชนีพัฒนาการสัมพัทธ์ (Normalized Gain: &lt;g&gt;)</span>
                      <span className="font-extrabold text-amber-600">{analytics.normalized_gain}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      เกณฑ์ Hake: {analytics.normalized_gain >= 0.7 ? 'อยู่ในระดับสูงมาก (High Gain) แสดงถึงการอบรมมีประสิทธิภาพสูง' : 'อยู่ในระดับมาตรฐานของการจัดการเรียนรู้'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* REAL-TIME CONTROL TOGGLES PANEL */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-sky-100 shadow-md shadow-sky-100/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 shadow-2xs">
                  <SwitchCamera className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  สวิตช์ควบคุมเปิด-ปิดระบบสอบ (Real-time Live Switches)
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">
                เปลี่ยนสถานะเปิดหรือปิดสิทธิ์ทำแบบทดสอบของผู้เรียนได้ทันที (ผู้เรียนเห็นการเปลี่ยนแปลงแบบเรียลไทม์ไม่ต้องรีเฟรช)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-end sm:self-auto">
              {/* Pre-test Switch */}
              <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-2xs">
                <div className="leading-tight">
                  <div className="text-[11px] font-bold text-slate-700">ก่อนเรียน (Pre-test)</div>
                  <div className={`text-[10px] font-bold ${preOpen ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {preOpen ? '● เปิดรับการสอบ' : '○ ปิดระบบ'}
                  </div>
                </div>
                <button
                  disabled={isToggling}
                  onClick={() => handleToggleSetting('pre_test_open', preOpen)}
                  className={`w-12 h-6 rounded-full transition-all p-1 relative flex items-center shadow-inner cursor-pointer ${
                    preOpen ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={preOpen ? 'คลิกเพื่อปิดระบบ Pre-test' : 'คลิกเพื่อเปิดระบบ Pre-test'}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                      preOpen ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Post-test Switch */}
              <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-2xs">
                <div className="leading-tight">
                  <div className="text-[11px] font-bold text-slate-700">หลังเรียน (Post-test)</div>
                  <div className={`text-[10px] font-bold ${postOpen ? 'text-sky-700' : 'text-slate-400'}`}>
                    {postOpen ? '● เปิดรับการสอบ' : '○ ปิดระบบ'}
                  </div>
                </div>
                <button
                  disabled={isToggling}
                  onClick={() => handleToggleSetting('post_test_open', postOpen)}
                  className={`w-12 h-6 rounded-full transition-all p-1 relative flex items-center shadow-inner cursor-pointer ${
                    postOpen ? 'bg-sky-500 hover:bg-sky-600' : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={postOpen ? 'คลิกเพื่อปิดระบบ Post-test' : 'คลิกเพื่อเปิดระบบ Post-test'}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                      postOpen ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRAINEES SCORE SHEET */}
      {activeTab === 'trainees' && (
        <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-md shadow-sky-100/40 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-600" />
                ตารางสรุปผลคะแนนรายบุคคล (Trainees Score Sheet)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                สืบค้นและตรวจสอบผลคะแนนรายบุคคล ครูผู้เข้าอบรมทั้งหมด 161 ท่าน
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="ค้นหาชื่อ หรือ ลำดับ..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* SUB-FILTER TABS: ทั้งหมด / ทำแล้ว / ยังไม่ทำ (Mobile Optimized & Proportional) */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setTraineeFilter('all')}
              className={`h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                traineeFilter === 'all'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>ทั้งหมด</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${traineeFilter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {resultsTable.length}
              </span>
            </button>

            <button
              onClick={() => setTraineeFilter('completed')}
              className={`h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                traineeFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="เรียงคนที่ทำล่าสุดไว้บนสุด"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>ทำแล้ว</span>
              <span className="hidden sm:inline font-normal text-[11px] opacity-90">(ล่าสุดอยู่บนสุด)</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${traineeFilter === 'completed' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {completedCount}
              </span>
            </button>

            <button
              onClick={() => setTraineeFilter('pending')}
              className={`h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                traineeFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="เรียงตามเลขลำดับ 1 ถึง 161"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>ยังไม่ทำ</span>
              <span className="hidden sm:inline font-normal text-[11px] opacity-90">(เรียงตามเลข)</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${traineeFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {pendingCount}
              </span>
            </button>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50/70 text-slate-700 uppercase tracking-wider border-b border-sky-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold w-14 text-center">ลำดับ</th>
                  <th className="py-3.5 px-4 font-bold min-w-[180px]">ชื่อ-นามสกุล</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pre-test (10)</th>
                  <th className="py-3.5 px-4 font-bold text-center">Post-test (10)</th>
                  <th className="py-3.5 px-4 font-bold text-center">Gain (+Δ)</th>
                  <th className="py-3.5 px-4 font-bold text-center min-w-[150px]">เวลาที่ใช้ทำทั้งหมด</th>
                  <th className="py-3.5 px-4 font-bold text-center w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      ไม่พบข้อมูลผู้เข้าอบรมในหมวดหมู่นี้
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedResults.map((r) => {
                    const latestTime = r.post_submitted || r.pre_submitted;
                    const totalDurationStr = getTotalDuration(r.pre_duration_seconds, r.post_duration_seconds);

                    return (
                      <tr key={r.id} className="hover:bg-sky-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-sky-600 text-center">
                          <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 inline-flex items-center justify-center font-bold">
                            {r.student_no}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{r.full_name}</td>
                        <td className="py-3.5 px-4 text-center">
                          {r.pre_score !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                                {r.pre_score}
                              </span>
                              {r.pre_duration_seconds ? (
                                <span className="text-[10px] text-slate-400 mt-0.5" title={`เวลาทำ Pre-test: ${formatDuration(r.pre_duration_seconds)}`}>
                                  ⏱️ {formatShortDuration(r.pre_duration_seconds)}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {r.post_score !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                                {r.post_score}
                              </span>
                              {r.post_duration_seconds ? (
                                <span className="text-[10px] text-slate-400 mt-0.5" title={`เวลาทำ Post-test: ${formatDuration(r.post_duration_seconds)}`}>
                                  ⏱️ {formatShortDuration(r.post_duration_seconds)}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {r.gain_score !== null ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              +{r.gain_score}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {r.pre_score !== null || r.post_score !== null ? (
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span className="font-bold text-slate-800 text-xs flex items-center gap-1 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                                <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span>{totalDurationStr || (latestTime ? 'ประมาณ 4-6 นาที' : '-')}</span>
                              </span>
                              {latestTime && (
                                <span className="text-[10px] text-slate-400">
                                  ส่ง {new Date(latestTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">ยังไม่ทำ</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedCandidate(r)}
                              className="h-8 w-8 rounded-lg bg-white hover:bg-sky-50 text-sky-600 border border-slate-200 shadow-2xs hover:border-sky-300 transition-all flex items-center justify-center shrink-0"
                              title="ดูรายละเอียดคำตอบและเวลาที่ใช้"
                            >
                              <Eye className="w-4 h-4 text-sky-600" />
                            </button>

                            {(r.pre_score !== null || r.post_score !== null) && (
                              <button
                                onClick={() => setTraineeToDeleteResult({ trainee: r, type: 'all' })}
                                className="h-8 w-8 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 shadow-2xs hover:border-rose-300 transition-all flex items-center justify-center shrink-0"
                                title="ลบผลสอบของครูท่านนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ITEM ANALYSIS & QUESTION BANK */}
      {activeTab === 'item_analysis' && (
        <div className="space-y-6">
          {/* Educational Benchmark Explanation Box */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-3xl p-5 space-y-3 text-xs">
            <h4 className="font-bold text-sky-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              เกณฑ์การแปลผลสถิติและประเมินคุณภาพข้อสอบรายข้อ (Item Analysis)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-600">
              <div className="bg-white p-3.5 rounded-2xl border border-sky-100 space-y-1 shadow-2xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                  1. ดัชนีความยากง่าย (p)
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  เกณฑ์ที่เหมาะสม: <strong>0.20 - 0.80</strong><br />
                  <span className="text-emerald-700 font-medium">(0.40 - 0.60 คือยากง่ายพอเหมาะ ดีเยี่ยมที่สุด)</span>
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-sky-100 space-y-1 shadow-2xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  2. อำนาจจำแนก (r)
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  เกณฑ์ที่เหมาะสม: <strong>0.20 ขึ้นไป</strong><br />
                  <span className="text-emerald-700 font-medium">(แยกกลุ่มผู้เรียนที่เข้าใจและไม่เข้าใจได้ชัดเจน)</span>
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-sky-100 space-y-1 shadow-2xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  3. พัฒนาการสัมพัทธ์ (&lt;g&gt;)
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  เกณฑ์ Hake: <strong>&ge; 0.70</strong> (ระดับสูง), <strong>0.30 - 0.69</strong> (ปานกลาง), <strong>&lt; 0.30</strong> (เริ่มต้น)
                </p>
              </div>
            </div>
          </div>

          {/* ITEM ANALYSIS TABLE */}
          <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-md shadow-sky-100/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  การวิเคราะห์คุณภาพข้อสอบรายข้อ (Item Analysis)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  สรุปจำนวนผู้ตอบถูกก่อน-หลังเรียน พร้อมแปลผลระดับความยากง่ายและอำนาจจำแนกเป็นภาษาไทย
                </p>
              </div>
              <button
                onClick={() => setEditingQuestion({ prompt: '', choices: { a: '', b: '', c: '', d: '' }, correct_key: 'a', is_active: true })}
                className="h-10 px-4 rounded-xl gradient-button text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-sky-500/25 self-start sm:self-auto transition-all hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" /> <span>เพิ่มข้อสอบใหม่</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/70 text-slate-700 uppercase tracking-wider border-b border-sky-100">
                  <tr>
                    <th className="py-3.5 px-4 font-bold w-12 text-center">ข้อที่</th>
                    <th className="py-3.5 px-4 font-bold min-w-[220px]">โจทย์คำถาม</th>
                    <th className="py-3.5 px-4 font-bold text-center">ทำถูกก่อนเรียน (Pre)</th>
                    <th className="py-3.5 px-4 font-bold text-center">ทำถูกหลังเรียน (Post)</th>
                    <th className="py-3.5 px-4 font-bold text-center">ระดับความยากง่าย</th>
                    <th className="py-3.5 px-4 font-bold text-center">อำนาจจำแนก</th>
                    <th className="py-3.5 px-4 font-bold text-center w-24">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics?.item_analysis.map((q) => {
                    const preCount = Math.round(((q.pre_pct || 0) * (analytics?.pre_completed || 0)) / 100);
                    const postCount = Math.round(((q.post_pct || 0) * (analytics?.post_completed || 0)) / 100);
                    const diffBadge = getDifficultyBadge(q.difficulty_p);
                    const discBadge = getDiscriminationBadge(q.discrimination_r);

                    return (
                      <tr key={q.question_id} className="hover:bg-sky-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-sky-600 text-center">
                          <span className="w-7 h-7 rounded-lg bg-sky-100/80 text-sky-700 inline-flex items-center justify-center font-bold">
                            {q.question_order}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 max-w-md">
                          <div className="line-clamp-2" title={q.prompt}>{q.prompt}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center px-2.5 py-1 rounded-xl bg-sky-50/80 border border-sky-100">
                            <span className="font-bold text-sky-800">{preCount} ท่าน</span>
                            <span className="text-[10px] text-sky-600 font-medium">({q.pre_pct}%)</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center px-2.5 py-1 rounded-xl bg-blue-50/80 border border-blue-100">
                            <span className="font-bold text-blue-800">{postCount} ท่าน</span>
                            <span className="text-[10px] text-blue-600 font-medium">({q.post_pct}%)</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex flex-col items-center px-2.5 py-1 rounded-xl border text-xs ${diffBadge.color}`}>
                            <span className="font-bold">{diffBadge.label}</span>
                            <span className="text-[10px] opacity-80">p = {q.difficulty_p}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex flex-col items-center px-2.5 py-1 rounded-xl border text-xs ${discBadge.color}`}>
                            <span className="font-bold">{discBadge.label}</span>
                            <span className="text-[10px] opacity-80">r = {q.discrimination_r}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                const existing = questionBank.find((item) => item.id === q.question_id);
                                if (existing) setEditingQuestion(existing);
                              }}
                              className="h-8 w-8 rounded-lg bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 shadow-2xs hover:border-sky-300 transition-all flex items-center justify-center"
                              title="แก้ไขข้อสอบนี้"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                            </button>

                            <button
                              onClick={() => {
                                const existing = questionBank.find((item) => item.id === q.question_id);
                                if (existing) setQuestionToDelete(existing);
                              }}
                              className="h-8 w-8 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 shadow-2xs hover:border-rose-300 transition-all flex items-center justify-center"
                              title="ลบข้อสอบนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION EDITOR MODAL */}
      <AnimatePresence>
        {editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl max-w-xl w-full border border-sky-100 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Pinned Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                <h4 className="text-base font-bold text-slate-900">
                  {editingQuestion.id ? 'แก้ไขข้อสอบ' : 'เพิ่มข้อสอบใหม่'}
                </h4>
                <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 sm:p-6 pt-4 space-y-3.5 text-xs overflow-y-auto flex-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">โจทย์คำถาม</label>
                  <textarea
                    rows={3}
                    value={editingQuestion.prompt || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                    placeholder="พิมพ์โจทย์คำถามที่นี่..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['a', 'b', 'c', 'd'].map((key) => (
                    <div key={key}>
                      <label className="block text-slate-500 font-semibold mb-1 uppercase">ตัวเลือก ({key})</label>
                      <input
                        type="text"
                        value={editingQuestion.choices?.[key] || ''}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            choices: { ...editingQuestion.choices, [key]: e.target.value },
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                        placeholder={`พิมพ์คำตอบข้อ ${key}...`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">เฉลยข้อที่ถูกต้อง</label>
                  <select
                    value={editingQuestion.correct_key || 'a'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_key: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="a">ก (a)</option>
                    <option value="b">ข (b)</option>
                    <option value="c">ค (c)</option>
                    <option value="d">ง (d)</option>
                  </select>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="p-4 px-6 border-t border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
                {editingQuestion.id ? (
                  <button
                    onClick={() => {
                      const existing = questionBank.find((item) => item.id === editingQuestion.id);
                      if (existing) setQuestionToDelete(existing);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบข้อสอบนี้
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveQuestion}
                    className="px-5 py-2 rounded-xl gradient-button text-white text-xs font-bold shadow-md shadow-sky-500/25"
                  >
                    บันทึกข้อสอบ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CANDIDATE DETAIL MODAL (SHOWS EXACT ANSWERS QUESTION-BY-QUESTION + DURATION) */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl max-w-2xl w-full border border-sky-100 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Pinned Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedCandidate.full_name}</h4>
                  <p className="text-xs text-slate-500">ลำดับที่: {selectedCandidate.student_no}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(selectedCandidate.pre_score !== null || selectedCandidate.post_score !== null) && (
                    <button
                      onClick={() => setTraineeToDeleteResult({ trainee: selectedCandidate, type: 'all' })}
                      className="h-9 px-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                      title="ลบคำตอบของผู้เรียนท่านนี้ เพื่อให้สามารถทำข้อสอบใหม่ได้"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> <span>ลบคำตอบ</span>
                    </button>
                  )}
                  <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body (Recessed inside the card) */}
              <div className="p-5 sm:p-6 pt-4 space-y-4 overflow-y-auto flex-1">
                {/* TOTAL EXAM DURATION HIGHLIGHT CARD */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-sky-50/80 to-blue-50/70 border border-sky-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>เวลาในการทำแบบทดสอบทั้งหมด</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold uppercase">
                          Total Exam Time
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 flex flex-wrap items-center gap-2">
                        <span>Pre-test: <strong className="text-sky-800">{formatDuration(selectedCandidate.pre_duration_seconds) || 'ยังไม่ทำ'}</strong></span>
                        <span>•</span>
                        <span>Post-test: <strong className="text-blue-800">{formatDuration(selectedCandidate.post_duration_seconds) || 'ยังไม่ทำ'}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right self-end sm:self-auto shrink-0">
                    <div className="text-lg sm:text-xl font-black text-sky-700 tracking-tight">
                      {getTotalDuration(selectedCandidate.pre_duration_seconds, selectedCandidate.post_duration_seconds) || 'ประมาณ 4-6 นาที'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">เวลารวมทั้งสิ้น</div>
                  </div>
                </div>

                {/* SUMMARY STATS & TIME SPENT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Pre-test card */}
                  <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1">
                    <div className="font-bold text-sky-900 flex justify-between items-center">
                      <span>ผลการทดสอบ Pre-test (ก่อนเรียน)</span>
                      <span className="text-sky-700 font-extrabold text-sm">{selectedCandidate.pre_score !== null ? `${selectedCandidate.pre_score} / 10` : '-'}</span>
                    </div>
                    <div className="text-slate-600 text-[11px] flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>เวลาที่ใช้: <strong className="text-slate-800">{formatDuration(selectedCandidate.pre_duration_seconds, selectedCandidate.pre_submitted) || 'ยังไม่ได้ทำ'}</strong></span>
                    </div>
                    {selectedCandidate.pre_submitted && (
                      <div className="text-[10px] text-slate-400">
                        ส่งเมื่อ: {new Date(selectedCandidate.pre_submitted).toLocaleString('th-TH')}
                      </div>
                    )}
                  </div>

                  {/* Post-test card */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
                    <div className="font-bold text-blue-900 flex justify-between items-center">
                      <span>ผลการทดสอบ Post-test (หลังเรียน)</span>
                      <span className="text-blue-700 font-extrabold text-sm">{selectedCandidate.post_score !== null ? `${selectedCandidate.post_score} / 10` : '-'}</span>
                    </div>
                    <div className="text-slate-600 text-[11px] flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>เวลาที่ใช้: <strong className="text-slate-800">{formatDuration(selectedCandidate.post_duration_seconds, selectedCandidate.post_submitted) || 'ยังไม่ได้ทำ'}</strong></span>
                    </div>
                    {selectedCandidate.post_submitted && (
                      <div className="text-[10px] text-slate-400">
                        ส่งเมื่อ: {new Date(selectedCandidate.post_submitted).toLocaleString('th-TH')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gain Score Banner */}
                {selectedCandidate.gain_score !== null && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      คะแนนพัฒนาการ (+Gain Score):
                    </span>
                    <span className="text-base font-extrabold text-emerald-600">+{selectedCandidate.gain_score} คะแนน</span>
                  </div>
                )}

                {/* DETAILED QUESTION-BY-QUESTION BREAKDOWN TABLE */}
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    รายละเอียดคำตอบที่เลือกในแต่ละข้อ (Answers Breakdown)
                  </h5>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 font-bold w-12 text-center">ข้อ</th>
                          <th className="py-2.5 px-3 font-bold">โจทย์ข้อสอบ</th>
                          <th className="py-2.5 px-3 font-bold text-center">ก่อนเรียน</th>
                          <th className="py-2.5 px-3 font-bold text-center">หลังเรียน</th>
                          <th className="py-2.5 px-3 font-bold text-center">เฉลย</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {questionBank.map((q) => {
                          const preAns = selectedCandidate.pre_answers?.[q.id];
                          const postAns = selectedCandidate.post_answers?.[q.id];
                          const isPreCorrect = preAns && preAns.trim().toLowerCase() === q.correct_key.trim().toLowerCase();
                          const isPostCorrect = postAns && postAns.trim().toLowerCase() === q.correct_key.trim().toLowerCase();

                          return (
                            <tr key={q.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 text-center font-bold text-sky-600">{q.question_order}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs truncate" title={q.prompt}>
                                {q.prompt}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {preAns ? (
                                  <span className={`px-2 py-0.5 rounded font-bold ${
                                    isPreCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    {preAns.toUpperCase()} {isPreCorrect ? '✓' : '✗'}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {postAns ? (
                                  <span className={`px-2 py-0.5 rounded font-bold ${
                                    isPostCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    {postAns.toUpperCase()} {isPostCorrect ? '✓' : '✗'}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-sky-800">
                                {q.correct_key.toUpperCase()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="p-4 px-6 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50/50">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM RESET ALL TEST RESULTS MODAL */}
      <AnimatePresence>
        {showResetAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <span className="p-2 rounded-xl bg-rose-100">
                  <AlertTriangle className="w-6 h-6" />
                </span>
                <h4 className="text-base font-bold text-slate-900">ยืนยันการล้างข้อมูลผลการสอบทั้งหมด?</h4>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบจะลบผลคะแนนและคำตอบที่บันทึกไว้ทั้งหมด เพื่อเริ่มต้นรอบการสอบใหม่
              </p>

              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-amber-600" />
                  สิ่งที่ยังคงอยู่อย่างปลอดภัย:
                </div>
                <div className="text-[11px] text-amber-900">
                  • รายชื่อครูผู้เข้าอบรมทั้ง 161 ท่าน (ไม่ถูกลบ)<br />
                  • คลังข้อสอบทั้ง 10 ข้อ (ไม่ถูกลบ)
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowResetAllModal(false)}
                  disabled={isResettingAll}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleResetAllSubmissions}
                  disabled={isResettingAll}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {isResettingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  <span>{isResettingAll ? 'กำลังล้างข้อมูล...' : 'ยืนยันล้างข้อมูล'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE TRAINEE RESULT MODAL */}
      <AnimatePresence>
        {traineeToDeleteResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <span className="p-2 rounded-xl bg-rose-100">
                  <Trash2 className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-slate-900">ลบคำตอบของผู้เรียนท่านนี้</h4>
                  <p className="text-xs text-slate-500">{traineeToDeleteResult.trainee.full_name} (ลำดับที่ {traineeToDeleteResult.trainee.student_no})</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                คุณต้องการลบผลการทดสอบของครูท่านนี้ใช่หรือไม่? หลังจากลบแล้ว ครูท่านนี้จะสามารถเข้าทำแบบทดสอบใหม่ได้ทันที
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setTraineeToDeleteResult(null)}
                  disabled={isDeletingTraineeResult}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteTraineeResult}
                  disabled={isDeletingTraineeResult}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {isDeletingTraineeResult ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{isDeletingTraineeResult ? 'กำลังลบ...' : 'ยืนยันการลบ'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE QUESTION MODAL */}
      <AnimatePresence>
        {questionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <span className="p-2 rounded-xl bg-rose-100">
                  <AlertTriangle className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-slate-900">ยืนยันการลบข้อสอบ</h4>
                  <p className="text-xs text-slate-500">ข้อที่ {questionToDelete.question_order}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-700">
                {questionToDelete.prompt}
              </div>

              <p className="text-xs text-rose-600 font-medium">
                ⚠️ การลบข้อสอบนี้จะส่งผลต่อการตรวจข้อสอบทันที
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setQuestionToDelete(null)}
                  disabled={isDeletingQuestion}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteQuestion}
                  disabled={isDeletingQuestion}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {isDeletingQuestion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{isDeletingQuestion ? 'กำลังลบ...' : 'ยืนยันลบข้อสอบ'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
