import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "OpenBook <onboarding@resend.dev>";

/** Whether outbound email is configured. Without RESEND_API_KEY, the send
 *  functions only log the link to the server console. */
export const emailEnabled = resend !== null;

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify?token=${token}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Welcome to OpenBook, ${name}!</h2>
      <p>Please verify your email address to activate your account.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}"
           style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
          Verify Email
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Or copy this link: ${verifyUrl}
      </p>
      <p style="color: #666; font-size: 14px;">This link does not expire.</p>
    </div>
  `;

  if (!resend) {
    console.log(`[dev] Verification email for ${to}: ${verifyUrl}`);
    return;
  }

  await resend.emails.send({ from: FROM, to, subject: "Verify your OpenBook account", html });
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  townName: string,
  password: string
) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/staff/login`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Welcome to OpenBook, ${name}!</h2>
      <p>An administrator for ${townName} has created a staff account for you.</p>
      <p>Here are your login credentials:</p>
      <p><strong>Email:</strong> ${to}<br><strong>Temporary password:</strong> ${password}</p>
      <p style="margin: 24px 0;">
        <a href="${loginUrl}"
           style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
          Log In
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Or go to: ${loginUrl}
      </p>
    </div>
  `;

  if (!resend) {
    console.log(`[dev] Welcome email for ${to}: ${loginUrl}`);
    return;
  }

  await resend.emails.send({ from: FROM, to, subject: `Your OpenBook account for ${townName}`, html });
}
