import nodemailer, { Transporter } from 'nodemailer';

export class MailUtils {
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const testAccount = await nodemailer.createTestAccount();

    const transporter: Transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Auth App" <no-reply@test.com>',
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log('Preview URL:', previewUrl);
  }
}
