import { BadRequestException, Injectable } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'aaptuha@gmail.com',
        pass: 'ctxd bcsn szmy ajbx',
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string) {
    try {
      await this.transporter.sendMail({
        to,
        subject,
        text,
        html: `<i>${text}</i>`,
      });
      return { status: 'success' };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to send email');
    }
  }
}
