'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured, getMockData, AdminAnalytics, Question, TestResult } from '@/lib/supabase';

const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || 'somdet-pittaya-admin-secret-key-2026';
const ADMIN_PASSCODE = process.env.ADMIN_PASSWORD || 'somdet2026';

function createAdminSignature(timestamp: number): string {
  return crypto.createHmac('sha256', ADMIN_SECRET).update(`admin_${timestamp}`).digest('hex');
}

/**
 * Verify Admin Passcode on Server Side and issue secure HttpOnly Session Cookie
 */
export async function verifyAdminPasscodeAction(passcode: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!passcode) {
      return { success: false, error: 'กรุณาระบุรหัสผ่านผู้ดูแลระบบ' };
    }

    const cleanPass = passcode.trim();
    const isValid = cleanPass === ADMIN_PASSCODE;
    if (!isValid) {
      return { success: false, error: 'รหัสผ่านเข้าสู่ระบบไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง' };
    }

    const timestamp = Date.now();
    const signature = createAdminSignature(timestamp);
    const token = `${timestamp}.${signature}`;

    const cookieStore = await cookies();
    cookieStore.set('admin_auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' };
  }
}

/**
 * Logout Admin & Invalidate Session
 */
export async function logoutAdminAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_auth_session');
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}

/**
 * Check if the current client has a valid, untampered Admin session
 */
export async function checkAdminSessionAction(): Promise<{ isAdmin: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth_session')?.value;
    if (!token) return { isAdmin: false };

    const [tsStr, sig] = token.split('.');
    const ts = parseInt(tsStr, 10);
    // Expire session after 12 hours
    if (isNaN(ts) || Date.now() - ts > 12 * 60 * 60 * 1000) {
      return { isAdmin: false };
    }

    const expectedSig = createAdminSignature(ts);
    return { isAdmin: sig === expectedSig };
  } catch (err) {
    return { isAdmin: false };
  }
}

/**
 * Internal Security Guard for Admin Actions
 */
async function requireAdminAuth(): Promise<boolean> {
  const { isAdmin } = await checkAdminSessionAction();
  return isAdmin;
}

/**
 * Get comprehensive Admin Analytics & Item Analysis ($p$ and $r$)
 */
