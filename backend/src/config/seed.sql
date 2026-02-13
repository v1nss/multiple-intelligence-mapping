-- ============================================================
-- SEED DATA for MIM System
-- ============================================================

-- ============================================================
-- 1. ASSESSMENT VERSION
-- ============================================================
INSERT INTO assessment_versions (version_name, is_active)
VALUES ('MIPQ III + RIASEC v1.0', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. MI DOMAINS (9 intelligences)
-- ============================================================
INSERT INTO domains (name, type, description) VALUES
  ('Linguistic', 'MI', 'Ability to use words effectively, both orally and in writing.'),
  ('Logical-Mathematical', 'MI', 'Capacity to use numbers effectively and reason well.'),
  ('Musical', 'MI', 'Capacity to perceive, discriminate, transform, and express musical forms.'),
  ('Bodily-Kinesthetic', 'MI', 'Expertise in using the whole body to express ideas and feelings.'),
  ('Spatial', 'MI', 'Ability to perceive the visual-spatial world accurately.'),
  ('Interpersonal', 'MI', 'Ability to perceive and make distinctions in the moods and intentions of others.'),
  ('Intrapersonal', 'MI', 'Self-knowledge and ability to act adaptively on the basis of that knowledge.'),
  ('Naturalistic', 'MI', 'Expertise in recognizing and classifying flora and fauna.'),
  ('Existential', 'MI', 'Sensitivity and capacity to tackle deep questions about human existence.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. RIASEC DOMAINS (6 types)
-- ============================================================
INSERT INTO domains (name, type, description) VALUES
  ('Realistic', 'RIASEC', 'Prefers physical activities that require skill, strength, and coordination.'),
  ('Investigative', 'RIASEC', 'Prefers activities involving thinking, organizing, and understanding.'),
  ('Artistic', 'RIASEC', 'Prefers ambiguous, free, unsystematized activities for creative expression.'),
  ('Social', 'RIASEC', 'Prefers activities that involve helping and developing others.'),
  ('Enterprising', 'RIASEC', 'Prefers activities that involve influencing others to attain goals.'),
  ('Conventional', 'RIASEC', 'Prefers activities that involve systematic manipulation of data, records, or materials.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. SHS STRANDS
-- ============================================================
INSERT INTO strands (name, description) VALUES
  ('STEM', 'Science, Technology, Engineering, and Mathematics'),
  ('ABM', 'Accountancy, Business, and Management'),
  ('HUMSS', 'Humanities and Social Sciences'),
  ('GAS', 'General Academic Strand'),
  ('TVL', 'Technical-Vocational-Livelihood'),
  ('Sports', 'Sports Track'),
  ('Arts and Design', 'Arts and Design Track')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. STRAND WEIGHTS (domain_id references order of insertion)
--    Adjust these weights based on validated mappings.
--    MI domains: 1=Ling, 2=LogMath, 3=Musical, 4=BodilyKin,
--    5=Spatial, 6=Interp, 7=Intrap, 8=Natural, 9=Exist
--    RIASEC:    10=Real, 11=Invest, 12=Artistic, 13=Social,
--               14=Enter, 15=Conven
-- ============================================================

-- STEM (strand_id=1)
INSERT INTO strand_weights (strand_id, domain_id, weight) VALUES
  (1, 2, 0.25),  -- Logical-Mathematical → STEM (high)
  (1, 5, 0.15),  -- Spatial → STEM
  (1, 8, 0.10),  -- Naturalistic → STEM
  (1, 7, 0.05),  -- Intrapersonal → STEM
  (1, 10, 0.15), -- Realistic → STEM
  (1, 11, 0.25), -- Investigative → STEM
  (1, 15, 0.05)  -- Conventional → STEM
ON CONFLICT DO NOTHING;

-- ABM (strand_id=2)
INSERT INTO strand_weights (strand_id, domain_id, weight) VALUES
  (2, 2, 0.20),  -- Logical-Mathematical → ABM
  (2, 1, 0.10),  -- Linguistic → ABM
  (2, 6, 0.10),  -- Interpersonal → ABM
  (2, 7, 0.05),  -- Intrapersonal → ABM
  (2, 14, 0.25), -- Enterprising → ABM (high)
  (2, 15, 0.20), -- Conventional → ABM
  (2, 13, 0.10)  -- Social → ABM
ON CONFLICT DO NOTHING;

-- HUMSS (strand_id=3)
INSERT INTO strand_weights (strand_id, domain_id, weight) VALUES
  (3, 1, 0.25),  -- Linguistic → HUMSS (high)
  (3, 6, 0.15),  -- Interpersonal → HUMSS
  (3, 9, 0.15),  -- Existential → HUMSS
  (3, 7, 0.10),  -- Intrapersonal → HUMSS
  (3, 13, 0.20), -- Social → HUMSS
  (3, 12, 0.10), -- Artistic → HUMSS
  (3, 14, 0.05)  -- Enterprising → HUMSS
ON CONFLICT DO NOTHING;

-- GAS (strand_id=4)
INSERT INTO strand_weights (strand_id, domain_id, weight) VALUES
  (4, 1, 0.12),  -- Linguistic → GAS
  (4, 2, 0.12),  -- Logical-Mathematical → GAS
  (4, 6, 0.12),  -- Interpersonal → GAS
  (4, 7, 0.10),  -- Intrapersonal → GAS
  (4, 9, 0.08),  -- Existential → GAS
  (4, 11, 0.12), -- Investigative → GAS
  (4, 13, 0.12), -- Social → GAS
  (4, 14, 0.12), -- Enterprising → GAS
  (4, 15, 0.10)  -- Conventional → GAS
ON CONFLICT DO NOTHING;

-- TVL (strand_id=5)
INSERT INTO strand_weights (strand_id, domain_id, weight) VALUES
  (5, 4, 0.20),  -- Bodily-Kinesthetic → TVL
  (5, 5, 0.15),  -- Spatial → TVL
  (5, 8, 0.10),  -- Naturalistic → TVL
  (5, 10, 0.25), -- Realistic → TVL (high)
  (5, 15, 0.15), -- Conventional → TVL
  (5, 11, 0.10), -- Investigative → TVL
  (5, 7, 0.05)   -- Intrapersonal → TVL
ON CONFLICT DO NOTHING;

-- Sports (strand_id=6)
INSERT INTO strand_weights (strand_id, domain_id, weight) VALUES
  (6, 4, 0.30),  -- Bodily-Kinesthetic → Sports (high)
  (6, 6, 0.15),  -- Interpersonal → Sports
  (6, 7, 0.10),  -- Intrapersonal → Sports
  (6, 8, 0.10),  -- Naturalistic → Sports
  (6, 10, 0.20), -- Realistic → Sports
  (6, 13, 0.10), -- Social → Sports
  (6, 14, 0.05)  -- Enterprising → Sports
ON CONFLICT DO NOTHING;

-- Arts and Design (strand_id=7)
INSERT INTO strand_weights (strand_id, domain_id, weight) VALUES
  (7, 3, 0.25),  -- Musical → Arts (high)
  (7, 5, 0.20),  -- Spatial → Arts
  (7, 4, 0.10),  -- Bodily-Kinesthetic → Arts
  (7, 9, 0.10),  -- Existential → Arts
  (7, 12, 0.25), -- Artistic → Arts (high)
  (7, 7, 0.05),  -- Intrapersonal → Arts
  (7, 6, 0.05)   -- Interpersonal → Arts
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. CAREERS
-- ============================================================
INSERT INTO careers (name, description) VALUES
  ('Software Engineer', 'Designs, develops, and maintains software systems and applications.'),
  ('Data Scientist', 'Analyzes complex data to help organizations make better decisions.'),
  ('Civil Engineer', 'Designs and oversees construction of infrastructure projects.'),
  ('Doctor / Physician', 'Diagnoses and treats illnesses and injuries in patients.'),
  ('Nurse', 'Provides patient care, health education, and medical support.'),
  ('Accountant', 'Manages financial records, audits, and tax compliance.'),
  ('Entrepreneur', 'Starts and manages businesses, identifying market opportunities.'),
  ('Lawyer', 'Advises and represents clients in legal matters.'),
  ('Teacher', 'Educates students and facilitates learning in academic settings.'),
  ('Psychologist', 'Studies mental processes and behavior, provides counseling.'),
  ('Journalist', 'Researches, writes, and reports on news and current events.'),
  ('Graphic Designer', 'Creates visual concepts for communications using design tools.'),
  ('Musician / Composer', 'Creates, performs, and produces music.'),
  ('Architect', 'Designs buildings and structures, plans spatial environments.'),
  ('Environmental Scientist', 'Studies the environment and develops solutions to environmental problems.'),
  ('Marketing Manager', 'Plans and executes marketing strategies for products or services.'),
  ('Social Worker', 'Helps individuals and communities cope with challenges.'),
  ('Athlete / Sports Coach', 'Competes in sports or coaches athletes to improve performance.'),
  ('Chef / Culinary Artist', 'Prepares food and manages kitchen operations creatively.'),
  ('Mechanical Engineer', 'Designs and develops mechanical systems and devices.'),
  ('Financial Analyst', 'Evaluates financial data and provides investment recommendations.'),
  ('Diplomat / Foreign Service', 'Represents country in international relations and negotiations.'),
  ('Biologist', 'Studies living organisms and their relationships to the environment.'),
  ('Animator / Multimedia Artist', 'Creates visual effects, animations, and multimedia content.'),
  ('Counselor', 'Provides guidance and support for personal and professional development.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. CAREER WEIGHTS
--    career_id by insertion order (1-25)
--    domain_id: MI(1-9), RIASEC(10-15)
-- ============================================================

-- 1. Software Engineer
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (1, 2, 0.30), (1, 5, 0.15), (1, 7, 0.10), (1, 11, 0.25), (1, 10, 0.15), (1, 15, 0.05)
ON CONFLICT DO NOTHING;

-- 2. Data Scientist
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (2, 2, 0.30), (2, 7, 0.10), (2, 1, 0.10), (2, 11, 0.30), (2, 15, 0.10), (2, 10, 0.10)
ON CONFLICT DO NOTHING;

-- 3. Civil Engineer
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (3, 2, 0.20), (3, 5, 0.25), (3, 4, 0.10), (3, 10, 0.25), (3, 11, 0.15), (3, 15, 0.05)
ON CONFLICT DO NOTHING;

-- 4. Doctor / Physician
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (4, 2, 0.15), (4, 8, 0.15), (4, 6, 0.15), (4, 7, 0.10), (4, 11, 0.25), (4, 13, 0.20)
ON CONFLICT DO NOTHING;

-- 5. Nurse
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (5, 6, 0.20), (5, 4, 0.10), (5, 8, 0.10), (5, 13, 0.30), (5, 11, 0.15), (5, 10, 0.15)
ON CONFLICT DO NOTHING;

-- 6. Accountant
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (6, 2, 0.30), (6, 7, 0.10), (6, 15, 0.35), (6, 14, 0.10), (6, 11, 0.10), (6, 1, 0.05)
ON CONFLICT DO NOTHING;

-- 7. Entrepreneur
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (7, 6, 0.15), (7, 1, 0.10), (7, 2, 0.10), (7, 7, 0.10), (7, 14, 0.35), (7, 13, 0.10), (7, 12, 0.10)
ON CONFLICT DO NOTHING;

-- 8. Lawyer
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (8, 1, 0.30), (8, 6, 0.15), (8, 9, 0.10), (8, 7, 0.10), (8, 14, 0.20), (8, 13, 0.15)
ON CONFLICT DO NOTHING;

-- 9. Teacher
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (9, 1, 0.20), (9, 6, 0.20), (9, 9, 0.10), (9, 13, 0.30), (9, 12, 0.10), (9, 14, 0.10)
ON CONFLICT DO NOTHING;

-- 10. Psychologist
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (10, 7, 0.20), (10, 6, 0.20), (10, 9, 0.15), (10, 1, 0.10), (10, 13, 0.20), (10, 11, 0.15)
ON CONFLICT DO NOTHING;

-- 11. Journalist
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (11, 1, 0.35), (11, 6, 0.10), (11, 9, 0.10), (11, 7, 0.10), (11, 12, 0.15), (11, 11, 0.10), (11, 14, 0.10)
ON CONFLICT DO NOTHING;

-- 12. Graphic Designer
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (12, 5, 0.30), (12, 3, 0.10), (12, 7, 0.05), (12, 12, 0.35), (12, 10, 0.10), (12, 11, 0.10)
ON CONFLICT DO NOTHING;

-- 13. Musician / Composer
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (13, 3, 0.40), (13, 7, 0.10), (13, 9, 0.10), (13, 12, 0.30), (13, 13, 0.05), (13, 14, 0.05)
ON CONFLICT DO NOTHING;

-- 14. Architect
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (14, 5, 0.30), (14, 2, 0.15), (14, 3, 0.10), (14, 12, 0.20), (14, 10, 0.15), (14, 11, 0.10)
ON CONFLICT DO NOTHING;

-- 15. Environmental Scientist
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (15, 8, 0.30), (15, 2, 0.15), (15, 9, 0.10), (15, 11, 0.25), (15, 10, 0.15), (15, 13, 0.05)
ON CONFLICT DO NOTHING;

-- 16. Marketing Manager
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (16, 1, 0.15), (16, 6, 0.15), (16, 5, 0.10), (16, 14, 0.30), (16, 13, 0.15), (16, 12, 0.15)
ON CONFLICT DO NOTHING;

-- 17. Social Worker
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (17, 6, 0.25), (17, 9, 0.15), (17, 7, 0.15), (17, 13, 0.30), (17, 12, 0.05), (17, 14, 0.10)
ON CONFLICT DO NOTHING;

-- 18. Athlete / Sports Coach
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (18, 4, 0.35), (18, 6, 0.15), (18, 7, 0.10), (18, 10, 0.20), (18, 13, 0.10), (18, 14, 0.10)
ON CONFLICT DO NOTHING;

-- 19. Chef / Culinary Artist
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (19, 4, 0.20), (19, 8, 0.15), (19, 5, 0.10), (19, 12, 0.20), (19, 10, 0.25), (19, 14, 0.10)
ON CONFLICT DO NOTHING;

-- 20. Mechanical Engineer
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (20, 2, 0.20), (20, 5, 0.20), (20, 4, 0.10), (20, 10, 0.30), (20, 11, 0.15), (20, 15, 0.05)
ON CONFLICT DO NOTHING;

-- 21. Financial Analyst
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (21, 2, 0.30), (21, 7, 0.10), (21, 1, 0.05), (21, 11, 0.20), (21, 15, 0.25), (21, 14, 0.10)
ON CONFLICT DO NOTHING;

-- 22. Diplomat / Foreign Service
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (22, 1, 0.20), (22, 6, 0.20), (22, 9, 0.15), (22, 14, 0.20), (22, 13, 0.15), (22, 12, 0.10)
ON CONFLICT DO NOTHING;

-- 23. Biologist
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (23, 8, 0.30), (23, 2, 0.15), (23, 7, 0.05), (23, 11, 0.30), (23, 10, 0.15), (23, 13, 0.05)
ON CONFLICT DO NOTHING;

-- 24. Animator / Multimedia Artist
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (24, 5, 0.25), (24, 3, 0.15), (24, 4, 0.05), (24, 12, 0.30), (24, 10, 0.15), (24, 11, 0.10)
ON CONFLICT DO NOTHING;

-- 25. Counselor
INSERT INTO career_weights (career_id, domain_id, weight) VALUES
  (25, 6, 0.25), (25, 7, 0.20), (25, 9, 0.15), (25, 1, 0.10), (25, 13, 0.20), (25, 12, 0.10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. SAMPLE QUESTIONS (MIPQ III + RIASEC)
--    version_id=1, 5 questions per domain = 75 total
-- ============================================================

-- Linguistic (domain_id=1)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 1, 'I enjoy reading books, articles, or written materials.', 1),
  (1, 1, 'I find it easy to express my thoughts through writing.', 2),
  (1, 1, 'I enjoy word games, crossword puzzles, or tongue twisters.', 3),
  (1, 1, 'I can explain complex ideas clearly using words.', 4),
  (1, 1, 'I enjoy learning new words and expanding my vocabulary.', 5);

-- Logical-Mathematical (domain_id=2)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 2, 'I enjoy solving math problems and logical puzzles.', 6),
  (1, 2, 'I like to analyze situations and find patterns.', 7),
  (1, 2, 'I am comfortable working with numbers and data.', 8),
  (1, 2, 'I enjoy strategy games that require logical thinking.', 9),
  (1, 2, 'I often look for cause-and-effect relationships in events.', 10);

-- Musical (domain_id=3)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 3, 'I can easily recognize melodies, rhythms, or tunes.', 11),
  (1, 3, 'I enjoy playing a musical instrument or singing.', 12),
  (1, 3, 'Music strongly affects my mood and emotions.', 13),
  (1, 3, 'I often hum or tap rhythms unconsciously.', 14),
  (1, 3, 'I can tell when a musical note is off-key.', 15);

-- Bodily-Kinesthetic (domain_id=4)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 4, 'I excel at sports or physical activities.', 16),
  (1, 4, 'I learn best by doing things hands-on.', 17),
  (1, 4, 'I have good coordination and physical control.', 18),
  (1, 4, 'I enjoy building, crafting, or working with my hands.', 19),
  (1, 4, 'I find it hard to sit still for long periods of time.', 20);

-- Spatial (domain_id=5)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 5, 'I can easily visualize objects from different angles.', 21),
  (1, 5, 'I enjoy drawing, painting, or creating visual art.', 22),
  (1, 5, 'I am good at reading maps and navigating directions.', 23),
  (1, 5, 'I notice visual details that others often miss.', 24),
  (1, 5, 'I prefer learning through charts, diagrams, and images.', 25);

