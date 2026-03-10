export function resetPasswordTemplate(resetLink: string): string {
  return `
  <div style="font-family: Arial; max-width:600px; margin:auto">
    <h2>Password Reset</h2>

    <p>You requested to reset your password.</p>

    <p>Click the button below:</p>

    <a href="${resetLink}"
      style="
        display:inline-block;
        padding:12px 20px;
        background:#4CAF50;
        color:white;
        text-decoration:none;
        border-radius:5px;
      ">
      Reset Password
    </a>

    <p style="margin-top:20px">
      If you didn't request this, ignore this email.
    </p>
  </div>
  `;
}
