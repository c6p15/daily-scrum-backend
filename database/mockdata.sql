INSERT INTO users (firstname, lastname, email, password, profile_pic)
VALUES
  ('Alice', 'Johnson', 'alice@example.com', 'hashed_pw1', NULL),
  ('Bob', 'Smith', 'bob@example.com', 'hashed_pw2', NULL),
  ('Charlie', 'Lee', 'charlie@example.com', 'hashed_pw3', NULL);

INSERT INTO projects (title, description, deadline_date, scrum_time)
VALUES
  ('Project Apollo', 'An internal productivity tool', '2025-12-31', '09:00:00'),
  ('Project Gemini', 'A user feedback analysis system', '2025-11-30', '10:00:00');

INSERT INTO user_project (user_id, project_id, position, scrum_point)
VALUES
  (1, 1, 'Project Manager', 5),
  (2, 1, 'Frontend Developer', 3),
  (3, 1, 'Backend Developer', 2),
  (2, 2, 'UX Designer', 4);

INSERT INTO daily_scrum (type, today_task, problem, problem_level, tomorrow_task, good, bad, try, next_sprint, user_project_id)
VALUES
  ('daily', 'Setup login system', 'OAuth callback issue', 'moderate', 'Fix callback flow', NULL, NULL, NULL, NULL, 2),
  ('friday', 'Refactored API routes', 'Slow tests', 'minor', 'Optimize middleware', NULL, NULL, NULL, NULL, 3),
  ('retrospective', NULL, NULL, NULL, NULL, 'We improved collaboration', 'Missed deadlines', 'Add stricter time blocks', 'Finish full CRUD', 1);

INSERT INTO comments (daily_scrum_id, user_id, comment)
VALUES
  (1, 1, 'Nice work on login! Please check error logs too.'),
  (2, 3, 'Refactoring looks clean now.'),
  (3, 2, 'Agree, we need stricter deadlines.');

INSERT INTO files_upload (daily_scrum_id, file_url, file_name, mime_type, file_size)
VALUES
  (1, '/uploads/login-doc.pdf', 'login-doc.pdf', 'application/pdf', 204800),
  (2, '/uploads/api-refactor.txt', 'api-refactor.txt', 'text/plain', 1024);

INSERT INTO notifications (user_id, type, daily_scrum_id, comment_id, message, status)
VALUES
  (2, 'reminder', 1, NULL, 'Don’t forget to submit today’s scrum!', 'unread'),
  (3, 'late_notice', 2, NULL, 'You missed today’s scrum deadline.', 'unread'),
  (2, 'new_comment', 1, 1, 'Alice commented on your scrum.', 'read');