export async function getAdminAnalyticsAction(): Promise<{ success: boolean; data?: AdminAnalytics; error?: string }> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('get_admin_analytics');
      if (error) {
        console.error('Supabase Analytics RPC Error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data: data as AdminAnalytics };
    }

    // Fallback Mock Analytics Engine
    const mock = getMockData();
    const totalTrainees = mock.trainees.length;
    const preResults = mock.results.filter((r) => r.test_type === 'pre');
    const postResults = mock.results.filter((r) => r.test_type === 'post');

    const preCompleted = preResults.length;
    const postCompleted = postResults.length;

    const avgPreScore = preCompleted > 0
      ? Number((preResults.reduce((acc, curr) => acc + curr.score, 0) / preCompleted).toFixed(2))
      : 0;

    const avgPostScore = postCompleted > 0
      ? Number((postResults.reduce((acc, curr) => acc + curr.score, 0) / postCompleted).toFixed(2))
      : 0;

    const validGains = postResults.filter((r) => r.gain_score !== null && r.gain_score !== undefined);
    const avgGainScore = validGains.length > 0
      ? Number((validGains.reduce((acc, curr) => acc + (curr.gain_score || 0), 0) / validGains.length).toFixed(2))
      : 0;

    const normalizedGain = avgPreScore < 10 && (10 - avgPreScore) > 0
      ? Number(((avgPostScore - avgPreScore) / (10 - avgPreScore)).toFixed(2))
      : 0;

    const scoreDistribution = [
      { range: '0-2', pre: 0, post: 0 },
      { range: '3-4', pre: 1, post: 0 },
      { range: '5-6', pre: 1, post: 0 },
      { range: '7-8', pre: 0, post: 0 },
      { range: '9-10', pre: 0, post: 1 },
    ];

    const itemAnalysis = mock.questions.map((q) => {
      const preCorrect = preResults.filter((r) => r.answers_payload[q.id] === q.correct_key).length;
      const postCorrect = postResults.filter((r) => r.answers_payload[q.id] === q.correct_key).length;

      const prePct = preCompleted > 0 ? Number(((preCorrect / preCompleted) * 100).toFixed(1)) : 0;
      const postPct = postCompleted > 0 ? Number(((postCorrect / postCompleted) * 100).toFixed(1)) : 0;
      const difficultyP = postCompleted > 0 ? Number((postCorrect / postCompleted).toFixed(2)) : 0.5;
      const discriminationR = Number(Math.max(0, (postPct - prePct) / 100).toFixed(2));

      return {
        question_id: q.id,
        question_order: q.question_order,
        prompt: q.prompt,
        pre_pct: prePct,
        post_pct: postPct,
        difficulty_p: difficultyP,
        discrimination_r: discriminationR,
      };
    });

    return {
      success: true,
      data: {
        total_trainees: totalTrainees,
        pre_completed: preCompleted,
        post_completed: postCompleted,
        completion_rate: totalTrainees > 0 ? Number(((postCompleted / totalTrainees) * 100).toFixed(1)) : 0,
        avg_pre_score: avgPreScore,
        avg_post_score: avgPostScore,
        avg_gain_score: avgGainScore,
        normalized_gain: normalizedGain,
        score_distribution: scoreDistribution,
        item_analysis: itemAnalysis,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการโหลด analytics' };
  }
}

/**
 * Toggle Pre-test or Post-test availability setting
 */
export async function toggleSystemSettingAction(key: 'pre_test_open' | 'post_test_open', enabled: boolean) {
  try {
    if (!(await requireAdminAuth())) {
      return { success: false, error: 'Unauthorized: สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบ' };
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value: { enabled }, updated_at: new Date().toISOString() });

      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const mock = getMockData();
    mock.settings[key] = { enabled };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' };
  }
}

/**
 * Get detailed candidate results list for Admin Table and CSV Export
 */
export async function getDetailedResultsAction() {
  try {
    if (isSupabaseConfigured()) {
      const { data: trainees } = await supabase.from('trainees').select('*').order('student_no', { ascending: true });
      const { data: results } = await supabase.from('test_results').select('*');

      if (!trainees || !results) return [];

      return trainees.map((t) => {
        const pre = results.find((r) => r.trainee_id === t.id && r.test_type === 'pre');
        const post = results.find((r) => r.trainee_id === t.id && r.test_type === 'post');

        return {
          id: t.id,
          student_no: t.student_no,
          full_name: t.full_name,
          department: t.department,
          pre_score: pre ? pre.score : null,
          pre_pct: pre ? pre.percentage : null,
          post_score: post ? post.score : null,
          post_pct: post ? post.percentage : null,
          gain_score: post ? post.gain_score : null,
          pre_submitted: pre ? pre.submitted_at : null,
          post_submitted: post ? post.submitted_at : null,
          pre_answers: pre ? pre.answers_payload : null,
          post_answers: post ? post.answers_payload : null,
          pre_duration_seconds: pre?.answers_payload?._duration_seconds ? Number(pre.answers_payload._duration_seconds) : null,
          post_duration_seconds: post?.answers_payload?._duration_seconds ? Number(post.answers_payload._duration_seconds) : null,
        };
      });
    }

    // Fallback Mock data
    const mock = getMockData();
    return mock.trainees.map((t) => {
      const pre = mock.results.find((r) => r.trainee_id === t.id && r.test_type === 'pre');
      const post = mock.results.find((r) => r.trainee_id === t.id && r.test_type === 'post');

      return {
        id: t.id,
        student_no: t.student_no,
        full_name: t.full_name,
        department: t.department,
        pre_score: pre ? pre.score : null,
        pre_pct: pre ? pre.percentage : null,
        post_score: post ? post.score : null,
        post_pct: post ? post.percentage : null,
        gain_score: post ? post.gain_score : null,
        pre_submitted: pre ? pre.submitted_at : null,
        post_submitted: post ? post.submitted_at : null,
        pre_answers: pre ? pre.answers_payload : null,
        post_answers: post ? post.answers_payload : null,
        pre_duration_seconds: pre?.answers_payload?._duration_seconds ? Number(pre.answers_payload._duration_seconds) : null,
        post_duration_seconds: post?.answers_payload?._duration_seconds ? Number(post.answers_payload._duration_seconds) : null,
      };
    });
  } catch (err) {
    console.error('getDetailedResultsAction error:', err);
    return [];
  }
}