-- Interpersonal (domain_id=6)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 6, 'I easily understand how other people feel.', 26),
  (1, 6, 'I enjoy working in teams and group activities.', 27),
  (1, 6, 'People often come to me for advice or help.', 28),
  (1, 6, 'I am good at resolving conflicts between people.', 29),
  (1, 6, 'I can sense the mood of a group quickly.', 30);

-- Intrapersonal (domain_id=7)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 7, 'I understand my own strengths and weaknesses well.', 31),
  (1, 7, 'I set personal goals and work toward them independently.', 32),
  (1, 7, 'I prefer working alone rather than in groups.', 33),
  (1, 7, 'I spend time reflecting on my thoughts and feelings.', 34),
  (1, 7, 'I am self-motivated and disciplined in my tasks.', 35);

-- Naturalistic (domain_id=8)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 8, 'I enjoy being in nature and observing the environment.', 36),
  (1, 8, 'I can easily identify different plants, animals, or rocks.', 37),
  (1, 8, 'I am concerned about environmental issues and conservation.', 38),
  (1, 8, 'I enjoy gardening, hiking, or outdoor activities.', 39),
  (1, 8, 'I notice patterns and changes in the natural world.', 40);

-- Existential (domain_id=9)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 9, 'I often think about the meaning of life and existence.', 41),
  (1, 9, 'I am drawn to philosophical or spiritual discussions.', 42),
  (1, 9, 'I wonder about what happens after death.', 43),
  (1, 9, 'I enjoy exploring big questions about the universe.', 44),
  (1, 9, 'I find purpose and meaning in helping others understand life.', 45);

