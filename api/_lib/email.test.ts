import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock nodemailer before importing the module under test
const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'test-id' });
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));

vi.mock('nodemailer', () => ({
  default: { createTransport: createTransportMock },
}));

// Import after mock is set up
const { sendWelcomeEmail } = await import('./email');

describe('sendWelcomeEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    sendMailMock.mockClear();
    createTransportMock.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('skips sending when SMTP_HOST is not configured', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    await sendWelcomeEmail('user@example.com', 'Alice');
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('sends an email when SMTP is configured', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'sender@example.com';
    process.env.SMTP_PASS = 'secret';

    await sendWelcomeEmail('user@example.com', 'Bob');

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.example.com' })
    );
    expect(sendMailMock).toHaveBeenCalledOnce();
    const mailOptions = sendMailMock.mock.calls[0][0] as Record<string, unknown>;
    expect(mailOptions.to).toBe('user@example.com');
    expect(mailOptions.subject).toContain('Bob');
    expect(mailOptions.html).toContain('Bob');
    expect(mailOptions.text).toContain('Bob');
  });

  it('includes the app name in the email subject', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'sender@example.com';
    process.env.VITE_APP_NAME = 'Star Cadet Academy';

    await sendWelcomeEmail('user@example.com', 'Carol');

    const mailOptions = sendMailMock.mock.calls[0][0] as Record<string, unknown>;
    expect(mailOptions.subject).toContain('Star Cadet Academy');
  });
});
