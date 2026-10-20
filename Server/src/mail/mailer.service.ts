import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

/**
 * Resend mailer for transactional email (account invites, temp passwords).
 *
 * Configure via env:
 *   RESEND_API_KEY — API key from https://resend.com
 *   MAIL_FROM      — sender identity (defaults to Resend's test sender)
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private resend: Resend | null = null;
  private initialized = false;

  private getClient(): Resend | null {
    if (this.initialized) return this.resend;
    this.initialized = true;

    const key = process.env.RESEND_API_KEY;
    this.resend = key ? new Resend(key) : null;

    if (!this.resend) {
      this.logger.warn('Resend not configured — set RESEND_API_KEY');
    }

    return this.resend;
  }

  /**
   * Sends a newly provisioned account's temporary password.
   * Returns false (without throwing) when Resend is not configured or send fails.
   */
  async sendTempPasswordEmail(opts: {
    to: string;
    name: string;
    password: string;
  }): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      this.logger.warn(
        `Resend not configured — could not send credentials to ${opts.to}`,
      );
      return false;
    }

    const loginUrl = `${process.env.CLIENT_URL ?? 'http://localhost:3000'}/login`;

    const { data, error } = await client.emails.send({
      from: process.env.MAIL_FROM ?? 'DoodleBlue <onboarding@resend.dev>',
      to: opts.to,
      subject: 'Your DoodleBlue account is ready',
      html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Welcome to DoodleBlue, ${opts.name}</h2>
        <p style="color:#555">An account has been created for you. Sign in with these credentials:</p>
        <div style="background:#f5f5f7;border:1px solid #e2e2e8;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Email:</strong> ${opts.to}</p>
          <p style="margin:0"><strong>Temporary password:</strong>
            <code style="background:#ececf1;padding:2px 8px;border-radius:6px;font-size:15px">${opts.password}</code>
          </p>
        </div>
        <a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:600">Log in to DoodleBlue</a>
        <p style="color:#555;font-size:13px;margin-top:16px">
          For security, you will be required to set a new password the first time you log in.
        </p>
      </div>
    `,
    });

    if (error) {
      this.logger.error(
        `Failed to send credentials to ${opts.to}: ${error.message}`,
      );
      return false;
    }

    this.logger.log(`Credentials sent to ${opts.to} (id: ${data.id})`);
    return true;
  }
  /**
   * Sends a donation certificate email.
   */
  async sendCertificateEmail(opts: {
    to: string;
    name: string;
    certificateUrl: string;
  }): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      this.logger.warn(`Resend not configured — could not send certificate to ${opts.to}`);
      return false;
    }
    const { data, error } = await client.emails.send({
      from: process.env.MAIL_FROM ?? 'DoodleBlue <no-reply@resend.dev>',
      to: opts.to,
      subject: 'Your Blood Donation Certificate',
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Congratulations ${opts.name}!</h2>
        <p style="color:#555">Thank you for your generous blood donation. Your certificate is attached below.</p>
        <a href="${opts.certificateUrl}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600">View Certificate</a>
      </div>`,
    });
    if (error) {
      this.logger.error(`Failed to send certificate to ${opts.to}: ${error.message}`);
      return false;
    }
    this.logger.log(`Certificate email sent to ${opts.to} (id: ${data.id})`);
    return true;
  }

  /**
   * Sends an appointment confirmation email.
   */
  async sendAppointmentConfirmation(opts: {
    to: string;
    name: string;
    appointmentDetails: {
      date: string;
      location?: string;
      requestId: string;
    };
  }): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      this.logger.warn(`Resend not configured — could not send appointment email to ${opts.to}`);
      return false;
    }
    const when = opts.appointmentDetails.date;
    const where = opts.appointmentDetails.location ? ` at ${opts.appointmentDetails.location}` : '';
    const { data, error } = await client.emails.send({
      from: process.env.MAIL_FROM ?? 'DoodleBlue <no-reply@resend.dev>',
      to: opts.to,
      subject: 'Your Donation Appointment is Confirmed',
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Hi ${opts.name},</h2>
        <p style="color:#555">Your appointment has been confirmed for ${when}${where}.</p>
        <p style="color:#555">You can view the request details <a href="${process.env.CLIENT_URL ?? 'http://localhost:3000'}/appointments/${opts.appointmentDetails.requestId}">here</a>.</p>
      </div>`,
    });
    if (error) {
      this.logger.error(`Failed to send appointment email to ${opts.to}: ${error.message}`);
      return false;
    }
    this.logger.log(`Appointment confirmation sent to ${opts.to} (id: ${data.id})`);
    return true;
  }

}
