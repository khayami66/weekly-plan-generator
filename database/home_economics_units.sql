-- 家庭科 教科書単元データ（5-6年生）
-- 学習指導要領に基づく標準的な単元構成

-- 5年生 家庭科単元データ
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

-- 6年生 家庭科単元データ
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

-- 光村図書版も同様のデータを作成（教科書会社による違いを模擬）
INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    1,
    '私の生活、大発見！',
    '家族・家庭生活',
    2,
    '4月上旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    2,
    '気持ちよい住まいの工夫',
    '住生活',
    4,
    '4月中旬～下旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    3,
    'はじめてみよう クッキング',
    '食生活',
    6,
    '5月上旬～中旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    4,
    'ミシンでソーイング',
    '衣生活',
    8,
    '6月～7月前半'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    5,
    5,
    '食べて元気！ご飯とみそ汁',
    '食生活',
    8,
    '9月～10月前半'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';

-- 6年生 光村図書版
INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    1,
    '見つめてみよう 生活時間',
    '家族・家庭生活',
    2,
    '4月上旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    2,
    'いろどり鮮やか 野菜の力',
    '食生活',
    8,
    '4月中旬～5月中旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    3,
    '夏をすずしく さわやかに',
    '住生活',
    4,
    '6月～7月前半'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    4,
    '楽しく ソーイング',
    '衣生活',
    8,
    '9月～10月中旬'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';

INSERT INTO textbook_units (publisher_id, subject_id, grade, unit_order, unit_name, category, suggested_hours, suggested_period) 
SELECT 
    p.id,
    s.id,
    6,
    5,
    'みんなでおいしく',
    '食生活',
    10,
    '11月～1月'
FROM publishers p
CROSS JOIN subjects s
WHERE p.code = 'mitsumura' AND s.name = '家庭';