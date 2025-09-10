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
(1, 'Daily Scrum WebApp', 'ระบบสำหรับบันทึกและจัดการการประชุม Daily Scrum', 'in_progress', '2025-09-30', '18:00:00'),
(2, 'Notification Service', 'ระบบแจ้งเตือนโพสต์ Scrum และคอมเมนต์', 'in_progress', '2025-09-15', '18:00:00'),
(3, 'Scoring Module', 'ระบบให้คะแนนการโพสต์ Scrum ตรงเวลา', 'in_progress', '2025-09-20', '18:00:00'),
(4, 'Scrum Analytics Dashboard', 'แดชบอร์ดสำหรับติดตามและวิเคราะห์ข้อมูล Scrum', 'done', '2025-10-05', '18:00:00');

-- 3. User-Project
INSERT INTO user_project (id, user_id, project_id, position, scrum_point, is_pinned)
VALUES 
(1, 1, 1, 'Frontend Developer', 0, TRUE),
(2, 2, 1, 'Backend Developer', 0, FALSE),
(3, 3, 1, 'Project Manager', 0, TRUE),
(4, 4, 2, 'Backend Developer', 0, FALSE),
(5, 5, 2, 'QA Engineer', 0, FALSE),
(6, 6, 3, 'DevOps Engineer', 0, FALSE),
(7, 1, 4, 'Frontend Developer', 0, FALSE),
(8, 2, 4, 'Backend Developer', 0, FALSE),
(9, 3, 4, 'Project Manager', 0, TRUE);

