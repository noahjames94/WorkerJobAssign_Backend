const FCM = require("fcm-node");

class FcmService {
	private _fcm: any;

	constructor() {
		const serverKey = process.env.FCM_SERVER_KEY;
		this._fcm = new FCM(serverKey);
	}

	get fcm(): any {
		return this._fcm;
	}

	sendMessage(message: FcmMessage) {
		this.fcm.send(message, (err: any, response: any) => {
			if (err) {
				console.log("Something has gone wrong!");
			} else {
				console.log("Successfully sent with response: ", response);
			}
		});
	}
}

export class FcmMessage {
	to: string;
	collapse_key: "green";

	notification?: {
		title: string,
		body: string
	};

	data?: {
		my_key: string,
		my_another_key: string
	};
}

export default FcmService;
