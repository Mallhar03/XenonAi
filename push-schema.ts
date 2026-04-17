import { execSync } from 'child_process';
execSync('npx drizzle-kit push', { stdio: 'inherit' });