import { Injectable } from '@nestjs/common';
import nodemailer, {
  Transporter,
  SentMessageInfo,
  TestAccount,
} from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter<SentMessageInfo> | null = null;

  private async createTransporter(): Promise<Transporter<SentMessageInfo>> {
    if (this.transporter) {
      return this.transporter;
    }

    const testAccount: TestAccount = await nodemailer.createTestAccount();

    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }) as Transporter<SentMessageInfo>;

    return this.transporter;
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const transporter = await this.createTransporter();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const info = await transporter.sendMail({
      from: '"Auth App" <no-reply@test.com>',
      to,
      subject,
      html,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log('📧 Email preview:', previewUrl);
  }
}
