-- ============================================================================
-- PRE-TEST & POST-TEST EXAMINATION AND ANALYTICS SYSTEM
-- Database Schema & Backend Engine (Supabase PostgreSQL 16)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trainees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_no TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT DEFAULT 'คณะครูผู้เข้าอบรม',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_order INT NOT NULL,
    prompt TEXT NOT NULL,
    choices JSONB NOT NULL,
    correct_key TEXT NOT NULL,
    explanation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
    test_type VARCHAR(10) NOT NULL CHECK (test_type IN ('pre', 'post')),
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    answers_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    gain_score INT DEFAULT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_trainee_test_type UNIQUE (trainee_id, test_type)
);

CREATE INDEX IF NOT EXISTS idx_trainees_full_name ON public.trainees(full_name);
CREATE INDEX IF NOT EXISTS idx_trainees_student_no ON public.trainees(student_no);
CREATE INDEX IF NOT EXISTS idx_questions_order ON public.questions(is_active, question_order);
CREATE INDEX IF NOT EXISTS idx_test_results_trainee ON public.test_results(trainee_id);
CREATE INDEX IF NOT EXISTS idx_test_results_type ON public.test_results(test_type);
CREATE INDEX IF NOT EXISTS idx_test_results_submitted ON public.test_results(submitted_at DESC);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read system settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow service role update system settings" ON public.system_settings FOR ALL USING (true);
CREATE POLICY "Allow public read trainees" ON public.trainees FOR SELECT USING (true);
CREATE POLICY "Allow service role manage trainees" ON public.trainees FOR ALL USING (true);
CREATE POLICY "Allow public read active questions" ON public.questions FOR SELECT USING (is_active = true);
REVOKE SELECT (correct_key) ON public.questions FROM anon, authenticated;
CREATE POLICY "Allow public select own test results" ON public.test_results FOR SELECT USING (true);
CREATE POLICY "Allow service role insert test results" ON public.test_results FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_quiz_questions(
    p_test_type TEXT,
    p_trainee_id UUID
)
RETURNS TABLE (
    id UUID,
    question_order INT,
    prompt TEXT,
    choices JSONB,
    explanation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_test_type = 'pre' AND (SELECT (value->>'enabled')::boolean FROM public.system_settings WHERE key = 'pre_test_open') IS FALSE THEN
        RAISE EXCEPTION 'ระบบแบบทดสอบก่อนเรียน (Pre-test) ปิดอยู่ขณะนี้';
    END IF;

    IF p_test_type = 'post' AND (SELECT (value->>'enabled')::boolean FROM public.system_settings WHERE key = 'post_test_open') IS FALSE THEN
        RAISE EXCEPTION 'ระบบแบบทดสอบหลังเรียน (Post-test) ปิดอยู่ขณะนี้';
    END IF;

    IF EXISTS (SELECT 1 FROM public.test_results WHERE trainee_id = p_trainee_id AND test_type = p_test_type) THEN
        RAISE EXCEPTION 'ผู้เรียนได้ทำแบบทดสอบ%เรียบร้อยแล้ว', (CASE WHEN p_test_type = 'pre' THEN 'ก่อนเรียน' ELSE 'หลังเรียน' END);
    END IF;

    RETURN QUERY
    SELECT 
        q.id,
        q.question_order,
        q.prompt,
        q.choices,
        q.explanation
    FROM public.questions q
    WHERE q.is_active = TRUE
    ORDER BY q.question_order ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_quiz(
    p_trainee_id UUID,
    p_test_type TEXT,
    p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rec RECORD;
    v_score INT := 0;
    v_total INT := 0;
    v_user_key TEXT;
    v_percentage NUMERIC(5,2) := 0.00;
    v_pre_score INT := NULL;
    v_gain_score INT := NULL;
    v_result_id UUID;
BEGIN
    IF p_test_type = 'pre' AND (SELECT (value->>'enabled')::boolean FROM public.system_settings WHERE key = 'pre_test_open') IS FALSE THEN
        RAISE EXCEPTION 'ระบบแบบทดสอบก่อนเรียน (Pre-test) ปิดอยู่ขณะนี้';
    END IF;

    IF p_test_type = 'post' AND (SELECT (value->>'enabled')::boolean FROM public.system_settings WHERE key = 'post_test_open') IS FALSE THEN
        RAISE EXCEPTION 'ระบบแบบทดสอบหลังเรียน (Post-test) ปิดอยู่ขณะนี้';
    END IF;

    IF EXISTS (SELECT 1 FROM public.test_results WHERE trainee_id = p_trainee_id AND test_type = p_test_type) THEN
        RAISE EXCEPTION 'ท่านได้ส่งแบบทดสอบนี้ไปแล้ว ไม่สามารถส่งซ้ำได้';
    END IF;

    FOR v_rec IN 
        SELECT id, correct_key 
        FROM public.questions 
        WHERE is_active = TRUE 
    LOOP
        v_total := v_total + 1;
        v_user_key := p_answers->>v_rec.id::text;
        
        IF v_user_key IS NOT NULL AND LOWER(TRIM(v_user_key)) = LOWER(TRIM(v_rec.correct_key)) THEN
            v_score := v_score + 1;
        END IF;
    END LOOP;

    IF v_total > 0 THEN
        v_percentage := ROUND((v_score::numeric / v_total::numeric) * 100.0, 2);
    END IF;

    IF p_test_type = 'post' THEN
        SELECT score INTO v_pre_score 
        FROM public.test_results 
        WHERE trainee_id = p_trainee_id AND test_type = 'pre'
        LIMIT 1;

        IF v_pre_score IS NOT NULL THEN
            v_gain_score := v_score - v_pre_score;
        END IF;
    END IF;

    INSERT INTO public.test_results (
        trainee_id,
        test_type,
        score,
        total_questions,
        percentage,
        answers_payload,
        gain_score,
        submitted_at
    ) VALUES (
        p_trainee_id,
        p_test_type,
        v_score,
        v_total,
        v_percentage,
        p_answers,
        v_gain_score,
        NOW()
    )
    RETURNING id INTO v_result_id;

    RETURN jsonb_build_object(
        'result_id', v_result_id,
        'trainee_id', p_trainee_id,
        'test_type', p_test_type,
        'score', v_score,
        'total_questions', v_total,
        'percentage', v_percentage,
        'pre_score', v_pre_score,
        'gain_score', v_gain_score,
        'submitted_at', NOW()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_trainees INT := 0;
    v_pre_completed INT := 0;
    v_post_completed INT := 0;
    v_avg_pre NUMERIC(5,2) := 0;
    v_avg_post NUMERIC(5,2) := 0;
    v_avg_gain NUMERIC(5,2) := 0;
    v_norm_gain NUMERIC(5,2) := 0;
    v_score_dist JSONB;
    v_item_analysis JSONB;
BEGIN
    SELECT COUNT(*) INTO v_total_trainees FROM public.trainees;
    SELECT COUNT(*) INTO v_pre_completed FROM public.test_results WHERE test_type = 'pre';
    SELECT COUNT(*) INTO v_post_completed FROM public.test_results WHERE test_type = 'post';

    SELECT COALESCE(ROUND(AVG(score), 2), 0) INTO v_avg_pre FROM public.test_results WHERE test_type = 'pre';
    SELECT COALESCE(ROUND(AVG(score), 2), 0) INTO v_avg_post FROM public.test_results WHERE test_type = 'post';
    SELECT COALESCE(ROUND(AVG(gain_score), 2), 0) INTO v_avg_gain FROM public.test_results WHERE test_type = 'post' AND gain_score IS NOT NULL;

    IF v_avg_pre < 10 AND (10 - v_avg_pre) > 0 THEN
        v_norm_gain := ROUND((v_avg_post - v_avg_pre) / (10.0 - v_avg_pre), 2);
    END IF;

    WITH dist AS (
        SELECT 
            CASE 
                WHEN score BETWEEN 0 AND 2 THEN '0-2'
                WHEN score BETWEEN 3 AND 4 THEN '3-4'
                WHEN score BETWEEN 5 AND 6 THEN '5-6'
                WHEN score BETWEEN 7 AND 8 THEN '7-8'
                ELSE '9-10'
            END AS score_range,
            test_type,
            COUNT(*) as cnt
        FROM public.test_results
        GROUP BY 1, 2
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'range', ranges.r,
            'pre', COALESCE(pre_c.cnt, 0),
            'post', COALESCE(post_c.cnt, 0)
        )
    ) INTO v_score_dist
    FROM (VALUES ('0-2'), ('3-4'), ('5-6'), ('7-8'), ('9-10')) AS ranges(r)
    LEFT JOIN dist pre_c ON pre_c.score_range = ranges.r AND pre_c.test_type = 'pre'
    LEFT JOIN dist post_c ON post_c.score_range = ranges.r AND post_c.test_type = 'post';

    WITH q_stats AS (
        SELECT 
            q.id as question_id,
            q.question_order,
            q.prompt,
            q.correct_key,
            COUNT(CASE WHEN r_pre.answers_payload->>q.id::text = q.correct_key THEN 1 END) as pre_correct,
            COUNT(r_pre.id) as pre_total,
            COUNT(CASE WHEN r_post.answers_payload->>q.id::text = q.correct_key THEN 1 END) as post_correct,
            COUNT(r_post.id) as post_total
        FROM public.questions q
        LEFT JOIN public.test_results r_pre ON r_pre.test_type = 'pre'
        LEFT JOIN public.test_results r_post ON r_post.test_type = 'post'
        WHERE q.is_active = TRUE
        GROUP BY q.id, q.question_order, q.prompt, q.correct_key
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'question_id', question_id,
            'question_order', question_order,
            'prompt', prompt,
            'pre_pct', CASE WHEN pre_total > 0 THEN ROUND((pre_correct::numeric / pre_total::numeric) * 100, 1) ELSE 0 END,
            'post_pct', CASE WHEN post_total > 0 THEN ROUND((post_correct::numeric / post_total::numeric) * 100, 1) ELSE 0 END,
            'difficulty_p', CASE WHEN post_total > 0 THEN ROUND(post_correct::numeric / post_total::numeric, 2) ELSE 0 END,
            'discrimination_r', CASE WHEN post_total > 0 THEN ROUND(GREATEST(0, (post_correct::numeric / post_total::numeric) - (pre_correct::numeric / NULLIF(pre_total, 0)::numeric)), 2) ELSE 0 END
        ) ORDER BY question_order ASC
    ) INTO v_item_analysis
    FROM q_stats;

    RETURN jsonb_build_object(
        'total_trainees', v_total_trainees,
        'pre_completed', v_pre_completed,
        'post_completed', v_post_completed,
        'completion_rate', CASE WHEN v_total_trainees > 0 THEN ROUND((v_post_completed::numeric / v_total_trainees::numeric) * 100, 1) ELSE 0 END,
        'avg_pre_score', v_avg_pre,
        'avg_post_score', v_avg_post,
        'avg_gain_score', v_avg_gain,
        'normalized_gain', v_norm_gain,
        'score_distribution', COALESCE(v_score_dist, '[]'::jsonb),
        'item_analysis', COALESCE(v_item_analysis, '[]'::jsonb)
    );
END;
$$;

INSERT INTO public.system_settings (key, value, description) VALUES
('pre_test_open', '{"enabled": true}'::jsonb, 'เปิดใช้งานระบบทำแบบทดสอบก่อนเรียน'),
('post_test_open', '{"enabled": true}'::jsonb, 'เปิดใช้งานระบบทำแบบทดสอบหลังเรียน'),
('project_info', '{
    "title": "โครงการอบรม เรื่อง การประยุกต์ใช้ AI เพื่อการทำงานและการจัดการเรียนรู้",
    "subtitle": "ระบบประเมินผลการเรียนรู้แบบทดสอบก่อนเรียนและหลังเรียน (Pre-test & Post-test System)",
    "date": "2026-09-20",
    "location": "ห้องอบรมการประยุกต์ใช้ AI"
}'::jsonb, 'รายละเอียดงานสัมมนาและสถานที่อบรม')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.trainees (student_no, full_name, department) VALUES
('1', 'นายภูมิศักดิ์ แสนกันยา', 'คณะครูผู้เข้าอบรม'),
('2', 'นางสาวสุนิจ วิลาศรี', 'คณะครูผู้เข้าอบรม'),
('3', 'นายธนวิทย์ ชารีรักษ์', 'คณะครูผู้เข้าอบรม'),
('4', 'นางสาวลิลวนันท์ วรรณพราหมณ์', 'คณะครูผู้เข้าอบรม'),
('5', 'นางเอมอร บุญพิโย', 'คณะครูผู้เข้าอบรม'),
('6', 'นางทิพย์สุดา ยนยุบล', 'คณะครูผู้เข้าอบรม'),
('7', 'นางอมรวรรณ สุภารีย์', 'คณะครูผู้เข้าอบรม'),
('8', 'นางบัวคำ ประดิษฐ์จา', 'คณะครูผู้เข้าอบรม'),
('9', 'นางสุพัทยา ศิลาแก้ว', 'คณะครูผู้เข้าอบรม'),
('10', 'นางลักษณา คำก้อน', 'คณะครูผู้เข้าอบรม'),
('11', 'นางวลัยรัตน์ แก้วกัณหา', 'คณะครูผู้เข้าอบรม'),
('12', 'นางเพ็ญศรี แก้วมณี', 'คณะครูผู้เข้าอบรม'),
('13', 'นางสาวพวงพกา อาจวิชัย', 'คณะครูผู้เข้าอบรม'),
('14', 'นายสุริยา แสงเพ็ชร', 'คณะครูผู้เข้าอบรม'),
('15', 'นายธวัชชัย เถาว์ชาลี', 'คณะครูผู้เข้าอบรม'),
('16', 'นางภาสุณีย์ ผลชารี', 'คณะครูผู้เข้าอบรม'),
('17', 'นางสาวสิรินญาพร การเกษม', 'คณะครูผู้เข้าอบรม'),
('18', 'นายพิทักษ์ โคตะวินนท์', 'คณะครูผู้เข้าอบรม'),
('19', 'นางกาญจนา มั่นกิจ', 'คณะครูผู้เข้าอบรม'),
('20', 'นางสาวรุ่งนภา คำภูษา', 'คณะครูผู้เข้าอบรม'),
('21', 'นายขวัญชัย ไชยสุข', 'คณะครูผู้เข้าอบรม'),
('22', 'นายชินญาณ สระแก้ว', 'คณะครูผู้เข้าอบรม'),
('23', 'ว่าทีร.ต.ธนิต ภูพลอย', 'คณะครูผู้เข้าอบรม'),
('24', 'นางสาวธิดารัตน์ โสวิราช', 'คณะครูผู้เข้าอบรม'),
('25', 'นางสาวพรรธนวัลย์ อับเซ็น', 'คณะครูผู้เข้าอบรม'),
('26', 'นายธนพล ผลชารี', 'คณะครูผู้เข้าอบรม'),
('27', 'นางสาวนารีรัตน์ มีนะถา', 'คณะครูผู้เข้าอบรม'),
('28', 'นายวัชระพล โป๊ะตะคาร', 'คณะครูผู้เข้าอบรม'),
('29', 'นางสาวกิ่งกาญจน์ จันทร์สว่าง', 'คณะครูผู้เข้าอบรม'),
('30', 'นายเรศ แสงทอง', 'คณะครูผู้เข้าอบรม'),
('31', 'นางสาวพัทธ์ธีรา อามาตย์มนตรี', 'คณะครูผู้เข้าอบรม'),
('32', 'นายเกรียงไกร บุตรพรม', 'คณะครูผู้เข้าอบรม'),
('33', 'นายจุลศักดิ์ สมบูรณ์', 'คณะครูผู้เข้าอบรม'),
('34', 'นายวีระพงษ์ เนื่องศรี', 'คณะครูผู้เข้าอบรม'),
('35', 'นางนิตยา คันธิยงค์', 'คณะครูผู้เข้าอบรม'),
('36', 'นางณัฐกานต์ วงษาวิลัย', 'คณะครูผู้เข้าอบรม'),
('37', 'นางสาวละอองดาว นันวิสุ', 'คณะครูผู้เข้าอบรม'),
('38', 'นางจรินทร ชลิงสุ', 'คณะครูผู้เข้าอบรม'),
('39', 'นายอภิชาติ เฉลิมชาติ', 'คณะครูผู้เข้าอบรม'),
('40', 'นางวราภรณ์ ยนต์ชัย', 'คณะครูผู้เข้าอบรม'),
('41', 'นางสาวปาริฉัตร ผลประสาท', 'คณะครูผู้เข้าอบรม'),
('42', 'นายสุริยา เฉลิมชาติ', 'คณะครูผู้เข้าอบรม'),
('43', 'นางสาวกาญจนา มัจฉา', 'คณะครูผู้เข้าอบรม'),
('44', 'นายนันทวัฒน์ ถนอมภักดิ์', 'คณะครูผู้เข้าอบรม'),
('45', 'นางสุจิรา กอศักดิ์', 'คณะครูผู้เข้าอบรม'),
('46', 'นายสมร พัฒมี', 'คณะครูผู้เข้าอบรม'),
('47', 'นางพรพิมล เฉลิมชาติ', 'คณะครูผู้เข้าอบรม'),
('48', 'นางศุภลักษณ์ ปะเสระกัง', 'คณะครูผู้เข้าอบรม'),
('49', 'น.ส.สุพิชชากาญจน์ ญาณโชติสฤษฎ์', 'คณะครูผู้เข้าอบรม'),
('50', 'นางสาวศศิกานต์ พันธ์โนราช', 'คณะครูผู้เข้าอบรม'),
('51', 'นางสุพรรณี ภูแสงศรี', 'คณะครูผู้เข้าอบรม'),
('52', 'นางวราภรณ์ เฉลิมชาติ', 'คณะครูผู้เข้าอบรม'),
('53', 'นางยุภาพร ผลสว่าง', 'คณะครูผู้เข้าอบรม'),
('54', 'นางจัตุพร สุตตานนท์', 'คณะครูผู้เข้าอบรม'),
('55', 'นางสาวดวงกมล เนาวะเศษ', 'คณะครูผู้เข้าอบรม'),
('56', 'นายปิยพันธุ์ ผ่านจังหาร', 'คณะครูผู้เข้าอบรม'),
('57', 'นางจันทร์เพ็ญ ดวงทองพล', 'คณะครูผู้เข้าอบรม'),
('58', 'นางณิชากร สงวนกลิ่น', 'คณะครูผู้เข้าอบรม'),
('59', 'นางธันยพร ชินคีรี', 'คณะครูผู้เข้าอบรม'),
('60', 'นางสาววิริยา พันธุขันธ์', 'คณะครูผู้เข้าอบรม'),
('61', 'นางสาวสิริรัตน์ ภูจ่าพล', 'คณะครูผู้เข้าอบรม'),
('62', 'นางสาวประกายคำ เทศารินทร์', 'คณะครูผู้เข้าอบรม'),
('63', 'นายภาณุพงษ์ พลเตชะ', 'คณะครูผู้เข้าอบรม'),
('64', 'นายสมศักดิ์ ศรีเครือดง', 'คณะครูผู้เข้าอบรม'),
('65', 'นางปรางทิพย์ ศรีเครือดง', 'คณะครูผู้เข้าอบรม'),
('66', 'นางปานใจ อุดรแผ้ว', 'คณะครูผู้เข้าอบรม'),
('67', 'นายภาคิน กุดแถลง', 'คณะครูผู้เข้าอบรม'),
('68', 'นางสาวสาวิตรี ศรีขัดเค้า', 'คณะครูผู้เข้าอบรม'),
('69', 'นายธนากร ชื่นนิรันดร์', 'คณะครูผู้เข้าอบรม'),
('70', 'นายวีระศักดิ์ คิสาลัง', 'คณะครูผู้เข้าอบรม'),
('71', 'นายสมชาติ ภูสง่า', 'คณะครูผู้เข้าอบรม'),
('72', 'นายมนูญ ยางงาม', 'คณะครูผู้เข้าอบรม'),
('73', 'นายสุริยนต์ มหาราช', 'คณะครูผู้เข้าอบรม'),
('74', 'นายภูวพล บุตรหา', 'คณะครูผู้เข้าอบรม'),
('75', 'นายสมชัย เยาวรุฒ', 'คณะครูผู้เข้าอบรม'),
('76', 'นายภานุเดช ยาวะนิล', 'คณะครูผู้เข้าอบรม'),
('77', 'นายประวิทย์ ไชยเสนา', 'คณะครูผู้เข้าอบรม'),
('78', 'นางวไลกิติ์ เฮมิลทัน', 'คณะครูผู้เข้าอบรม'),
('79', 'นางสาวณัฐธิรา พิมพะทิตย์', 'คณะครูผู้เข้าอบรม'),
('80', 'นางเพชราภรณ์ แสนพาน', 'คณะครูผู้เข้าอบรม'),
('81', 'นางสาวเทียมจิต เทวิญญา', 'คณะครูผู้เข้าอบรม'),
('82', 'นางฉัตรชนก ถวิล', 'คณะครูผู้เข้าอบรม'),
('83', 'นางสาววริษา การิโส', 'คณะครูผู้เข้าอบรม'),
('84', 'นางสาวมาลิตา พรมโสภา', 'คณะครูผู้เข้าอบรม'),
('85', 'นางสาวมัญชนา พรมลี', 'คณะครูผู้เข้าอบรม'),
('86', 'นางสาวสราพร บุญเลิศ', 'คณะครูผู้เข้าอบรม'),
('87', 'นางสาวสุคนธา ยะไวทย์', 'คณะครูผู้เข้าอบรม'),
('88', 'นางบุญทวี คำเนตร', 'คณะครูผู้เข้าอบรม'),
('89', 'นายปิยวัตร วงศ์เครือศร', 'คณะครูผู้เข้าอบรม'),
('90', 'นางสาวพัสตราภรณ์ เยี่ยมสมบัติ', 'คณะครูผู้เข้าอบรม'),
('91', 'นางสาวเพชรไพลิน ค้ำชู', 'คณะครูผู้เข้าอบรม'),
('92', 'นางสาวอรนิชา คะอังกุ', 'คณะครูผู้เข้าอบรม'),
('93', 'นางสาวขนิษฐา จำปามูล', 'คณะครูผู้เข้าอบรม'),
('94', 'นางสาวศลิษา วงศ์ษาพาน', 'คณะครูผู้เข้าอบรม'),
('95', 'นางสาวกรองแก้ว อ้วนล่ำ', 'คณะครูผู้เข้าอบรม'),
('96', 'นายสิรวิชญ์ ศรีธรรมบุตร', 'คณะครูผู้เข้าอบรม'),
('97', 'นางวราภรณ์ แสบงบาล', 'คณะครูผู้เข้าอบรม'),
('98', 'นางยุพิน บุญเลิศ', 'คณะครูผู้เข้าอบรม'),
('99', 'นายอนุชิต กอศักดิ์', 'คณะครูผู้เข้าอบรม'),
('100', 'นางสาวณัฐวดี รักษาภักดี', 'คณะครูผู้เข้าอบรม'),
('101', 'นางสาวศิริพร ดวงทองพล', 'คณะครูผู้เข้าอบรม'),
('102', 'นางบังอร สมิทธิกันต์', 'คณะครูผู้เข้าอบรม'),
('103', 'นายกิตติภัค ไพศาล', 'คณะครูผู้เข้าอบรม'),
('104', 'นายจิระเดช แก้วกัณหา', 'คณะครูผู้เข้าอบรม'),
('105', 'นางสาวอุบล มูลเจริญ', 'คณะครูผู้เข้าอบรม'),
('106', 'นายสุข ศรีทวีกาศ', 'คณะครูผู้เข้าอบรม'),
('107', 'นางปรียาณัฐ จันทร์ซ้าย', 'คณะครูผู้เข้าอบรม'),
('108', 'นางสาวกนกนาฏ ฝางแสงงาม', 'คณะครูผู้เข้าอบรม'),
('109', 'นายรัตนพล มีศิลป์', 'คณะครูผู้เข้าอบรม'),
('110', 'นางสาวพรรณทิพย์ พิสสมัย', 'คณะครูผู้เข้าอบรม'),
('111', 'นายเจษฎาภรณ์ สันวิลาศ', 'คณะครูผู้เข้าอบรม'),
('112', 'นางสาวกานต์ธีรา เหลาสุภาพ', 'คณะครูผู้เข้าอบรม'),
('113', 'นางสาวปิยะพร นิตยารส', 'คณะครูผู้เข้าอบรม'),
('114', 'นางสาวกันย์ชิสา สามารถ', 'คณะครูผู้เข้าอบรม'),
('115', 'นางฐรัชญา กินรี', 'คณะครูผู้เข้าอบรม'),
('116', 'นางสาวประกายฟ้า เปียนาค', 'คณะครูผู้เข้าอบรม'),
('117', 'นายพุฒิพงษ์ ศิลาแยง', 'คณะครูผู้เข้าอบรม'),
('118', 'นางสาวณัฐกานต์ ชื่นชม', 'คณะครูผู้เข้าอบรม'),
('119', 'นายอาคม วิชัยศร', 'คณะครูผู้เข้าอบรม'),
('120', 'นางสาวเมตตา ผาละกัน', 'คณะครูผู้เข้าอบรม'),
('121', 'นายจิลลาภัทร มุกดา', 'คณะครูผู้เข้าอบรม'),
('122', 'นายพจกร แจ่มสุวรรณ์', 'คณะครูผู้เข้าอบรม'),
('123', 'นางสาววัชนี อ่อนเขียว', 'คณะครูผู้เข้าอบรม'),
('124', 'นายสมเกียรติ สยองเดช', 'คณะครูผู้เข้าอบรม'),
('125', 'นางสาวช่อทิพย์ พรมเสน', 'คณะครูผู้เข้าอบรม'),
('126', 'นายเอนก สุวรรณธาดา', 'คณะครูผู้เข้าอบรม'),
('127', 'นางสาวจีรภา บุดดีคำ', 'คณะครูผู้เข้าอบรม'),
('128', 'นางสาวสุภาวดี แก้วไวยุธ', 'คณะครูผู้เข้าอบรม'),
('129', 'นางสาวทิพากร การสรรพ์', 'คณะครูผู้เข้าอบรม'),
('130', 'นายพิชชากร อุตะโม', 'คณะครูผู้เข้าอบรม'),
('131', 'นางสาวนิศากร เวงวิถา', 'คณะครูผู้เข้าอบรม'),
('132', 'นายสมศักดิ์ โกฐาคาน', 'คณะครูผู้เข้าอบรม'),
('133', 'นายทินกร รังรส', 'คณะครูผู้เข้าอบรม'),
('134', 'นางสาวจตุพร พรมคำบุตร', 'คณะครูผู้เข้าอบรม'),
('135', 'นางสาวพนิดารัตน์ สว่างวงษ์', 'คณะครูผู้เข้าอบรม'),
('136', 'นายกฤษตยชญิ์ พลภักดี', 'คณะครูผู้เข้าอบรม'),
('137', 'นางนิตยา มูลพงษ์', 'คณะครูผู้เข้าอบรม'),
('138', 'นายชาตรี จำนงกิจ', 'คณะครูผู้เข้าอบรม'),
('139', 'นางศุภลักษณ์ จิตจักร', 'คณะครูผู้เข้าอบรม'),
('140', 'นายสหรัฐ โคตรชาลี', 'คณะครูผู้เข้าอบรม'),
('141', 'นางสาวสุพรรญา พรมคำบุตร', 'คณะครูผู้เข้าอบรม'),
('142', 'นางสาวสุภัสดา รถเชษฐา', 'คณะครูผู้เข้าอบรม'),
('143', 'นางสาวมณีรัตน์ สิงหาวาสน์', 'คณะครูผู้เข้าอบรม'),
('144', 'นางสาวลักษณพร พงษ์ขจร', 'คณะครูผู้เข้าอบรม'),
('145', 'นางสาวศิริรัชช์ ศรีปัดถา', 'คณะครูผู้เข้าอบรม'),
('146', 'นางสาวณัฐสุรางค์ ดวงทองพล', 'คณะครูผู้เข้าอบรม'),
('147', 'นางสาวสุพิชชา รัตนเกื้อ', 'คณะครูผู้เข้าอบรม'),
('148', 'นางสาวณัฐวิภา เทียมทัน', 'คณะครูผู้เข้าอบรม'),
('149', 'นางสาวจุฑาทิพย์ รินทราช', 'คณะครูผู้เข้าอบรม'),
('150', 'นางสาวนนทวรรณ บุญมาก', 'คณะครูผู้เข้าอบรม'),
('151', 'นางขนิษฐา อาจมูลลา', 'คณะครูผู้เข้าอบรม'),
('152', 'นายธนธัญ เทศารินทร์', 'คณะครูผู้เข้าอบรม'),
('153', 'Mr. Le Trung Dung', 'คณะครูผู้เข้าอบรม'),
('154', 'Miss Jessa Gutang Madera', 'คณะครูผู้เข้าอบรม'),
('155', 'Miss Jeaneanne Dela Cuesta', 'คณะครูผู้เข้าอบรม'),
('156', 'Mr. Glenn Laorisa Vallente', 'คณะครูผู้เข้าอบรม'),
('157', 'Ms. Mercy Joy Rivera Cafifge', 'คณะครูผู้เข้าอบรม'),
('158', 'Weijiayi', 'คณะครูผู้เข้าอบรม'),
('159', 'Tao anju', 'คณะครูผู้เข้าอบรม'),
('160', 'นางสาวสุมาลี การสวน', 'คณะครูผู้เข้าอบรม'),
('161', 'นายทรงพล ขมิ้นเขียว', 'คณะครูผู้เข้าอบรม')
ON CONFLICT (student_no) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO public.questions (question_order, prompt, choices, correct_key, explanation) VALUES
(1, 'ข้อใดอธิบายความหมายของ AI (Artificial Intelligence) ได้เหมาะสมที่สุด', '{"a": "โปรแกรมที่ใช้สำหรับพิมพ์เอกสารเท่านั้น", "b": "ระบบที่สามารถเรียนรู้ วิเคราะห์ และช่วยแก้ปัญหาจากข้อมูลได้", "c": "เว็บไซต์สำหรับค้นหาข้อมูลบนอินเทอร์เน็ต", "d": "โปรแกรมที่ใช้สร้างภาพเพียงอย่างเดียว"}'::jsonb, 'b', 'AI (Artificial Intelligence) คือระบบคอมพิวเตอร์ที่สามารถเรียนรู้ วิเคราะห์ข้อมูล และช่วยแก้ปัญหาได้เป็นอย่างดี'),
(2, 'ข้อใดเป็นความสามารถของ Generative AI', '{"a": "สร้างข้อความ ภาพ เสียง หรือวิดีโอจากคำสั่งของผู้ใช้", "b": "ใช้ได้เฉพาะการคำนวณทางคณิตศาสตร์", "c": "ใช้ได้เฉพาะการค้นหาเว็บไซต์", "d": "ใช้ได้เฉพาะการจัดเก็บไฟล์"}'::jsonb, 'a', 'Generative AI มีความสามารถหลักในการสร้างสรรค์คอนเทนต์ใหม่ๆ ทั้งข้อความ ภาพ เสียง หรือวิดีโอจากคำสั่ง (Prompt)'),
(3, 'หากต้องการให้ AI ช่วยศึกษาและสรุปข้อมูลจากเอกสารจำนวนมาก เครื่องมือใดเหมาะสม', '{"a": "NotebookLM", "b": "Calculator", "c": "Google Maps", "d": "Paint"}'::jsonb, 'a', 'NotebookLM เป็นเครื่องมือ AI ของ Google ที่ออกแบบมาเพื่อการศึกษา สรุป และวิเคราะห์ข้อมูลจากไฟล์เอกสารจำนวนมากโดยเฉพาะ'),
(4, 'ข้อใดเป็นความแตกต่างสำคัญระหว่าง Search Engine กับ Generative AI', '{"a": "Search Engine สร้างคำตอบใหม่ทุกครั้งโดยไม่ค้นเว็บไซต์", "b": "Generative AI ทำหน้าที่ค้นหาเว็บไซต์เพียงอย่างเดียว", "c": "Search Engine ช่วยค้นหาแหล่งข้อมูล ส่วน Generative AI สามารถสร้างหรือสังเคราะห์คำตอบจากคำสั่งได้", "d": "ทั้งสองอย่างทำงานเหมือนกันทุกประการ"}'::jsonb, 'c', 'Search Engine ดึงและแสดงลิงก์แหล่งข้อมูลเดิม ในขณะที่ Generative AI สามารถสังเคราะห์ สรุป และสร้างคำตอบใหม่ขึ้นมาได้'),
(5, 'หากต้องการให้ AI สร้างคำตอบได้ตรงความต้องการมากขึ้น สิ่งใดสำคัญที่สุด', '{"a": "เขียน Prompt ให้ชัดเจนและมีรายละเอียดครบ", "b": "พิมพ์คำสั่งให้สั้นที่สุดเสมอ", "c": "ไม่ต้องระบุเป้าหมายของงาน", "d": "ใช้คำสั่งเดิมกับทุกงาน"}'::jsonb, 'a', 'การเขียน Prompt ที่มีความชัดเจน มีบริบท และระบุรายละเอียดครบถ้วน จะช่วยให้ AI สร้างคำตอบตรงตามวัตถุประสงค์'),
(6, 'ข้อใดเป็นองค์ประกอบหนึ่งของการเขียน Prompt ที่ดีตามหลัก Role–Context–Task–Format–Constraints', '{"a": "Role หรือบทบาทที่ต้องการให้ AI ทำ", "b": "Password ของผู้ใช้", "c": "จำนวนผู้ใช้อินเทอร์เน็ต", "d": "ยี่ห้อคอมพิวเตอร์"}'::jsonb, 'a', 'หลัก Role-Context-Task-Format-Constraints กำหนดให้มี Role (การกำหนดบทบาทให้ AI) เป็นองค์ประกอบสำคัญ'),
(7, 'หากต้องการให้ AI ช่วย “ออกข้อสอบวิทยาศาสตร์ ม.1 จำนวน 10 ข้อ พร้อมเฉลย” ข้อความดังกล่าวส่วนใดถือเป็น Task', '{"a": "วิทยาศาสตร์", "b": "ม.1", "c": "ออกข้อสอบจำนวน 10 ข้อพร้อมเฉลย", "d": "AI"}'::jsonb, 'c', 'Task คือคำสั่งหรืองานที่ต้องการให้ AI ลงมือทำ ในที่นี้คือ การออกข้อสอบจำนวน 10 ข้อพร้อมเฉลย'),
(8, 'Token ในระบบ AI หมายถึงอะไร', '{"a": "เงินดิจิทัลสำหรับซื้อโปรแกรม AI เท่านั้น", "b": "หน่วยย่อยของข้อความที่ AI ใช้อ่านและประมวลผล", "c": "รหัสผ่านสำหรับเข้าใช้งาน AI", "d": "จำนวนภาพที่ AI สามารถสร้างได้"}'::jsonb, 'b', 'Token คือหน่วยย่อยของคำหรือข้อความที่โมเดล AI ตัดแบ่งเพื่อใช้อ่าน ประมวลผล และคำนวณค่าบริบท'),
(9, '“Context Window” เกี่ยวข้องกับข้อใดมากที่สุด', '{"a": "ขนาดหน้าจอคอมพิวเตอร์", "b": "ปริมาณข้อมูลหรือบริบทที่ AI สามารถพิจารณาในการประมวลผลครั้งหนึ่ง", "c": "จำนวนผู้ใช้งาน AI พร้อมกัน", "d": "ความเร็วของอินเทอร์เน็ต"}'::jsonb, 'b', 'Context Window คือขนาดของความจำชั่วคราว หรือปริมาณข้อมูลสูงสุดที่ AI สามารถอ่านและพิจารณาประมวลผลได้ในหนึ่งรอบ'),
(10, 'วิธีใดช่วยใช้ AI ได้อย่างมีประสิทธิภาพและประหยัด Token มากที่สุด', '{"a": "ส่งข้อมูลทั้งหมดโดยไม่คัดเลือก", "b": "เขียนคำสั่งยาวซ้ำไปซ้ำมา", "c": "กำหนด Prompt ให้ชัดเจน ตัดข้อมูลที่ไม่จำเป็น และระบุรูปแบบผลลัพธ์ที่ต้องการ", "d": "ถามหลายเรื่องที่ไม่เกี่ยวข้องกันในคำสั่งเดียว"}'::jsonb, 'c', 'การตัดข้อมูลขยะออกและกำหนด Prompt ให้กระชับ สัดทัด ชัดเจน ช่วยลดจำนวน Token และทำให้ AI ตอบได้รวดเร็วและตรงจุด');