-- 4. Posts
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
(28, 'weekly', 'สรุป sprint Analytics', 'บาง KPI ไม่ตรง', 'ปรับ logic KPI', 'Dashboard ใช้งานดี', 'บาง KPI ผิด', 'แก้ calculation', NULL, 4),
(29, 'daily', 'เพิ่มระบบ dark mode', 'บาง component theme ไม่เปลี่ยน', 'แก้ CSS variable', 'UI ใช้งานกลางคืนสบายตา', 'Theme ยังไม่ครอบคลุม', 'Refactor CSS', NULL, 2),
(30, 'daily', 'ปรับระบบ permission', 'Role ซ้อนทับ', 'ทดสอบสิทธิ์แต่ละ role', 'สิทธิ์ถูกต้องตามที่กำหนด', 'บาง role ยังเกินสิทธิ์', 'เพิ่ม test case', NULL, 2),
(31, 'weekly', 'รีวิว performance database', 'Query ช้า', 'เพิ่ม index', 'บาง query เร็วขึ้น', 'ยังมี table บางตัวช้า', 'Optimize query', NULL, 3),
(32, 'daily', 'ทดสอบระบบ email notify', 'บาง email ไม่ส่ง', 'ปรับ mail config', 'อีเมลส่งได้', 'บาง email ไป spam', 'เพิ่ม DKIM/SPF', NULL, 5),
(33, 'daily', 'เพิ่มระบบ multi-language', 'บางข้อความ hardcode', 'แก้เป็น i18n', 'ภาษาไทย/อังกฤษสลับได้', 'บางหน้าไม่ครบ', 'Refactor code', NULL, 5),
(34, 'weekly', 'สรุป sprint UX/UI', 'Feedback ผู้ใช้เยอะ', 'ปรับ layout', 'UI ใช้งานง่ายขึ้น', 'บาง feedback ยังไม่แก้', 'เก็บ feedback รอบใหม่', NULL, 6),
(35, 'daily', 'ปรับระบบ report PDF', 'Font ไม่รองรับไทย', 'เปลี่ยน font', 'Report อ่านได้ชัดเจน', 'บางรูปแบบเพี้ยน', 'ปรับ template', NULL, 6),
(36, 'daily', 'เพิ่มระบบ export Excel', 'Cell format ผิด', 'แก้ schema', 'Export ถูกต้อง', 'Format ยังไม่สวย', 'เพิ่ม style', NULL, 4),
(37, 'weekly', 'รีวิวระบบ CI/CD', 'บาง stage ล้มเหลว', 'แก้ pipeline', 'Deploy เร็วขึ้น', 'ยังมี error บาง job', 'เพิ่ม logging', NULL, 3),
(38, 'daily', 'ปรับระบบ JWT refresh token', 'Token หมดอายุเร็ว', 'เพิ่ม refresh flow', 'Login ต่อเนื่องได้', 'บางครั้ง token ไม่อัพเดท', 'แก้ logic', NULL, 2),
(39, 'daily', 'ทดสอบระบบ file upload', 'บางไฟล์ไม่รองรับ', 'เพิ่ม validation', 'อัพโหลดไฟล์ได้', 'ไฟล์ใหญ่ยังช้า', 'เพิ่ม compress', NULL, 2),
(40, 'weekly', 'รีวิวระบบ security', 'พบ SQL Injection', 'แก้ query', 'ระบบปลอดภัยขึ้น', 'ยังไม่มี pentest', 'วางแผน pentest', NULL, 5),
(41, 'daily', 'ปรับปรุงหน้า Kanban', 'Drag&Drop ไม่เสถียร', 'แก้ logic', 'ใช้งานได้ลื่น', 'ยังมี lag', 'Optimize DOM', NULL, 5),
(42, 'daily', 'เพิ่มระบบ activity log', 'Log ไม่ครบ', 'แก้ middleware', 'Log บันทึกครบ', 'บาง event ไม่บันทึก', 'เพิ่ม hook', NULL, 4),
(43, 'weekly', 'สรุป sprint Analytics', 'KPI ไม่ครบ', 'เพิ่ม calculation', 'Dashboard ใช้งานได้', 'บาง KPI ขาด', 'เพิ่ม test', NULL, 6),
(44, 'daily', 'ทดสอบระบบ backup', 'Restore ไม่สำเร็จ', 'แก้ script', 'Backup/Restore ทำงาน', 'ยังไม่ auto', 'เพิ่ม cron', NULL, 6),
(45, 'daily', 'เพิ่มระบบ notification bell', 'UI ไม่อัพเดท', 'แก้ realtime', 'Bell แจ้งเตือนทันที', 'บาง event หาย', 'แก้ socket', NULL, 6),
(46, 'weekly', 'รีวิว sprint Scoring', 'Formula ยังไม่ครบ', 'แก้ logic', 'คะแนนถูกต้อง', 'User บางคนงง', 'ปรับ UI', NULL, 6),
(47, 'daily', 'เพิ่มระบบ search advance', 'Filter ไม่ทำงาน', 'แก้ query', 'Search ทำงานครบ', 'ยังช้า', 'เพิ่ม index', NULL, 4),
(48, 'daily', 'ปรับระบบ comment thread', 'Nested reply ไม่ทำงาน', 'แก้ DB relation', 'Comment ซ้อนกันได้', 'UI ยังซับซ้อน', 'ปรับ UX', NULL, 4),
(49, 'weekly', 'สรุป sprint UX', 'Feedback ผู้ใช้ยังเยอะ', 'แก้ UX flow', 'UI เข้าใจง่ายขึ้น', 'ยังไม่สมบูรณ์', 'ทำ user test', NULL, 3),
(50, 'daily', 'เพิ่มระบบ profile picture', 'Upload ช้า', 'ปรับ compress', 'รูปแสดงถูกต้อง', 'บางไฟล์ไม่รองรับ', 'เพิ่ม validation', NULL, 2);

UPDATE posts SET created_at = '2025-08-01 18:00:00' WHERE id = 1;
UPDATE posts SET created_at = '2025-08-01 18:05:00' WHERE id = 2;
UPDATE posts SET created_at = '2025-08-01 18:10:00' WHERE id = 3;
UPDATE posts SET created_at = '2025-08-01 18:15:00' WHERE id = 4;
UPDATE posts SET created_at = '2025-08-01 19:10:00' WHERE id = 5; 

