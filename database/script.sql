-- 1. Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  profile_pic TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('done', 'in_progress') DEFAULT 'in_progress',
  deadline_date DATE,
  scrum_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. User-Project (Join table)
CREATE TABLE user_project (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  project_id INT,
  position VARCHAR(100),
  scrum_point INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 4. Daily Scrum
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('daily', 'weekly') NOT NULL,
  today_task TEXT,
  problem TEXT,
  tomorrow_task TEXT,
  good TEXT,
  bad TEXT,
  try TEXT,
  next_sprint TEXT,
  user_project_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_project_id) REFERENCES user_project(id) ON DELETE CASCADE
);

-- 5. Comments
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT,
  user_id INT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. File Upload
CREATE TABLE files_upload (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  mime_type VARCHAR(100),
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 7. Notifications
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  type ENUM('reminder', 'late_notice', 'new_comment') NOT NULL,
  post_id INT,
  comment_id INT,
  project_id INT,
  message TEXT NOT NULL,
  status ENUM('unread', 'read') DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);