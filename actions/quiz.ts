'use server';

import { supabase, isSupabaseConfigured, getMockData, Trainee, QuizQuestionClient, TestResult } from '@/lib/supabase';

// High-Concurrency In-Memory Cache for 161 Trainees (5-minute TTL)
let cachedTrainees: Trainee[] | null = null;
let lastRosterCacheTime = 0;
const ROSTER_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * Fetch and cache full trainee roster in memory to withstand 160+ simultaneous auditorium searches
 */
export async function getAllTraineesCachedAction(): Promise<Trainee[]> {
  try {
    const now = Date.now();
    if (cachedTrainees && now - lastRosterCacheTime < ROSTER_CACHE_TTL) {
      return cachedTrainees;
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('trainees')
        .select('*')
        .order('student_no', { ascending: true });

      if (data && !error) {
        cachedTrainees = data;
        lastRosterCacheTime = now;
        return data;
      }
    }

    cachedTrainees = getMockData().trainees;
    lastRosterCacheTime = now;
    return cachedTrainees;
  } catch (err) {
    return cachedTrainees || getMockData().trainees;
  }
}

/**
 * Search trainees with sub-millisecond response using in-memory cached roster
 */
export async function searchTraineesAction(query: string): Promise<Trainee[]> {
  try {
    const roster = await getAllTraineesCachedAction();
    if (!query || query.trim().length === 0) {
      return roster.slice(0, 10);
    }

    const cleanQuery = query.trim().toLowerCase();
    return roster
      .filter(
        (t) =>
          t.full_name.toLowerCase().includes(cleanQuery) ||
          t.student_no.includes(cleanQuery)
      )
      .slice(0, 15);
  } catch (err) {
    console.error('searchTraineesAction Error:', err);
    return [];
  }
}

/**
 * Get Pre and Post test completion status for a specific trainee
 */
export async function getTraineeStatusAction(traineeId: string) {
  try {
    let preResult: TestResult | null = null;
    let postResult: TestResult | null = null;
    let settings = { pre_open: true, post_open: true };

    if (isSupabaseConfigured()) {
      const { data: results } = await supabase
        .from('test_results')
        .select('*')
        .eq('trainee_id', traineeId);

      if (results) {
        preResult = results.find((r) => r.test_type === 'pre') || null;
        postResult = results.find((r) => r.test_type === 'post') || null;
      }

      const { data: sysSettings } = await supabase.from('system_settings').select('*');
      if (sysSettings) {
        const preSetting = sysSettings.find((s) => s.key === 'pre_test_open');
        const postSetting = sysSettings.find((s) => s.key === 'post_test_open');
        if (preSetting) settings.pre_open = preSetting.value.enabled ?? true;
        if (postSetting) settings.post_open = postSetting.value.enabled ?? true;
      }
    } else {
      const mock = getMockData();
      const userResults = mock.results.filter((r) => r.trainee_id === traineeId);
      preResult = userResults.find((r) => r.test_type === 'pre') || null;
      postResult = userResults.find((r) => r.test_type === 'post') || null;
      settings.pre_open = mock.settings.pre_test_open?.enabled ?? true;
      settings.post_open = mock.settings.post_test_open?.enabled ?? true;
    }

    return {
      preResult: preResult
        ? {
            ...preResult,
            duration_seconds: (preResult as any).answers_payload?._duration_seconds
              ? Number((preResult as any).answers_payload._duration_seconds)
              : (preResult as any).duration_seconds ?? null,
          }
        : null,
      postResult: postResult
        ? {
            ...postResult,
            duration_seconds: (postResult as any).answers_payload?._duration_seconds
              ? Number((postResult as any).answers_payload._duration_seconds)
              : (postResult as any).duration_seconds ?? null,
          }
        : null,
      settings,
    };
  } catch (err) {
    console.error('getTraineeStatusAction Error:', err);
    return { preResult: null, postResult: null, settings: { pre_open: true, post_open: true } };
  }
}

/**
 * Fetch Quiz Questions without correct_key (Client-safe)
 */
