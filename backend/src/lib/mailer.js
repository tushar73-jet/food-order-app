export const sendResetEmail = async (email, resetToken) => {
  // In a real application, use Nodemailer, SendGrid, Resend, etc.
  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
  console.log(`[MAILER MOCK] Sending password reset email to ${email}`);
  console.log(`[MAILER MOCK] Reset Link: ${resetUrl}`);
  // return await resend.emails.send({...})
};
