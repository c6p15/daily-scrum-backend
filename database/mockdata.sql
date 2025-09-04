-- Disable FK checks temporarily for clean insert
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE notifications;
TRUNCATE TABLE comments;
TRUNCATE TABLE posts;
TRUNCATE TABLE user_project;
TRUNCATE TABLE projects;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

-- 1. Users
INSERT INTO users (id, firstname, lastname, email, password, profile_pic)
VALUES 
(1, 'Alice', 'Nguyen', 'alice@example.com', 'hashedpassword1', NULL),
(2, 'Bob', 'Chaiyasit', 'bob@example.com', 'hashedpassword2', NULL),
(3, 'Charlie', 'Tan', 'charlie@example.com', 'hashedpassword3', NULL),
(4, 'David', 'Wong', 'david@example.com', 'hashedpassword4', NULL),
(5, 'Eva', 'Lim', 'eva@example.com', 'hashedpassword5', NULL),
(6, 'Frank', 'Somsak', 'frank@example.com', 'hashedpassword6', NULL);

-- 2. Projects (เกี่ยวกับการทำระบบ Daily Scrum)
INSERT INTO projects (id, title, description, status, deadline_date, scrum_time)
VALUES 
(1, 'Daily Scrum WebApp', 'ระบบสำหรับบันทึกและจัดการการประชุม Daily Scrum', 'in_progress', '2025-09-30', '09:00:00'),
(2, 'Notification Service', 'ระบบแจ้งเตือนโพสต์ Scrum และคอมเมนต์', 'in_progress', '2025-09-15', '10:00:00'),
(3, 'Scoring Module', 'ระบบให้คะแนนการโพสต์ Scrum ตรงเวลา', 'in_progress', '2025-09-20', '11:00:00'),
(4, 'Scrum Analytics Dashboard', 'แดชบอร์ดสำหรับติดตามและวิเคราะห์ข้อมูล Scrum', 'done', '2025-10-05', '14:00:00');

-- 3. User-Project
INSERT INTO user_project (id, user_id, project_id, position, scrum_point, is_pinned)
VALUES 
(1, 1, 1, 'Frontend Developer', 12, TRUE),
(2, 2, 1, 'Backend Developer', 10, FALSE),
(3, 3, 1, 'Project Manager', 15, TRUE),
(4, 4, 2, 'Backend Developer', 8, FALSE),
(5, 5, 2, 'QA Engineer', 7, FALSE),
(6, 6, 3, 'DevOps Engineer', 9, FALSE),
(7, 1, 4, 'Frontend Developer', 10, FALSE),
(8, 2, 4, 'Backend Developer', 10, FALSE),
(9, 3, 4, 'Project Manager', 15, TRUE);