export async function fetchQuizQuestionsAction(
  testType: 'pre' | 'post',
  traineeId: string
): Promise<{ success: boolean; data?: QuizQuestionClient[]; error?: string }> {
  try {
    if (isSupabaseConfigured()) {
      // Call Postgres RPC function get_quiz_questions
      const { data, error } = await supabase.rpc('get_quiz_questions', {
        p_test_type: testType,
        p_trainee_id: traineeId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as QuizQuestionClient[] };
    }

    // Fallback Mock Logic
    const mock = getMockData();
    const isSystemOpen = testType === 'pre' ? mock.settings.pre_test_open.enabled : mock.settings.post_test_open.enabled;

    if (!isSystemOpen) {
      return { success: false, error: `ระบบแบบทดสอบ${testType === 'pre' ? 'ก่อนเรียน' : 'หลังเรียน'} ปิดอยู่ขณะนี้` };
    }

    const hasDone = mock.results.some((r) => r.trainee_id === traineeId && r.test_type === testType);
    if (hasDone) {
      return { success: false, error: `ท่านได้ทำแบบทดสอบ${testType === 'pre' ? 'ก่อนเรียน' : 'หลังเรียน'}เรียบร้อยแล้ว` };
    }

    // Strip correct_key from choices payload
    const safeQuestions: QuizQuestionClient[] = mock.questions
      .filter((q) => q.is_active)
      .map(({ correct_key, ...rest }) => rest);

    return { success: true, data: safeQuestions };
  } catch (err: any) {
    return { success: false, error: err?.message || 'ไม่สามารถโหลดข้อสอบได้' };
  }
}

// In-memory concurrency guard to prevent simultaneous double submissions from the same trainee
const activeSubmissionLocks = new Set<string>();

/**
 * Submit Quiz Answers (Atomic Evaluation via Postgres RPC submit_quiz)
 */
export async function submitQuizAction(
  traineeId: string,
  testType: 'pre' | 'post',
  answers: Record<string, string>,
  durationSeconds?: number
) {
  // 1. Strict Parameter Validation
  if (!traineeId || typeof traineeId !== 'string' || traineeId.trim().length === 0) {
    return { success: false, error: 'ข้อมูลผู้สอบไม่ถูกต้อง (Invalid Trainee ID)' };
  }

  if (testType !== 'pre' && testType !== 'post') {
    return { success: false, error: 'ประเภทแบบทดสอบไม่ถูกต้อง (Invalid Test Type)' };
  }

  if (!answers || typeof answers !== 'object') {
    return { success: false, error: 'ข้อมูลคำตอบไม่ถูกต้อง (Invalid Answers Payload)' };
  }

  // 2. Concurrency Lock: Prevent double-click or simultaneous submissions from same trainee
  const lockKey = `${traineeId}_${testType}`;
  if (activeSubmissionLocks.has(lockKey)) {
    return { success: false, error: 'ระบบกำลังประมวลผลการส่งข้อสอบของท่านอยู่ กรุณารอสักครู่...' };
  }
  activeSubmissionLocks.add(lockKey);

  try {
    // 3. Sanitize choices: strictly allow choice keys a, b, c, d
    const sanitizedAnswers: Record<string, string> = {};
    for (const [qId, choiceKey] of Object.entries(answers)) {
      if (typeof qId === 'string' && typeof choiceKey === 'string') {
        const cleanChoice = choiceKey.trim().toLowerCase();
        if (['a', 'b', 'c', 'd'].includes(cleanChoice)) {
          sanitizedAnswers[qId] = cleanChoice;
        }
      }
    }

    // 4. Validate durationSeconds bounds (0 to 4 hours)
    const validDuration =
      typeof durationSeconds === 'number' && durationSeconds >= 0 && durationSeconds <= 14400
        ? Math.round(durationSeconds)
        : null;

    const payloadWithMeta = {
      ...sanitizedAnswers,
      ...(validDuration !== null ? { _duration_seconds: validDuration.toString() } : {}),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('submit_quiz', {
        p_trainee_id: traineeId,
        p_test_type: testType,
        p_answers: payloadWithMeta,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        result: {
          ...(data as any),
          duration_seconds: validDuration,
        },
      };
    }

    // Fallback Mock Atomic Scoring Engine
    const mock = getMockData();
    const questions = mock.questions.filter((q) => q.is_active);

    let score = 0;
    const totalQuestions = questions.length;

    questions.forEach((q) => {
      const userChoice = answers[q.id];
      if (userChoice && userChoice.trim().toLowerCase() === q.correct_key.trim().toLowerCase()) {
        score++;
      }
    });

    const percentage = Number(((score / totalQuestions) * 100).toFixed(2));
    let preScore: number | null = null;
    let gainScore: number | null = null;

    if (testType === 'post') {
      const preResult = mock.results.find((r) => r.trainee_id === traineeId && r.test_type === 'pre');
      if (preResult) {
        preScore = preResult.score;
        gainScore = score - preScore;
      }
    }

    const newResult: TestResult = {
      id: `r_${Date.now()}`,
      trainee_id: traineeId,
      test_type: testType,
      score,
      total_questions: totalQuestions,
      percentage,
      answers_payload: payloadWithMeta,
      gain_score: gainScore,
      submitted_at: new Date().toISOString(),
    };

    mock.results.push(newResult);

    return {
      success: true,
      result: {
        result_id: newResult.id,
        trainee_id: traineeId,
        test_type: testType,
        score,
        total_questions: totalQuestions,
        percentage,
        pre_score: preScore,
        gain_score: gainScore,
        submitted_at: newResult.submitted_at,
        duration_seconds: validDuration,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการส่งข้อสอบ' };
  } finally {
    activeSubmissionLocks.delete(lockKey);
  }
}
