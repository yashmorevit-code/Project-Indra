import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { poleId, status, timestamp } = req.body;

  if (!poleId || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
    },
  });

  const mailOptions = {
    from: `"Project Indra Alerts" <${process.env.SMTP_USER}>`,
    to: process.env.ALERT_TO_EMAIL,
    subject: `🚨 ALERT: Streetlight ${poleId} is DOWN`,
    text: `Streetlight Pole ID: ${poleId}\nStatus: ${status}\nDetected On: ${timestamp || new Date().toISOString()}\n\nPlease inspect the issue immediately.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; max-width: 600px;">
        <h2 style="color: #d9534f; margin-top: 0;">🚨 Streetlight Fault Alert</h2>
        <p>A new fault has been detected in the streetlight monitoring system.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f1f1; font-weight: bold; width: 150px;">Pole ID</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f1f1; color: #d9534f; font-weight: bold;">${poleId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f1f1; font-weight: bold;">Status</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f1f1; color: #d9534f; font-weight: bold;">${status}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f1f1; font-weight: bold;">Detected At</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f1f1;">${timestamp || new Date().toLocaleString()}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">This is an automated notification from Project Indra.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
