import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import {
  DEFAULT_MAIL_FROM,
  DEFAULT_SMTP_PORT,
  ENV,
} from 'src/config/env.constants';
import { envFlag, isDevelopment } from 'src/config/env.util';

/**
 * Sends mail through the SMTP server configured in the environment. In local
 * development, when no SMTP is configured, an Ethereal test inbox is used and
 * the preview URL is logged; outside development the request fails instead
 * of silently routing mail to a third-party test inbox.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter<SentMessageInfo> | null = null;
  private usingTestAccount = false;

  constructor(private readonly config: ConfigService) {}

  private get from(): string {
    return this.config.get<string>(ENV.mailFrom) ?? DEFAULT_MAIL_FROM;
  }

  private async createTransporter(): Promise<Transporter<SentMessageInfo>> {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.config.get<string>(ENV.smtpHost);
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get(ENV.smtpPort)) || DEFAULT_SMTP_PORT,
        secure: envFlag(this.config, ENV.smtpSecure),
        auth: {
          user: this.config.get<string>(ENV.smtpUser),
          pass: this.config.get<string>(ENV.smtpPass),
        },
      });
      return this.transporter;
    }

    if (!isDevelopment(this.config)) {
      throw new ServiceUnavailableException('Mail service is not configured');
    }

    const testAccount = await nodemailer.createTestAccount();
    this.usingTestAccount = true;
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    return this.transporter;
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const transporter = await this.createTransporter();

    const info = await transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
    });

    if (this.usingTestAccount) {
      this.logger.log(`Email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }
}