-- 4. Daily Scrum (เพิ่มเติม)
INSERT INTO posts (id, type, today_task, problem, tomorrow_task, good, bad, try, next_sprint, user_project_id)
VALUES 
(1, 'daily', 'เชื่อม API กับ frontend', 'Response delay', 'แก้ไข debounce requests', 'API เชื่อมต่อได้', 'บาง request timeout', 'เพิ่ม retry logic', NULL, 2),
(2, 'daily', 'เพิ่มระบบ login และ session', NULL, 'ทดสอบ security', 'Login flow ใช้งานได้', 'ยังไม่มี audit log', 'เพิ่ม session expiration', NULL, 1),
(3, 'weekly', 'รีวิว UI ฟอร์ม Scrum', 'บาง field ไม่ชัดเจน', 'ปรับ layout และ tooltip', 'UI สวยงาม', 'ผู้ใช้สับสนบางส่วน', 'ปรับ label และ hint', NULL, 1),
(4, 'daily', 'ตั้งค่า cron job แจ้งเตือน', 'เวลา delay', 'ทดสอบ notification ครบทุก user', 'แจ้งเตือนทำงาน', 'บาง user ไม่รับ notify', 'ปรับ queue และ retry', NULL, 5),
(5, 'weekly', 'วิเคราะห์คะแนนการโพสต์ Scrum', 'บางคะแนนผิด', 'ปรับ business rule', 'Leaderboard แสดงถูกต้อง', 'คะแนนบาง user ผิด', 'เพิ่ม unit test', 'ปรับระบบแจ้งเตือนคะแนน', 6),
(6, 'daily', 'ทดสอบระบบ rollback CI/CD', 'Script ล้มเหลว', 'แก้ไข deployment script', 'Deploy สำเร็จ', 'Manual rollback ยุ่งยาก', 'ปรับ script ให้ auto rollback', NULL, 6),
(7, 'daily', 'ปรับปรุงหน้า dashboard Analytics', 'Chart โหลดช้า', 'ปรับ query และ cache', 'Chart แสดงครบ', 'Performance ยังไม่ดี', 'ใช้ cache และ optimize query', NULL, 4),
(8, 'weekly', 'เพิ่มฟีเจอร์ filter ตาม project', NULL, 'ทดสอบ filter ครบทุกกรณี', 'Filter ใช้งานได้', 'บาง case ยังไม่ถูกต้อง', 'เพิ่ม unit test', NULL, 4),
(9, 'daily', 'เพิ่มฟังก์ชันค้นหา Scrum', 'Search delay', 'ปรับ index', 'Search ทำงาน', 'บางคำค้นหาไม่เจอ', 'เพิ่ม caching', NULL, 1),
(10, 'daily', 'ปรับปรุง UI หน้าโพสต์ Scrum', NULL, 'ทดสอบ user experience', 'UI สวยงาม', 'ยังไม่มี feedback', 'ปรับ layout', NULL, 1),
(11, 'weekly', 'รีวิวการทำงาน API', 'บาง endpoint error', 'แก้ไข bug', 'API ใช้งานได้', 'Error บาง endpoint', 'เพิ่ม unit test', NULL, 2),
(12, 'daily', 'ปรับปรุงระบบ session', 'Timeout บ่อย', 'แก้ไข expiration', 'Session ทำงานปกติ', 'บาง session expire เร็วเกินไป', 'ปรับ config', NULL, 1),
(13, 'weekly', 'สรุป sprint ล่าสุด', 'บาง task ล่าช้า', 'ปรับ timeline', 'Team ทำงานร่วมกันดี', 'บางงานไม่เสร็จตามเวลา', 'ปรับ estimate', NULL, 3),
(14, 'daily', 'พัฒนาฟังก์ชันส่งแจ้งเตือน', 'บาง user ไม่ได้รับ notify', 'ปรับ queue', 'Notification ส่งครบ', 'บาง user ล่าช้า', 'เพิ่ม retry', NULL, 4),
(15, 'daily', 'ทดสอบระบบ Cron Job', 'Job delay', 'ปรับ schedule', 'Job ทำงานตรงเวลา', 'บาง Job skip', 'เพิ่ม logging', NULL, 4),
(16, 'weekly', 'รีวิว logic คะแนนแจ้งเตือน', 'บาง user ได้คะแนนผิด', 'แก้ logic', 'Leaderboard แสดงถูกต้อง', 'คะแนนผิดบาง user', 'ปรับ formula', NULL, 5),
(17, 'daily', 'เพิ่มระบบ push notification', 'Device ไม่รับ message', 'ทดสอบ device ครบ', 'Push notification ทำงาน', 'บาง device ไม่รับ', 'ปรับ token', NULL, 5),
(18, 'weekly', 'สรุป sprint Notification', 'มี bug เล็กน้อย', 'ปรับ workflow', 'Team รู้ปัญหาเร็ว', 'Bug ยังอยู่บางส่วน', 'เพิ่ม unit test', NULL, 4),
(19, 'daily', 'ปรับปรุงระบบให้คะแนน Scrum', 'คะแนนผิดบาง user', 'แก้ formula', 'Leaderboard ถูกต้อง', 'User งงกับคะแนน', 'เพิ่ม logging', NULL, 6),
(20, 'daily', 'ทดสอบ edge case การโพสต์', NULL, 'เพิ่ม unit test', 'คะแนนคำนวณถูกต้อง', 'ยังไม่มี test ครบทุก case', 'เขียน test ครบ', NULL, 6),
(21, 'weekly', 'รีวิวระบบคะแนนย้อนหลัง', 'บางวันไม่เก็บคะแนน', 'แก้ logic', 'คะแนนย้อนหลังครบ', 'ข้อมูลบางวันหาย', 'ปรับ cron job', NULL, 6),
(22, 'daily', 'เพิ่มระบบแจ้งเตือนคะแนน', 'บาง notification ไม่ส่ง', 'ทดสอบครบทุก user', 'Notification ส่งครบ', 'บาง user ไม่รับ', 'ปรับ queue', NULL, 6),
(23, 'weekly', 'สรุป sprint Scoring', 'บาง logic ซ้ำซ้อน', 'ปรับ code', 'ระบบทำงานรวดเร็ว', 'Code ซ้ำซ้อน', 'Refactor code', NULL, 6),
(24, 'daily', 'ปรับปรุงหน้า Dashboard', 'Chart โหลดช้า', 'ปรับ query และ cache', 'Chart แสดงครบ', 'Performance ยังไม่ดี', 'ใช้ cache', NULL, 4),
(25, 'daily', 'เพิ่มฟิลเตอร์ตาม project', NULL, 'ทดสอบ filter ครบทุกกรณี', 'Filter ใช้งานได้', 'บาง case ยังไม่ถูกต้อง', 'เพิ่ม unit test', NULL, 4),
(26, 'weekly', 'รีวิว dashboard Analytics', 'ข้อมูลไม่ครบ', 'แก้ query', 'Dashboard ครบถ้วน', 'บาง chart ยังไม่อัพเดท', 'ปรับ refresh rate', NULL, 4),
(27, 'daily', 'เพิ่ม export CSV', 'Export ช้า', 'ปรับ batch', 'Export สำเร็จ', 'Export ยังช้า', 'ปรับ query', NULL, 4),
(28, 'weekly', 'สรุป sprint Analytics', 'บาง KPI ไม่ตรง', 'ปรับ logic KPI', 'Dashboard ใช้งานดี', 'บาง KPI ผิด', 'แก้ calculation', NULL, 4);

