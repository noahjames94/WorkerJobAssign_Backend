import { Mailer } from "@mails";
import { injectable } from "inversify";
import Email from "email-templates";

@injectable()
export class MailerImpl implements Mailer {
	nodeMailer = require("nodemailer");

	async send(to: string, locals: any, template: string): Promise<any> {
		const transporter = this.nodeMailer.createTransport({
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			secure: false, // true for 465, false for other ports
			auth: {
				user: process.env.MAIL_USERNAME, // generated ethereal user
				pass: process.env.MAIL_PASSWORD // generated ethereal password
			}
		});

		const email = new Email({
			message: {
				from: process.env.MAIL_NO_REPLY
			},
			send: true,
			preview: process.env.NODE_ENV === "dev",
			transport: transporter,
			views: { root: __dirname }
		});

		await email.send({
			template: `./templates/${template}`,
			message: {
				from: "ConEd <support@cesolutions.io>",
				to
			},
			locals
		});
		return true;
	}
}
