import nodemailer from 'nodemailer';

function createTransport() {
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.isFinite(port) ? port : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('Email not configured – skipping welcome email.');
    return;
  }

  const appName = process.env.APP_NAME || 'Star Cadet Academy';
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  const transporter = createTransport();

  await transporter.sendMail({
    from: `"${appName}" <${fromAddress}>`,
    to,
    subject: `Welcome to ${appName}, ${name}! 🚀`,
    text: `Hi ${name},\n\nWelcome to ${appName}! We're thrilled to have you on board.\n\nYour account is all set up and ready to go. Log in any time to start exploring our space-themed learning adventures with your little cadet.\n\nBlast off,\nThe ${appName} Team`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#0a0a2e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a2e;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a4e;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a4e,#2d2d8e);padding:40px 32px;text-align:center;">
              <div style="font-size:48px;">🚀</div>
              <h1 style="color:#00d4ff;margin:16px 0 8px;font-size:28px;">Welcome to ${appName}!</h1>
              <p style="color:#a0a8c0;margin:0;font-size:16px;">Your learning adventure starts now</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="color:#e0e8ff;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
              <p style="color:#e0e8ff;font-size:16px;line-height:1.6;margin:0 0 16px;">
                We're so excited to have you and your little cadet join ${appName}! 🌟
              </p>
              <p style="color:#e0e8ff;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Your account is all set up and ready to go. Log in any time to explore our space-themed
                learning adventures designed for children ages 3–5.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${process.env.FRONTEND_URL || '#'}"
                       style="background:linear-gradient(135deg,#00d4ff,#0066cc);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">
                      Start Learning 🚀
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#a0a8c0;font-size:14px;line-height:1.6;margin:0;">
                If you have any questions, just reply to this email – we're always happy to help!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f0f38;padding:20px 32px;text-align:center;">
              <p style="color:#606880;font-size:13px;margin:0;">
                Blast off,<br />
                <strong style="color:#a0a8c0;">The ${appName} Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
