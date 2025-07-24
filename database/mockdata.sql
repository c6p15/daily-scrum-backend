-- Disable FK checks temporarily for clean insert
SET FOREIGN_KEY_CHECKS = 0;

-- Optional: Clean tables (if you want a reset)
TRUNCATE TABLE notifications;
TRUNCATE TABLE comments;
TRUNCATE TABLE daily_scrum;
TRUNCATE TABLE user_project;
TRUNCATE TABLE projects;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

-- 1. Users
INSERT INTO users (id, firstname, lastname, email, password, profile_pic)
VALUES 
(1, 'Alice', 'Johnson', 'alice@example.com', 'hashedpassword1', NULL),
(2, 'Bob', 'Smith', 'bob@example.com', 'hashedpassword2', NULL),
(3, 'Charlie', 'Brown', 'charlie@example.com', 'hashedpassword3', NULL),
(4, 'David', 'Lee', 'david@example.com', 'hashedpassword4', NULL),
(5, 'Eva', 'Green', 'eva@example.com', 'hashedpassword5', NULL),
(6, 'Frank', 'Wright', 'frank@example.com', 'hashedpassword6', NULL);

-- 2. Projects
INSERT INTO projects (id, title, description, status, deadline_date, scrum_time)
VALUES 
(1, 'Project Alpha', 'Alpha project description', 'in_progress', '2025-08-15', '09:00:00'),
(2, 'Project Beta', 'Beta project is almost done', 'done', '2025-07-10', '10:00:00'),
(3, 'Project Gamma', 'Gamma is a data processing tool.', 'in_progress', '2025-08-30', '14:00:00'),
(4, 'Project Delta', 'Delta handles reporting and dashboards.', 'done', '2025-07-20', '11:00:00'),
(5, 'Project Omega', 'Omega is a refactor of legacy systems.', 'in_progress', '2025-09-10', '15:30:00');

-- 3. User-Project
INSERT INTO user_project (id, user_id, project_id, position, scrum_point)
VALUES 
(1, 1, 1, 'Frontend Developer', 10),
(2, 2, 1, 'Backend Developer', 8),
(3, 3, 2, 'Project Manager', 15),
(4, 1, 2, 'QA Engineer', 5),
(5, 4, 3, 'Data Engineer', 12),
(6, 5, 3, 'UI Designer', 7),
(7, 6, 4, 'Fullstack Developer', 10),
(8, 2, 4, 'Tester', 5),
(9, 1, 5, 'System Architect', 13),
(10, 5, 5, 'DevOps Engineer', 6);

-- 4. Daily Scrum
INSERT INTO daily_scrum (id, type, today_task, problem, problem_level, tomorrow_task, good, bad, try, next_sprint, user_project_id)
VALUES 
(1, 'daily', 'Implement login', 'None', 'minor', 'Finish UI for profile', 'Team collaboration', 'Lack of test cases', 'Write more unit tests', NULL, 1),
(2, 'friday', 'Finish backend APIs', 'Slow queries', 'moderate', 'Optimize DB', 'Code coverage improved', 'Missed deadline', 'Refactor model layer', NULL, 2),
(3, 'retrospective', 'Reviewed sprint goals', 'Scope creep', 'critical', 'Better planning', 'Delivered MVP', 'Feature bloat', 'Limit scope next time', 'Add bug backlog', 3),
(4, 'daily', 'Fix ETL pipeline', 'Unexpected NULLs', 'moderate', 'Add validation checks', 'Good code quality', 'Slow response from API', 'Improve logging', NULL, 5),
(5, 'friday', 'Finish UI mockups', 'Unclear client requirements', 'critical', 'Clarify with PM', 'Clean design', 'Missed feedback loop', 'Setup figma reviews', 'Adjust timeline', 6),
(6, 'daily', 'Connect reporting tool to DB', 'Query failure', 'moderate', 'Fix joins in SQL', 'Tool integrated', 'No backup plan', 'Write fallback queries', NULL, 7),
(7, 'retrospective', 'Review system performance', 'Memory leaks', 'critical', 'Refactor cache layer', 'Improved error tracking', 'Downtime during demo', 'Add staging env', 'Replan load test', 8),
(8, 'daily', 'Fix deployment script', NULL, 'minor', 'Auto-deploy staging', 'Fast CI/CD', 'Manual build steps', 'Add shell validation', NULL, 9);

-- 5. Comments
INSERT INTO comments (id, daily_scrum_id, user_id, comment)
VALUES 
(1, 1, 2, 'Great progress on login feature!'),
(2, 2, 1, 'Consider indexing the slow queries.'),
(3, 3, 3, 'Scope control will help with delivery.'),
(4, 4, 1, 'Consider checking null source fields.'),
(5, 5, 3, 'Let me know if you need help with client calls.'),
(6, 6, 4, 'Check if SQL joins use proper indexes.'),
(7, 7, 2, 'Let’s allocate a day for load testing.'),
(8, 8, 5, 'CI/CD looks great. Just add rollback option.');

-- 6. Notifications
INSERT INTO notifications (id, user_id, type, daily_scrum_id, comment_id, message, status)
VALUES 
(1, 1, 'reminder', NULL, NULL, 'Don’t forget to submit your scrum today!', 'unread'),
(2, 2, 'new_comment', 1, 1, 'Bob commented on your scrum.', 'read'),
(3, 3, 'late_notice', 2, NULL, 'You missed today’s scrum update.', 'unread'),
(4, 4, 'new_comment', 4, 4, 'Alice commented on your scrum.', 'unread'),
(5, 5, 'reminder', NULL, NULL, 'Reminder: Please submit your scrum today.', 'unread'),
(6, 6, 'late_notice', 6, NULL, 'You missed today’s scrum.', 'unread'),
(7, 2, 'new_comment', 7, 7, 'A teammate commented on your scrum.', 'read'),
(8, 1, 'reminder', NULL, NULL, 'Post your scrum before 7 PM.', 'read');

COMMIT;