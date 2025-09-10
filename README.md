# daily-scrum-backend

## Environment Variables

### Server Configuration

 * `base_url` : URL where your frontend is hosted.

 * `frontend_url` : The hostname of your frontend application.

### Authentication

 * `JWT_SECRET` :  Secret key used for signing JWT tokens.

 * `JWT_EXPIRE` :  JWT expiration time (e.g., 1h, 7d).

### Database Configuration

 * `DB_NAME` : Name of your database.

 * `DB_USER` : Database username.

 * `DB_PASSWORD` : Database password.

 * `DB_HOST` : Database host (e.g., localhost).

 * `DB_PORT` : Database port (e.g., 3306).

### Redis Configuration

 * `REDIS_HOST` : Redis host (e.g., localhost).

 * `REDIS_PORT` : Redis port (default 6379).

 * `REDIS_PASSWORD` : Redis password, if any.

 * `REDIS_CLEAR_ON_START` : Boolean to clear Redis cache on app start (true or false).

#### Note: 
Redis is required for caching. You can run it using Docker Desktop:

```
docker run -d --name daily-scrum-redis -p 6379:6379 redis
```

Then make sure your backend connects using REDIS_HOST=localhost and REDIS_PORT=6379.
Test Redis connection:

```
docker exec -it daily-scrum-redis redis-cli ping
```
Expected response: **PONG**
 
### File Storage Configuration

 * `STORAGE_DRIVER` : Storage driver to use (local or s3). Defaults to local in development and s3 in production.

 * `STORAGE_PATH` : Path for storing files when using local storage. Defaults to ./uploads.

#### AWS S3 Configuration (required when STORAGE_DRIVER=s3)

 * `AWS_BUCKET` : S3 bucket name.

 * `AWS_REGION` : AWS region where the bucket is hosted (e.g., ap-southeast-1).

 * `AWS_ACCESS_KEY_ID` : AWS access key ID.

 * `AWS_SECRET_ACCESS_KEY` : AWS secret access key.

#### Google OAuth Configuration

 * `google_client_id` : Google OAuth client ID.

 * `google_client_secret` : Google OAuth client secret.

 * `google_callback_url` : URL for Google OAuth callback.

#### Google Email Sending Configuration

 * `google_sender_email` : Email address used to send emails via Google.

 * `google_sender_password` : Password or app-specific password for the sender email.


## Installation

1. Clone the repository
```
git clone https://github.com/c6p15/daily-scrum-backend.git
```

2. Install the dependencies
```
cd daily-scrum-backend

npm install
```

3. Run the application

For Development
```
npm run dev
```

For Production
```
npm start
```
