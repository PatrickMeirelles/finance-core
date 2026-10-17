export interface ResetPasswordTemplateInput {
  /** Code the user types (or that the link carries) in the app. */
  token: string;
  /** Optional web link; omitted when PASSWORD_RESET_URL is not configured. */
  resetLink?: string;
  expiresInMinutes: number;
}

export function resetPasswordTemplate({
  token,
  resetLink,
  expiresInMinutes,
}: ResetPasswordTemplateInput): string {
  const linkBlock = resetLink
    ? `
    <p>Click the button below:</p>
    <a href="${resetLink}"
      style="
        display:inline-block;
        padding:12px 20px;
        background:#38E07A;
        color:#121714;
        text-decoration:none;
        border-radius:8px;
        font-weight:bold;
      ">
      Reset Password
    </a>
    <p style="margin-top:20px">Or paste this code in the app:</p>`
    : `
    <p>Paste this code in the app to choose a new password:</p>`;

  return `
  <div style="font-family: Arial; max-width:600px; margin:auto">
    <h2>Password Reset</h2>

    <p>You requested to reset your password.</p>
    ${linkBlock}
    <pre style="
        padding:12px;
        background:#f4f4f4;
        border-radius:8px;
        font-size:14px;
        word-break:break-all;
        white-space:pre-wrap;
      ">${token}</pre>

    <p>This code expires in ${expiresInMinutes} minutes.</p>

    <p style="margin-top:20px">
      If you didn't request this, ignore this email.
    </p>
  </div>
  `;
}
