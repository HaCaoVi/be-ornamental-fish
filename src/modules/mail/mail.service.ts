import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    constructor(
        private readonly mailerService: MailerService,
        private configService: ConfigService,
    ) { }

    async sendMailAuthentication(to: string, subject: string, code: string, callBack?: () => void) {
        try {
            await this.mailerService.sendMail({
                to: to,
                from: this.configService.get<string>("MAIL_USER"),
                subject: subject,
                template: 'auth.template.hbs',
                context: {
                    code: code,
                    year: new Date().getFullYear(),
                },
            })
            return;
        } catch (error) {
            this.logger.error("Send mail error: " + error.message, error.stack);
            callBack && callBack();
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Something went wrong!');
        }
    }
}