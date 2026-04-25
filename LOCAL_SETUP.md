# Running Nexus AI Assistant Locally

This guide will help you set up and run Nexus on your local machine.

## Prerequisites

- **Node.js** 18+ (https://nodejs.org/)
- **pnpm** (install via `npm install -g pnpm`)
- **MySQL** 8.0+ or compatible database (TiDB, MariaDB)

## Step 1: Clone the Project

```bash
git clone <your-repo-url> ai-assistant-ui
cd ai-assistant-ui
```

## Step 2: Install Dependencies

```bash
pnpm install
```

## Step 3: Set Up Database

### Option A: Using Local MySQL

1. **Start MySQL** (if not already running):
   ```bash
   # macOS with Homebrew
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   
   # Windows (if installed)
   # Start MySQL from Services or use: mysql.server start
   ```

2. **Create a database**:
   ```bash
   mysql -u root -p
   ```
   Then in MySQL shell:
   ```sql
   CREATE DATABASE nexus_ai;
   CREATE USER 'nexus'@'localhost' IDENTIFIED BY 'nexus_password';
   GRANT ALL PRIVILEGES ON nexus_ai.* TO 'nexus'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Create `.env.local` file** in the project root:
   ```env
   DATABASE_URL="mysql://nexus:nexus_password@localhost:3306/nexus_ai"
   JWT_SECRET="your-secret-key-here-min-32-chars"
   VITE_APP_ID="local-dev"
   VITE_OAUTH_PORTAL_URL="http://localhost:3000"
   OAUTH_SERVER_URL="http://localhost:3000"
   ```

### Option B: Using Docker

```bash
docker run --name nexus-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=nexus_ai -p 3306:3306 -d mysql:8.0

# Then create the user:
docker exec -it nexus-mysql mysql -u root -proot -e "CREATE USER 'nexus'@'%' IDENTIFIED BY 'nexus_password'; GRANT ALL PRIVILEGES ON nexus_ai.* TO 'nexus'@'%'; FLUSH PRIVILEGES;"

# Update .env.local:
DATABASE_URL="mysql://nexus:nexus_password@localhost:3306/nexus_ai"
```

## Step 4: Initialize Database Schema

```bash
pnpm db:push
```

This will create all necessary tables (conversations, messages, tasks, learning logs, etc.).

## Step 5: Start Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

## Step 6: Access Nexus

Open your browser and go to:
```
http://localhost:3000
```

You'll see the Nexus login page. For local development, you can:
- Use the OAuth login (if configured)
- Or modify the auth to skip login for development

## Troubleshooting

### "Failed to fetch" Error

**Cause**: Database connection failed or tRPC endpoint not responding

**Solution**:
1. Check if MySQL is running: `mysql -u nexus -p -h localhost`
2. Verify DATABASE_URL in `.env.local`
3. Check server logs: `tail -f .manus-logs/devserver.log`

### "Database not available" Error

**Cause**: DATABASE_URL not set or database unreachable

**Solution**:
1. Ensure `.env.local` has `DATABASE_URL` set
2. Test connection: `mysql -u nexus -p -h localhost nexus_ai`
3. Restart dev server: `pnpm dev`

### Port 3000 Already in Use

**Solution**:
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### Module Not Found Errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm db:push
pnpm dev
```

## Development Commands

```bash
# Run tests
pnpm test

# Type check
pnpm check

# Format code
pnpm format

# Build for production
pnpm build

# Start production server
pnpm start
```

## Features

### Chat with Nexus
- Type messages to chat with the AI assistant
- Nexus responds with helpful information and code

### Terminal Access
- Click "Terminal" button to access the sandbox shell
- Run any command: `ls`, `npm install`, `git clone`, etc.
- Execute code and see results in real-time

### Code Analysis
- Analyze code for improvements
- Get suggestions for optimization
- Track learning history

## Architecture

```
ai-assistant-ui/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── lib/           # Utilities
│   └── index.html
├── server/                # Express backend
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # Database queries
│   └── _core/             # Core server logic
├── drizzle/               # Database schema
│   └── schema.ts
└── shared/                # Shared types
```

## Next Steps

1. **Customize Nexus**: Edit `client/src/pages/NexusSimple.tsx`
2. **Add Features**: Create new tRPC procedures in `server/routers.ts`
3. **Database**: Add new tables in `drizzle/schema.ts` and run `pnpm db:push`
4. **Deploy**: Use `pnpm build && pnpm start` for production

## Support

For issues or questions, check:
- `.manus-logs/devserver.log` - Server logs
- `.manus-logs/browserConsole.log` - Client errors
- TypeScript errors: `pnpm check`

Happy coding! 🚀
