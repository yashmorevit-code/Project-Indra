import fs from 'fs';
import path from 'path';
import handler from '../api/energy-analytics.js';

// Manually load .env variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const firstEq = trimmed.indexOf('=');
      if (firstEq > -1) {
        process.env[trimmed.substring(0, firstEq).trim()] = trimmed.substring(firstEq + 1).trim();
      }
    }
  });
}

const mockReq = { method: 'GET' };

const mockRes = {
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    console.log(`\nResponse Code: ${this.statusCode || 200}`);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  }
};

console.log("Executing energy-analytics handler...");
handler(mockReq, mockRes);