UPDATE posts SET created_at = '2025-08-04 09:00:00' WHERE id = 9;
UPDATE posts SET created_at = '2025-08-04 09:30:00' WHERE id = 10;
UPDATE posts SET created_at = '2025-08-04 10:00:00' WHERE id = 11;
UPDATE posts SET created_at = '2025-08-04 10:30:00' WHERE id = 12;
UPDATE posts SET created_at = '2025-08-04 11:00:00' WHERE id = 13;
UPDATE posts SET created_at = '2025-08-05 09:00:00' WHERE id = 14;
UPDATE posts SET created_at = '2025-08-05 09:30:00' WHERE id = 15;
UPDATE posts SET created_at = '2025-08-05 10:00:00' WHERE id = 16;
UPDATE posts SET created_at = '2025-08-05 10:30:00' WHERE id = 17;
UPDATE posts SET created_at = '2025-08-05 11:00:00' WHERE id = 18;
UPDATE posts SET created_at = '2025-08-06 09:00:00' WHERE id = 19;
UPDATE posts SET created_at = '2025-08-06 09:30:00' WHERE id = 20;
UPDATE posts SET created_at = '2025-08-06 10:00:00' WHERE id = 21;
UPDATE posts SET created_at = '2025-08-06 10:30:00' WHERE id = 22;
UPDATE posts SET created_at = '2025-08-06 11:00:00' WHERE id = 23;
UPDATE posts SET created_at = '2025-08-07 09:00:00' WHERE id = 24;
UPDATE posts SET created_at = '2025-08-07 09:30:00' WHERE id = 25;
UPDATE posts SET created_at = '2025-08-07 10:00:00' WHERE id = 26;
UPDATE posts SET created_at = '2025-08-07 10:30:00' WHERE id = 27;
UPDATE posts SET created_at = '2025-08-07 11:00:00' WHERE id = 28;

-- 5. Comments
INSERT INTO comments (id, post_id, user_id, comment)
VALUES 
(1, 1, 2, 'อย่าลืมใส่ validation ก่อน submit ฟอร์ม'),
(2, 2, 1, 'ลองใช้ transaction ให้แน่ใจว่า insert สำเร็จ'),
(3, 3, 3, 'ควรมี retry mechanism เผื่อส่งแจ้งเตือนล้มเหลว'),
(4, 4, 2, 'อาจใช้ Redis cache มาช่วยคำนวณคะแนน');

-- 6. Notifications
INSERT INTO notifications (id, user_id, type, post_id, comment_id, project_id, message, status)
VALUES 
(1, 1, 'reminder', NULL, NULL, 1, 'อย่าลืมโพสต์ Scrum วันนี้ก่อน 9 โมงเช้า!', 'unread'),
(2, 2, 'new_comment', 1, 1, 1, 'Bob คอมเมนต์บนโพสต์ Scrum ของคุณ', 'unread'),
(3, 3, 'late_notice', 2, NULL, 1, 'คุณลืมโพสต์ Scrum ของวันนี้', 'unread'),
(4, 4, 'new_comment', 4, 4, 3, 'Alice คอมเมนต์บนโพสต์ Scrum ของคุณ', 'read'),
(5, 5, 'reminder', NULL, NULL, 2, 'ได้เวลาโพสต์ Scrum แล้ว อย่าลืม!', 'unread');

COMMIT;