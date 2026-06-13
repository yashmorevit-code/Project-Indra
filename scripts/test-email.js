import fs from 'fs';
import path from 'path';
import handler from '../api/send-email.js';

// Manually load .env variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const firstEq = trimmed.indexOf('=');
      if (firstEq > -1) {
        const key = trimmed.substring(0, firstEq).trim();
        const value = trimmed.substring(firstEq + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

console.log("Loaded SMTP config from .env:");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("ALERT_TO_EMAIL:", process.env.ALERT_TO_EMAIL);

// Create a mock req and res
const mockReq = {
  method: 'POST',
  body: {
    poleId: 'P-TEST',
    status: 'Down (1)',
    timestamp: new Date().toLocaleString('en-IN')
  }
};

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

console.log("\nExecuting send-email handler...");
handler(mockReq, mockRes);