UPDATE posts SET created_at = '2025-08-04 18:00:00' WHERE id = 6;
UPDATE posts SET created_at = '2025-08-04 18:07:00' WHERE id = 7;
UPDATE posts SET created_at = '2025-08-04 18:15:00' WHERE id = 8;
UPDATE posts SET created_at = '2025-08-04 18:20:00' WHERE id = 9;
UPDATE posts SET created_at = '2025-08-04 19:05:00' WHERE id = 10; 
UPDATE posts SET created_at = '2025-08-04 19:20:00' WHERE id = 11; 
UPDATE posts SET created_at = '2025-08-04 18:40:00' WHERE id = 12;
UPDATE posts SET created_at = '2025-08-04 18:55:00' WHERE id = 13;

UPDATE posts SET created_at = '2025-08-05 18:00:00' WHERE id = 14;
UPDATE posts SET created_at = '2025-08-05 18:10:00' WHERE id = 15;
UPDATE posts SET created_at = '2025-08-05 18:15:00' WHERE id = 16;
UPDATE posts SET created_at = '2025-08-05 19:00:00' WHERE id = 17; 
UPDATE posts SET created_at = '2025-08-05 19:25:00' WHERE id = 18; 

UPDATE posts SET created_at = '2025-08-06 18:00:00' WHERE id = 19;
UPDATE posts SET created_at = '2025-08-06 18:05:00' WHERE id = 20;
UPDATE posts SET created_at = '2025-08-06 18:20:00' WHERE id = 21;
UPDATE posts SET created_at = '2025-08-06 18:30:00' WHERE id = 22;
UPDATE posts SET created_at = '2025-08-06 19:15:00' WHERE id = 23; 

UPDATE posts SET created_at = '2025-08-07 18:00:00' WHERE id = 24;
UPDATE posts SET created_at = '2025-08-07 18:05:00' WHERE id = 25;
UPDATE posts SET created_at = '2025-08-07 18:15:00' WHERE id = 26;
UPDATE posts SET created_at = '2025-08-07 18:25:00' WHERE id = 27;
UPDATE posts SET created_at = '2025-08-07 19:00:00' WHERE id = 28; 

UPDATE posts SET created_at = '2025-08-08 18:00:00' WHERE id = 29;
UPDATE posts SET created_at = '2025-08-08 18:05:00' WHERE id = 30;
UPDATE posts SET created_at = '2025-08-08 18:12:00' WHERE id = 31;
UPDATE posts SET created_at = '2025-08-08 19:05:00' WHERE id = 32; 
UPDATE posts SET created_at = '2025-08-08 18:40:00' WHERE id = 33;

UPDATE posts SET created_at = '2025-08-11 18:00:00' WHERE id = 34;
UPDATE posts SET created_at = '2025-08-11 18:10:00' WHERE id = 35;
UPDATE posts SET created_at = '2025-08-11 18:20:00' WHERE id = 36;
UPDATE posts SET created_at = '2025-08-11 18:30:00' WHERE id = 37;
UPDATE posts SET created_at = '2025-08-11 19:20:00' WHERE id = 38; 

UPDATE posts SET created_at = '2025-08-12 18:00:00' WHERE id = 39;
UPDATE posts SET created_at = '2025-08-12 18:08:00' WHERE id = 40;
UPDATE posts SET created_at = '2025-08-12 18:15:00' WHERE id = 41;
UPDATE posts SET created_at = '2025-08-12 18:25:00' WHERE id = 42;
UPDATE posts SET created_at = '2025-08-12 19:10:00' WHERE id = 43; 

UPDATE posts SET created_at = '2025-08-13 18:00:00' WHERE id = 44;
UPDATE posts SET created_at = '2025-08-13 18:05:00' WHERE id = 45;
UPDATE posts SET created_at = '2025-08-13 18:15:00' WHERE id = 46;
UPDATE posts SET created_at = '2025-08-13 19:00:00' WHERE id = 47; 
UPDATE posts SET created_at = '2025-08-13 18:40:00' WHERE id = 48;

UPDATE posts SET created_at = '2025-08-14 18:00:00' WHERE id = 49;
UPDATE posts SET created_at = '2025-08-14 19:05:00' WHERE id = 50; 

UPDATE user_project up
JOIN posts p ON up.id = p.user_project_id
SET up.scrum_point = CASE
    WHEN TIME(p.created_at) > '19:00:00' THEN 0.5 
    WHEN TIME(p.created_at) < '07:00:00' THEN 1    
    ELSE 1                                         
END;

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