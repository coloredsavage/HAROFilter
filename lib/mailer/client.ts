import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Create and configure Nodemailer transporter with Gmail SMTP
 */
export function createMailer(): Transporter {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

/**
 * Send an email using the configured transporter
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML email body
 * @param text - Plain text email body (fallback)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    const transporter = createMailer();

    const info = await transporter.sendMail({
      from: `HAROFilter <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Simple HTML to text converter (removes HTML tags)
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verify SMTP connection
 */
export async function verifyMailer(): Promise<boolean> {
  try {
    const transporter = createMailer();
    await transporter.verify();
    console.log('SMTP connection verified');
    return true;
  } catch (error) {
    console.error('SMTP verification failed:', error);
    return false;
  }
}