/**
 * Fetch Question Bank for Admin Editor
 */
export async function getQuestionBankAction(): Promise<Question[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .order('question_order', { ascending: true });
      return (data as Question[]) || [];
    }
    return getMockData().questions;
  } catch (err) {
    console.error('getQuestionBankAction error:', err);
    return [];
  }
}

/**
 * Save or update a question in Question Bank
 */
export async function upsertQuestionAction(question: Partial<Question>) {
  try {
    if (!(await requireAdminAuth())) {
      return { success: false, error: 'Unauthorized: สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบ' };
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('questions').upsert(question);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const mock = getMockData();
    if (question.id) {
      const idx = mock.questions.findIndex((q) => q.id === question.id);
      if (idx !== -1) {
        mock.questions[idx] = { ...mock.questions[idx], ...question } as Question;
      }
    } else {
      const newQ: Question = {
        id: `q_${Date.now()}`,
        question_order: mock.questions.length + 1,
        prompt: question.prompt || 'ข้อสอบใหม่',
        choices: question.choices || { a: '', b: '', c: '', d: '' },
        correct_key: question.correct_key || 'a',
        explanation: question.explanation || '',
        is_active: question.is_active ?? true,
      };
      mock.questions.push(newQ);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'ไม่สามารถบันทึกข้อสอบได้' };
  }
}

/**
 * Delete a question from Question Bank
 */
export async function deleteQuestionAction(questionId: string) {
  try {
    if (!(await requireAdminAuth())) {
      return { success: false, error: 'Unauthorized: สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบ' };
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const mock = getMockData();
    mock.questions = mock.questions.filter((q) => q.id !== questionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'ไม่สามารถลบข้อสอบได้' };
  }
}

/**
 * Delete individual trainee's test answers (pre, post, or both)
 */
export async function deleteTraineeResultAction(traineeId: string, testType?: 'pre' | 'post' | 'all') {
  try {
    if (!(await requireAdminAuth())) {
      return { success: false, error: 'Unauthorized: สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบ' };
    }

    if (isSupabaseConfigured()) {
      let query = supabase.from('test_results').delete().eq('trainee_id', traineeId);
      if (testType && testType !== 'all') {
        query = query.eq('test_type', testType);
      }
      const { error } = await query;
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const mock = getMockData();
    if (testType && testType !== 'all') {
      mock.results = mock.results.filter((r) => !(r.trainee_id === traineeId && r.test_type === testType));
    } else {
      mock.results = mock.results.filter((r) => r.trainee_id !== traineeId);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'ไม่สามารถลบคำตอบของผู้เข้าอบรมได้' };
  }
}

/**
 * Reset all test submissions (Clears test_results table without deleting questions or trainees)
 */
export async function resetAllTestResultsAction() {
  try {
    if (!(await requireAdminAuth())) {
      return { success: false, error: 'Unauthorized: สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบ' };
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('test_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const mock = getMockData();
    mock.results = [];
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'ไม่สามารถล้างข้อมูลผลสอบได้' };
  }
}
