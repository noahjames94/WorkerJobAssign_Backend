const nodemailer = require("nodemailer");

type Email = string;
type Emails = Email[];

interface ISendEmail {
	to: Emails;
	text?: string;
	html: string;
	subject?: string;
}
class Mailer {
	mailer: any;
	constructor() {
		this.init();
	}

	private async init() {
		this.mailer = nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			secure: false, // true for 465, false for other ports
			auth: {
				user: process.env.MAIL_USERNAME, // generated ethereal user
				pass: process.env.MAIL_PASSWORD // generated ethereal password
			}
		});
	}

	private transformConfiguration({
		to,
		text = "",
		html,
    subject = "",
	}: {
		to: Emails;
		text?: string;
		html: string;
		subject?: string;
	}) {
		return {
			to: to.join(", "),
			text: text,
			html,
			subject,
			from: '"Coned <support@conned.com>"'
		};
	}

	public async sendMail(props: ISendEmail) {
		try {
			const config = this.transformConfiguration(props);
			console.log({ config });
			await this.mailer.sendMail(config);
		} catch (error) {
			console.log({ error });
		}
	}
}

export const mailer = new Mailer();
