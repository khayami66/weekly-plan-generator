# Supabaseにコピー&ペーストするSQLコード

## 1. まず、このコードをコピーしてSupabaseのSQL Editorに貼り付けてください：

```sql
-- 週案自動生成システム データベーススキーマ

-- ユーザー基本情報
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('homeroom', 'specialist')) NOT NULL,
    grade INTEGER, -- 担任の場合の学年
    class_number INTEGER, -- 担任の場合の組
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 教科マスタ
CREATE TABLE subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(50), -- 主要教科、専科教科等
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 教科書出版社マスタ
CREATE TABLE publishers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー担当教科・教科書設定
CREATE TABLE user_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    grade INTEGER NOT NULL,
    class_number INTEGER, -- 専科の場合、担当するクラス
    publisher_id UUID REFERENCES publishers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学校設定（地域・カレンダー）
CREATE TABLE school_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prefecture VARCHAR(50),
    academic_year INTEGER NOT NULL,
    spring_break_start DATE,
    spring_break_end DATE,
    summer_break_start DATE,
    summer_break_end DATE,
    winter_break_start DATE,
    winter_break_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 時間割設定
CREATE TABLE schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100), -- '基本時間割', '運動会前特別時間割' 等
    is_default BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 時間割詳細
CREATE TABLE schedule_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=月曜日
    period INTEGER NOT NULL,
    subject_id UUID REFERENCES subjects(id),
    grade INTEGER, -- 専科の場合
    class_number INTEGER, -- 専科の場合
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 学校行事・特別日程
CREATE TABLE school_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(50), -- 'holiday', 'short_day', 'event', 'meeting' 等
    schedule_id UUID REFERENCES schedules(id), -- 特別時間割がある場合
    hours_fraction DECIMAL(3,2), -- 時数に影響する場合 (例: 0.33 = 1/3)
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 教科書単元データ
CREATE TABLE textbook_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    publisher_id UUID REFERENCES publishers(id),
    subject_id UUID REFERENCES subjects(id),
    grade INTEGER NOT NULL,
    unit_order INTEGER NOT NULL,
    unit_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    suggested_hours INTEGER NOT NULL,
    suggested_period VARCHAR(50), -- '4月上旬', '1学期前半' 等
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 週案データ
CREATE TABLE weekly_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    academic_year INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 週案詳細（各コマの内容）
CREATE TABLE weekly_plan_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    weekly_plan_id UUID REFERENCES weekly_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7),
    period INTEGER NOT NULL,
    subject_id UUID REFERENCES subjects(id),
    unit_id UUID REFERENCES textbook_units(id),
    grade INTEGER, -- 専科の場合
    class_number INTEGER, -- 専科の場合
    hours DECIMAL(3,2) DEFAULT 1.0, -- 分数時数対応
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 時数管理（月次・累積）
CREATE TABLE hours_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    grade INTEGER NOT NULL,
    academic_year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    planned_hours DECIMAL(4,1),
    actual_hours DECIMAL(4,1) DEFAULT 0,
    cumulative_planned DECIMAL(5,1),
    cumulative_actual DECIMAL(5,1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_subjects_user_id ON user_subjects(user_id);
CREATE INDEX idx_weekly_plans_user_date ON weekly_plans(user_id, week_start_date);
CREATE INDEX idx_weekly_plan_details_plan_id ON weekly_plan_details(weekly_plan_id);
CREATE INDEX idx_hours_management_user_subject ON hours_management(user_id, subject_id, academic_year);

-- 初期データ：教科マスタ
INSERT INTO subjects (name, category) VALUES
('国語', '主要教科'),
('算数', '主要教科'),
('理科', '主要教科'),
('社会', '主要教科'),
('音楽', '専科教科'),
('図画工作', '専科教科'),
('家庭', '専科教科'),
('体育', '主要教科'),
('道徳', '主要教科'),
('外国語', '専科教科'),
('総合的な学習の時間', 'その他'),
('特別活動', 'その他');

-- 初期データ：出版社マスタ
INSERT INTO publishers (name, code) VALUES
('教科書なし', 'none'),
('東京書籍', 'tokyo'),
('教育出版', 'kyoiku'),
('光村図書出版', 'mitsumura'),
('大日本図書', 'dainippon'),
('日本文教出版', 'bunkyou'),
('啓林館', 'keirinkan'),
('学校図書', 'gakko'),
('帝国書院', 'teikoku'),
('三省堂', 'sanseido'),
('光文書院', 'kobun');
```

## 2. 上記が成功したら、新しいクエリでこのコードも実行してください：

```sql
-- 家庭科 教科書単元データ（5-6年生）

-- 5年生 家庭科単元データ（東京書籍）
INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    1,
    '家族の生活再発見',
    '家族・家庭生活',
    2,
    '4月上旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    2,
    '整理・整とんで快適に',
    '住生活',
    4,
    '4月中旬～下旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    3,
    'クッキングはじめの一歩',
    '食生活',
    6,
    '5月上旬～中旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    4,
    'ひと針に心をこめて',
    '衣生活',
    8,
    '6月～7月前半'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    5,
    'おいしい楽しい調理の力',
    '食生活',
    8,
    '9月～10月前半'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    6,
    '暖かい住まい方',
    '住生活',
    4,
    '11月～12月前半'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    7,
    '家族とのふれ合いを生かして',
    '家族・家庭生活',
    3,
    '1月～2月'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

-- 6年生 家庭科単元データ（東京書籍）
INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    1,
    '思いを形にして生活を豊かに',
    '家族・家庭生活',
    2,
    '4月上旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    2,
    '朝食から健康な1日の生活を',
    '食生活',
    8,
    '4月中旬～5月中旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    3,
    'すずしく快適に過ごす住まい方',
    '住生活',
    4,
    '6月～7月前半'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    4,
    'まかせてね 今日の食事',
    '食生活',
    10,
    '9月～11月前半'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    5,
    '生活を豊かにソーイング',
    '衣生活',
    8,
    '11月中旬～1月'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    6,
    '中学校へ向けて',
    '家族・家庭生活',
    3,
    '2月～3月'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'tokyo' AND s.name = '家庭';
```