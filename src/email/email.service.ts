import { BadRequestException, Injectable } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface MagicLinkEmailContext {
  heading: string;
  body: string;
  magicLink: string;
  ctaLabel: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  private renderTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): string {
    let templatePath = path.join(
      __dirname,
      'templates',
      `${templateName}.hbs`,
    );
    
    // If not found in __dirname/templates (e.g. dist/src/email/templates), 
    // try dist/email/templates which is where nest-cli copies assets
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(
        __dirname,
        '..',
        '..',
        'email',
        'templates',
        `${templateName}.hbs`,
      );
    }
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(source);
    return template({ 
      ...context, 
      year: new Date().getFullYear(),
      frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL
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

  async sendMagicLinkEmail(
    to: string,
    subject: string,
    context: MagicLinkEmailContext,
  ) {
    try {
      const html = this.renderTemplate('magic-link', { ...context, subject });
      let logoPath = path.join(__dirname, 'templates', 'logo.png');
      if (!fs.existsSync(logoPath)) {
        logoPath = path.join(__dirname, '..', '..', 'email', 'templates', 'logo.png');
      }
      await this.transporter.sendMail({
        to,
        subject,
        text: `${context.heading}\n\n${context.body}\n\nFollow this link to continue: ${context.magicLink}`,
        html,
        attachments: [
          {
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo',
          },
        ],
      });
      return { status: 'success' };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to send email');
    }
  }
}