-- Realistic (domain_id=10)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 10, 'I enjoy working with tools, machines, or equipment.', 46),
  (1, 10, 'I prefer practical tasks over theoretical discussions.', 47),
  (1, 10, 'I like fixing or repairing things around the house.', 48),
  (1, 10, 'I enjoy outdoor work or physical labor.', 49),
  (1, 10, 'I am good at assembling or constructing objects.', 50);

-- Investigative (domain_id=11)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 11, 'I enjoy conducting experiments and research.', 51),
  (1, 11, 'I like to investigate and solve complex problems.', 52),
  (1, 11, 'I prefer to understand how things work before using them.', 53),
  (1, 11, 'I enjoy reading scientific or technical materials.', 54),
  (1, 11, 'I am curious and always asking "why" about things.', 55);

-- Artistic (RIASEC, domain_id=12)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 12, 'I enjoy creating art, music, drama, or creative writing.', 56),
  (1, 12, 'I prefer work environments that allow self-expression.', 57),
  (1, 12, 'I appreciate beauty and aesthetics in my surroundings.', 58),
  (1, 12, 'I like to think of new and original ideas.', 59),
  (1, 12, 'I prefer unstructured activities where I can be creative.', 60);

-- Social (RIASEC, domain_id=13)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 13, 'I enjoy helping people with their problems.', 61),
  (1, 13, 'I like teaching, coaching, or mentoring others.', 62),
  (1, 13, 'I am drawn to community service and volunteer work.', 63),
  (1, 13, 'I am patient and empathetic when dealing with others.', 64),
  (1, 13, 'I enjoy cooperating with others on shared goals.', 65);

-- Enterprising (RIASEC, domain_id=14)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 14, 'I enjoy leading and organizing group activities.', 66),
  (1, 14, 'I like persuading and motivating other people.', 67),
  (1, 14, 'I am interested in business, sales, or management.', 68),
  (1, 14, 'I enjoy taking risks and making decisions.', 69),
  (1, 14, 'I am confident in presenting ideas to an audience.', 70);

-- Conventional (RIASEC, domain_id=15)
INSERT INTO questions (version_id, domain_id, question_text, order_index) VALUES
  (1, 15, 'I like organizing files, data, and records systematically.', 71),
  (1, 15, 'I prefer following clear procedures and instructions.', 72),
  (1, 15, 'I am detail-oriented and careful in my work.', 73),
  (1, 15, 'I enjoy working with spreadsheets, databases, or forms.', 74),
  (1, 15, 'I prefer a structured and predictable work environment.', 75);
