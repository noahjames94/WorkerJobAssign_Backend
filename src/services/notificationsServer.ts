import { ObjectID } from "typeorm";
import { Job, JobWorker } from "entities";

import { EROLES } from "../constants";
const socketioJwt = require("socketio-jwt");

class NotificationsServer {
	socket: any;
	users: Map<string, SocketUser>;

	constructor(socket: any) {
		this.socket = socket;
		this.users = new Map();
	}

	public start() {
		this.setupListeners();
	}

	private setupListeners = () => {
		this.socket.on("connection", socketioJwt.authorize({
			secret: `${process.env.JWT_SECRET}`,
			timeout: 3000
		})).on("authenticated", this.onSuccessAuth);

		this.socket.on("error", (error: any) => {
			if (error.type == "UnauthorizedError" || error.code == "invalid_token") {
				// redirect user to login page perhaps?
				console.log("User's token has expired");

			}
		});
	}

	private onSuccessAuth = (socket: any) => {

		const clientInfo = socket.decoded_token as any;

		let user: SocketUser;
		if (!this.users.has(clientInfo.id)) {
			user = new SocketUser();
			this.users.set(clientInfo.id, user);
		}
		user = this.users.get(clientInfo.id);
		user.firstName = clientInfo.firstName;
		user.lastName = clientInfo.lastName;
		user.roles = clientInfo.roles;
		user.sockets.add(socket);

		this.users.set(clientInfo.id.toString(), user);

		socket.emit("login", `Hello ${user.firstName} ${user.lastName}`);

		socket.on("disconnect", () => {
			if (this.users.has(clientInfo.id)) {
				this.users.delete(clientInfo.id);
			}
		});
	};

	public sendNotification = (data: any, userId?: string | ObjectID) => {
		if (!userId) {
			this.socket.emit("notifications", data);
			return;
		}
		if (!this.users.has(userId.toString())) {
			return;
		}
		const user = this.users.get(userId.toString());
		user.sockets.forEach(socket => {
			socket.emit("notifications", data);
		});
	}
	/**
	 * @author apollo
	 * @param job 
	 */
	public sendUpdateJob = (job:Job) => {

		if(job.workers.length != 0){
			job.workers.map((worker)=>{
				let jobInfo = this.filterJobsWithWorker([job],true,worker.workerId.toString());
				console.log("JOBINFO",jobInfo);
				if (!this.users.has(worker.workerId.toString())) {
					return;
				}
				const user = this.users.get(worker.workerId.toString());
				user.sockets.forEach(socket => {
					socket.emit("jobUpdated", jobInfo);
				});
			})
			
		}
		
	}
	public  sendUpdateJobWithUser = async(job:Job,updateUser:Array<JobWorker> = [])=>{
		
		if(updateUser.length != 0){
			updateUser.map(async(worker)=>{
				let jobInfo = this.filterJobsWithWorker([job],true,worker.workerId.toString());
				console.log("JOBINFO",jobInfo);
				if (!this.users.has(worker.workerId.toString())) {
					return;
				}
				const user = this.users.get(worker.workerId.toString());
				user.sockets.forEach(socket => {
					socket.emit("jobUpdated", jobInfo);
				});
			})
		}
	}
	private  filterJobsWithWorker(jobs: Job[], isWorker: boolean,userId:String) {
		
		let _jobs: any[];
		_jobs = jobs;
		if (isWorker) {
		  _jobs = [];
		  jobs.forEach((job) => {
			let workerAsigns: any[];
			let timesheetId: any[];
			let conEdisonTruck:Number;//apollo
	
			if(job.jobStatus!==6){
			
			  workerAsigns = job.workers.filter(
				(jW) => {
				  
				  return jW.workerId === userId
				}
			  );
			
			  timesheetId = job.timesheets && job.timesheets.map((item: any) => {
                            conEdisonTruck = item.conEdisonTruck;
                            return item.id;
                        }
                    );
			  workerAsigns.forEach((jW) => {
				_jobs.push({...job.workerView(jW),"timeSheetsId":timesheetId,'conEdisonTruck':conEdisonTruck});
			  });
			}
		  });
		}
		

		_jobs.map((_job) => {
		  if (_job.changesLog) {
			delete _job.changesLog;
			delete _job.timesheets;
			return _job;
		  }
		});
		return _jobs;
	  }

}

class SocketUser {
	id: string | ObjectID;
	firstName: string;
	lastName: string;
	roles: Array<EROLES>;

	sockets: Set<any>;

	constructor() {
		this.sockets = new Set();
	}
}

export default NotificationsServer;
