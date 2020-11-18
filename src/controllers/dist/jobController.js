"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.JobController = void 0;
var _commons_1 = require("@commons");
var decorators_1 = require("@commons/decorators");
var _repositories_1 = require("@repositories");
var express_1 = require("express");
var inversify_1 = require("inversify");
var typeorm_1 = require("typeorm");
var applicationController_1 = require("./applicationController");
var passport_1 = require("passport");
var _entities_1 = require("@entities");
var _constants_1 = require("@constants");
var _constants_2 = require("@constants");
var jobWorker_1 = require("../entities/jobWorker");
var fs = require("fs");
var path = require("path");
var notification_1 = require("../entities/notification");
var ObjectId = require("mongodb").ObjectId.ObjectId;
var JobController = /** @class */ (function (_super) {
    __extends(JobController, _super);
    function JobController(_logger, _mailer) {
        var _this = _super.call(this, _logger) || this;
        _this.testSocket = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.job.findById("5da49ae110edbf7c782f4c60")];
                    case 1:
                        job = _a.sent();
                        _repositories_1.NotificationRepositoryImpl.createNotificationForJob(job, notification_1.notifiableTypes.CREATE_JOB);
                        res.json({ message: "success" });
                        return [2 /*return*/];
                }
            });
        }); };
        _this.reRouteWorkers = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var _a, workers, location, jobIds, jobMap, _i, workers_1, worker, jobs, fns, _loop_1, _b, jobs_1, job, updated;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = req.body, workers = _a.workers, location = _a.location;
                        if (!workers || !Array.isArray(workers)) {
                            return [2 /*return*/, res.status(400).send({ message: '"worker" is required' })];
                        }
                        if (!location) {
                            return [2 /*return*/, res.status(400).send({ message: '"location" is required' })];
                        }
                        if (Array.isArray(location)) {
                            return [2 /*return*/, res.status(400).send({ message: '"location" is invalid' })];
                        }
                        jobIds = [];
                        jobMap = {};
                        for (_i = 0, workers_1 = workers; _i < workers_1.length; _i++) {
                            worker = workers_1[_i];
                            if (!worker.jobId)
                                return [2 /*return*/, res.status(400).send({ message: '"jobId" is required' })];
                            if (!worker.workerIds || !Array.isArray(worker.workerIds))
                                return [2 /*return*/, res.status(400).send({ message: '"workerIds" is required' })];
                            jobIds.push(ObjectId(worker.jobId));
                            jobMap[worker.jobId] = worker.workerIds;
                        }
                        return [4 /*yield*/, this.job.findAllNoPaginate({ _id: { $in: jobIds } })];
                    case 1:
                        jobs = _c.sent();
                        if (!jobs || !jobs.length) {
                            return [2 /*return*/, res.status(404).send({ message: "jobs not found" })];
                        }
                        fns = [];
                        _loop_1 = function (job) {
                            job.workers = job.workers.map(function (item) {
                                if (jobMap[job.id.toString()] && jobMap[job.id.toString()].indexOf(item.workerId) >= 0) {
                                    item.location = location;
                                }
                                return item;
                            });
                            fns.push(job.save());
                        };
                        for (_b = 0, jobs_1 = jobs; _b < jobs_1.length; _b++) {
                            job = jobs_1[_b];
                            _loop_1(job);
                        }
                        return [4 /*yield*/, Promise.all(fns)];
                    case 2:
                        updated = _c.sent();
                        res.json(updated);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.addJobImage = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var images;
            return __generator(this, function (_a) {
                images = this.getUploadFilesPaths(req, { contentType: "image/jpeg" });
                if (!images.length) {
                    res.status(400).send({ message: '"images" are required' });
                    return [2 /*return*/];
                }
                res.json(images);
                return [2 /*return*/];
            });
        }); };
        _this.updateJobImage = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var job, images;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.job.findById(req.params.id)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        images = this.getUploadFilesPaths(req, { contentType: "image/jpeg" });
                        if (!images.length) {
                            res.status(400).send({ message: '"images" are required' });
                            return [2 /*return*/];
                        }
                        this.job.author = req.user;
                        return [4 /*yield*/, this.job.customUpdate(job, { jobImages: images }, this.permitedAttributes)];
                    case 2:
                        _a.sent();
                        res.json(job);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.removeWorkerImages = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var job, isWorker, workerId, index, jWorkers, iIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.body.date) {
                            res.status(400).send({ message: '"date" is required' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.job.findById(req.params.id)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        isWorker = false;
                        workerId = undefined;
                        if (req.user.roles && req.user.roles.includes(_constants_2.EROLES.worker)) {
                            workerId = req.user.id.toString();
                            isWorker = true;
                        }
                        else if (req.body && req.body.hasOwnProperty("workerId")) {
                            workerId = req.body.workerId;
                        }
                        index = job.workers.findIndex(function (_worker) { return _worker.workerId === workerId && req.body.date === _worker.startDate; });
                        if (index === -1) {
                            res.status(400).send({ message: "worker with id=" + workerId + " does not exist" });
                            return [2 /*return*/];
                        }
                        jWorkers = __spreadArrays(job.workers);
                        if (req.body.image) {
                            iIndex = jWorkers[index].images.indexOf(req.body.image);
                            if (iIndex > -1) {
                                jWorkers[index].images.splice(iIndex, 1);
                                try {
                                    fs.unlinkSync(path.join(process.cwd(), req.body.image));
                                }
                                catch (e) {
                                    console.error(e);
                                }
                            }
                        }
                        this.job.author = req.user;
                        return [4 /*yield*/, this.job.customUpdate(job, { workers: jWorkers }, this.permitedAttributes)];
                    case 2:
                        _a.sent();
                        if (isWorker) {
                            res.send(job.workerView(job.workers[index]));
                        }
                        else {
                            res.send(job);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        _this.uploadWorkerImages = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var images, job, isWorker, workerId, index, jWorkers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        images = this.getUploadFilesPaths(req, { contentType: "image/jpeg" });
                        if (!images.length) {
                            res.status(400).send({ message: '"images" are required' });
                            return [2 /*return*/];
                        }
                        if (!req.body.date) {
                            res.status(400).send({ message: '"date" is required' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.job.findById(req.params.id)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        isWorker = false;
                        workerId = undefined;
                        if (req.user.roles && req.user.roles.includes(_constants_2.EROLES.worker)) {
                            workerId = req.user.id.toString();
                            isWorker = true;
                        }
                        else if (req.body && req.body.workerId) {
                            workerId = req.body.workerId;
                        }
                        index = job.workers.findIndex(function (_worker) { return _worker.workerId === workerId && req.body.date === _worker.startDate; });
                        if (index === -1) {
                            res.status(400).send({ message: "worker with id=" + workerId + " does not exist" });
                            return [2 /*return*/];
                        }
                        jWorkers = __spreadArrays(job.workers);
                        jWorkers[index].images = __spreadArrays(jWorkers[index].images, images);
                        job.notificationObj = { type: notification_1.notifiableTypes.WORKER_UPLOAD_AN_IMAGE };
                        this.job.author = req.user;
                        return [4 /*yield*/, this.job.customUpdate(job, { workers: jWorkers }, this.permitedAttributes)];
                    case 2:
                        _a.sent();
                        if (isWorker) {
                            res.send(job.workerView(job.workers[index]));
                        }
                        else {
                            res.send(job);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        _this.hasSeen = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var job, workerId, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.body.hasOwnProperty("hasSeen")) {
                            res.status(400).send({ message: '"hasSeen" is required' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.job.findById(req.params.id)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        workerId = undefined;
                        if (req.user.roles && req.user.roles.includes(_constants_2.EROLES.worker)) {
                            workerId = req.user.id.toString();
                        }
                        else if (req.body.hasOwnProperty("workerId")) {
                            workerId = req.body.workerId;
                        }
                        index = job.workers.findIndex(function (_worker) { return _worker.workerId === workerId; });
                        if (index === -1) {
                            res.status(400).send({ message: "worker with id=" + workerId + " does not exist" });
                            return [2 /*return*/];
                        }
                        job.hasSeen = req.body.hasSeen;
                        return [4 /*yield*/, job.save()];
                    case 2:
                        _a.sent();
                        res.send(job);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.job = typeorm_1.getCustomRepository(_repositories_1.JobRepositoryImpl);
        _this.notification = typeorm_1.getCustomRepository(_repositories_1.NotificationRepositoryImpl);
        _this.users = typeorm_1.getCustomRepository(_repositories_1.UserRepositoryImpl);
        _this.mailer = _mailer;
        return _this;
    }
    JobController.prototype.register = function (app, upload) {
        _super.prototype.register.call(this, app);
        var router = express_1["default"].Router();
        router.all("*", passport_1["default"].authenticate("jwt", { session: false }));
        app.use("/jobs", router);
        router.route("/").post(this._addMany);
        router.route("/:creatorId").post(this._add);
        router.route("/").get(this._findAll);
        router.route("/projects").get(this.jobsProjects);
        router.route("/search").get(this._find);
        router.route("/:id/workers").post(this._addWorker);
        router.route("/:id/workers")["delete"](this._removeWorker);
        router.route("/:id/workers").put(this._updateWorker);
        router.route("/pos").put(this._updatePO);
        router.route("/:id").put(this._update);
        router.route("/:id")["delete"](this._delete);
        router.route("/:id").get(this._show);
        router.route("/:id/images").put(upload.array("images"), this.uploadWorkerImages);
        router.route("/:id/images")["delete"](this.removeWorkerImages);
        router.route("/:id/has-seen").put(this.hasSeen);
        router.route("/:id/upload/job-image").put(upload.array("images"), this.updateJobImage);
        router.route("/upload/job-image").put(upload.array("images"), this.addJobImage);
        router.route("/re-route/jobs").put(this.reRouteWorkers);
        router.route("/test/socket").get(this.testSocket);
        router.route("/:id/notify-supervisor").get(this.notifySupervisor);
    };
    JobController.prototype._add = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.job.author = req.user;
                        return [4 /*yield*/, this.job.add(__assign(__assign({}, req.body), { creatorId: String(req.user.id), jobStatus: _constants_1.JobStatus.New }), this.permitedAttributes)];
                    case 1:
                        job = _a.sent();
                        res.send(job);
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._addWorker = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var worker, job, exist, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        worker = req.body.worker;
                        if (!worker) {
                            res.status(400).send({ message: '"worker" is required' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.job.findById(req.params.id)];
                    case 1:
                        job = _c.sent();
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        exist = job.workers.find(function (_worker) { return _worker.workerId === worker.workerId && _worker.startDate === worker.startDate; });
                        if (exist) {
                            res.status(400).send({ message: "worker with id=" + worker.workerId + " already exist" });
                            return [2 /*return*/];
                        }
                        this.job.author = req.user;
                        _b = (_a = res).send;
                        return [4 /*yield*/, this.job.customUpdate(job, { workers: __spreadArrays(job.workers, [__assign(__assign({}, worker), { assignorId: req.user.id })]) }, this.permitedAttributes)];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._updateWorker = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var job, isWorker, workerId, index, old, worker, supervisor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.body.hasOwnProperty("status")) {
                            res.status(400).send({ message: '"status" is required' });
                            return [2 /*return*/];
                        }
                        if (!req.body.hasOwnProperty("date")) {
                            res.status(400).send({ message: '"date" is required' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.job.findById(req.params.id)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        isWorker = false;
                        workerId = undefined;
                        if (req.user.roles && req.user.roles.includes(_constants_2.EROLES.worker)) {
                            workerId = req.user.id.toString();
                            isWorker = true;
                        }
                        else if (req.body.hasOwnProperty("workerId")) {
                            workerId = req.body.workerId;
                        }
                        index = job.workers.findIndex(function (_worker) { return _worker.workerId === workerId && req.body.date === _worker.startDate; });
                        if (index === -1) {
                            res.status(400).send({ message: "worker with id=" + workerId + " does not exist" });
                            return [2 /*return*/];
                        }
                        if (!jobWorker_1.WorkerJobStatus.hasOwnProperty(+req.body.status)) {
                            res.status(400).send({ message: "Status " + req.body.status + " does not exist" });
                            return [2 /*return*/];
                        }
                        old = __assign({}, job);
                        job.setWorkerStatus(workerId, req.body.date, +req.body.status);
                        old.notificationObj = job.notificationObj;
                        this.job.author = req.user;
                        return [4 /*yield*/, this.job.customUpdate(old, { jobStatus: job.jobStatus, workers: job.workers, hasSeen: false }, this.permitedAttributes)];
                    case 2:
                        _a.sent();
                        worker = job.workers[index];
                        if (!(jobWorker_1.WorkerJobStatus.CANNOTSECURE === +req.body.status)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.users.findById(job.supervisor)];
                    case 3:
                        supervisor = _a.sent();
                        _a.label = 4;
                    case 4:
                        if (isWorker) {
                            res.send(job.workerView(worker));
                        }
                        else {
                            res.send(job);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._removeWorker = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var worker, job, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        worker = req.body.worker;
                        if (!worker) {
                            res.status(400).send({ message: '"worker" is required' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.job.findById(req.params.id)];
                    case 1:
                        job = _c.sent();
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        this.job.author = req.user;
                        _b = (_a = res).send;
                        return [4 /*yield*/, this.job.customUpdate(job, { workers: job.workers.filter(function (_worker) { return _worker.workerId !== worker.workerId; }) }, this.permitedAttributes)];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._addMany = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, jobs, totalPo, title, data, _loop_2, _i, jobs_2, job, _jobs;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = req.body, jobs = _a.jobs, totalPo = _a.totalPo, title = _a.title;
                        if (!jobs || !Array.isArray(jobs)) {
                            res.status(400).send({ message: '"jobs" is required' });
                            return [2 /*return*/];
                        }
                        this.job.author = req.user;
                        data = [];
                        _loop_2 = function (job) {
                            job.workers = job.workers.map(function (worker) {
                                if (job.locations && Array.isArray(job.locations)) {
                                    worker.location = job.locations[0];
                                }
                                worker.assignerId = req.user.id.toString();
                                worker.status = WorkerJobStatus.NEW;
                                return worker;
                            });
                            data.push(__assign(__assign({}, job), { creatorId: String(req.user.id), jobStatus: _constants_1.JobStatus.New }));
                        };
                        for (_i = 0, jobs_2 = jobs; _i < jobs_2.length; _i++) {
                            job = jobs_2[_i];
                            _loop_2(job);
                        }
                        return [4 /*yield*/, Promise.all(data.map(function (job) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.job.add(job, this.permitedAttributes)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); }))];
                    case 1:
                        _jobs = _b.sent();
                        res.send(_jobs);
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._findAll = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var query, page, user, isWorker, departments, departmentIds, found, _jobs, found, _jobs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _entities_1.Job.buildSearchQuery(req.query, req.body.authType !== "admin")];
                    case 1:
                        query = _a.sent();
                        page = req.query.page;
                        user = req.user;
                        isWorker = false;
                        if (user && user.roles && user.roles.includes(_constants_2.EROLES.worker)) {
                            isWorker = true;
                            query.workers = { $elemMatch: { workerId: req.user.id.toString() } };
                        }
                        else if (req.query.worker) {
                            query.workers = { $elemMatch: { workerId: req.query.worker.id.toString() } };
                        }
                        if (user && user.roles) {
                            if ((req.query.hasOwnProperty("field_supervisor") &&
                                req.query.field_supervisor === "true" &&
                                user.roles.includes(_constants_2.EROLES.coned_field_supervisor))
                                || ((user.roles.includes(_constants_2.EROLES.requestor) ||
                                    user.roles.includes(_constants_2.EROLES.department_supervisor) ||
                                    user.roles.includes(_constants_2.EROLES.coned_billing_admin)) &&
                                    !(user.roles.includes(_constants_2.EROLES.dispatcher) ||
                                        user.roles.includes(_constants_2.EROLES.dispatcher_supervisor) ||
                                        user.roles.includes(_constants_2.EROLES.billing) ||
                                        user.roles.includes(_constants_2.EROLES.superadmin)))) {
                                departments = user.departments;
                                departmentIds = departments.map(function (el) { return Number(el.id); });
                                query["department"] = { $in: departmentIds };
                            }
                        }
                        if (user && user.roles) {
                            if (user.roles.includes(_constants_2.EROLES.requestor)) {
                                if (!(user.roles.includes(_constants_2.EROLES.department_supervisor) ||
                                    user.roles.includes(_constants_2.EROLES.dispatcher) ||
                                    user.roles.includes(_constants_2.EROLES.dispatcher_supervisor) ||
                                    user.roles.includes(_constants_2.EROLES.billing) ||
                                    user.roles.includes(_constants_2.EROLES.superadmin))) {
                                    query["creatorId"] = "" + user.id;
                                }
                            }
                        }
                        if (user && user.roles) {
                            if (user.roles.includes(_constants_2.EROLES.coned_field_supervisor)) {
                                if (!(user.roles.includes(_constants_2.EROLES.requestor) ||
                                    user.roles.includes(_constants_2.EROLES.department_supervisor) ||
                                    user.roles.includes(_constants_2.EROLES.dispatcher) ||
                                    user.roles.includes(_constants_2.EROLES.dispatcher_supervisor) ||
                                    user.roles.includes(_constants_2.EROLES.billing) ||
                                    user.roles.includes(_constants_2.EROLES.superadmin))) {
                                    query["supervisor"] = "" + user.id;
                                }
                            }
                        }
                        if (!page) return [3 /*break*/, 3];
                        req.query = { page: req.query.page };
                        return [4 /*yield*/, this.job.findAllWithTextSearch(req, query)];
                    case 2:
                        found = _a.sent();
                        _jobs = this.filterJobsWithWorker(found.results, isWorker, req);
                        res.send({
                            results: _jobs,
                            total: found.total,
                            page: found.page,
                            totalPage: found.totalPage,
                            limit: found.limit
                        });
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.job.findAllNoPaginate(query)];
                    case 4:
                        found = _a.sent();
                        _jobs = this.filterJobsWithWorker(found, isWorker, req);
                        res.send({
                            results: _jobs,
                            totalPage: found.length
                        });
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype.filterJobsWithWorker = function (jobs, isWorker, req) {
        var _jobs;
        _jobs = jobs;
        if (isWorker) {
            _jobs = [];
            jobs.forEach(function (job) {
                var workerAsigns;
                workerAsigns = job.workers.filter(function (jW) { return jW.workerId === req.user.id.toString(); });
                workerAsigns.forEach(function (jW) {
                    _jobs.push(job.workerView(jW));
                });
            });
        }
        _jobs.map(function (_job) {
            if (_job.changesLog) {
                delete _job.changesLog;
                delete _job.timesheets;
                return _job;
            }
        });
        return _jobs;
    };
    JobController.prototype.jobsProjects = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var query, found, projects;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _entities_1.Job.buildSearchQuery(req.query)];
                    case 1:
                        query = _a.sent();
                        if (req.query.page) {
                            req.query = { page: req.query.page };
                        }
                        else {
                            req.query = { page: 1 };
                        }
                        return [4 /*yield*/, this.job.aggregate({
                                $group: { _id: "$totalPo", jobs: { $push: "$$ROOT._id" } }
                            }, req.query.page, query)];
                    case 2:
                        found = _a.sent();
                        return [4 /*yield*/, Promise.all(found.results.map(function (project) { return __awaiter(_this, void 0, void 0, function () {
                                var jobsIds, jobs;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            jobsIds = [];
                                            project.jobs.forEach(function (jobId) { return jobsIds.push(ObjectId(jobId)); });
                                            return [4 /*yield*/, this.job.findByIds(jobsIds)];
                                        case 1:
                                            jobs = _a.sent();
                                            jobs.map(function (_job) {
                                                if (!_job.changesLog) {
                                                    return _job;
                                                }
                                                delete _job.changesLog;
                                                delete _job.timesheets;
                                                return _job;
                                            });
                                            return [2 /*return*/, { _id: project._id, jobs: jobs }];
                                    }
                                });
                            }); }))];
                    case 3:
                        projects = _a.sent();
                        res.send({
                            results: projects,
                            total: found.total,
                            page: found.page,
                            totalPage: found.totalPage,
                            limit: found.limit
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._find = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = res).send;
                        return [4 /*yield*/, this.job.findAll(req)];
                    case 1:
                        _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._show = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var job, timesheets, totals, i, _a, _b, workers, i, assigner;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.job.findById(req.params.id.toString())];
                    case 1:
                        job = _c.sent();
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        timesheets = [];
                        totals = {};
                        if (!(job.timesheets && job.timesheets.length)) return [3 /*break*/, 6];
                        i = 0;
                        _c.label = 2;
                    case 2:
                        if (!(i < job.timesheets.length)) return [3 /*break*/, 5];
                        _b = (_a = timesheets).push;
                        return [4 /*yield*/, job.timesheets[i].invoiceView(undefined, true)];
                    case 3:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5:
                        totals = timesheets.reduce(function (a, b) {
                            return {
                                regularHours: a.regularHours + b.regularHours,
                                overtimeHours: a.overtimeHours + b.overtimeHours,
                                holidayHours: a.holidayHours + b.holidayHours,
                                totalHours: a.totalHours + b.totalHours
                            };
                        }, { regularHours: 0, overtimeHours: 0, holidayHours: 0, totalHours: 0 });
                        _c.label = 6;
                    case 6:
                        if (!job.workers.length) return [3 /*break*/, 12];
                        workers = [];
                        i = 0;
                        _c.label = 7;
                    case 7:
                        if (!(i < job.workers.length)) return [3 /*break*/, 11];
                        if (!(!req.query.workerId || (req.query.workerId && req.query.workerId == job.workers[i].workerId))) return [3 /*break*/, 10];
                        if (!job.workers[i].assignerId) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.users.findById(job.workers[i].assignerId)];
                    case 8:
                        assigner = _c.sent();
                        job.workers[i].assignerName = assigner.firstName + " " + assigner.lastName;
                        _c.label = 9;
                    case 9:
                        workers.push(job.workers[i]);
                        _c.label = 10;
                    case 10:
                        i++;
                        return [3 /*break*/, 7];
                    case 11:
                        job.workers = workers;
                        _c.label = 12;
                    case 12:
                        res.send(__assign(__assign(__assign({}, job), { confirmationNumber: job.confirmationNumber }), totals));
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._update = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var attrs, job, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        attrs = __assign({}, req.body);
                        return [4 /*yield*/, this.job.findById(req.params.id)];
                    case 1:
                        job = _c.sent();
                        if (Array.isArray(attrs.workers)) {
                            attrs.workers = attrs.workers.map(function (worker) { return (__assign(__assign({}, worker), { status: worker.status ? worker.status : _constants_1.JobStatus.New })); });
                        }
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        this.job.author = req.user;
                        _b = (_a = res).send;
                        return [4 /*yield*/, this.job.customUpdate(job, attrs, this.permitedAttributes)];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._delete = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(req.params.id, req.user)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.job["delete"](req.params.id)];
                    case 1:
                        _a.sent();
                        res.sendStatus(202);
                        _a.label = 2;
                    case 2:
                        res.end();
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype._updatePO = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var i, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.body.ids || !req.body.newPo) {
                            res.status(400).send({ message: '"Ids and new Po" are required' });
                            return [2 /*return*/];
                        }
                        if (!Array.isArray(req.body.ids)) {
                            res.status(400).send({ message: '"Ids" must be an array!' });
                            return [2 /*return*/];
                        }
                        if (isNaN(req.body.newPo)) {
                            res.status(400).send({ message: '"new Po" must be a number!' });
                            return [2 /*return*/];
                        }
                        this.job.author = req.user;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < req.body.ids.length)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.job.findById(req.body.ids[i].toString())];
                    case 2:
                        job = _a.sent();
                        if (!job) {
                            return [3 /*break*/, 4];
                        }
                        job.notificationObj = { type: notification_1.notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED };
                        return [4 /*yield*/, this.job.customUpdate(job, { po: req.body.newPo })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 1];
                    case 5:
                        res.sendStatus(202);
                        return [2 /*return*/];
                }
            });
        });
    };
    JobController.prototype.notifySupervisor = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var job, user, url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.job.findById(req.params.id.toString())];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            res.status(404).send();
                            return [2 /*return*/];
                        }
                        if (!job.supervisor) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.users.findById(job.supervisor)];
                    case 2:
                        user = _a.sent();
                        console.log(job.timesheets);
                        if (user && job.timesheets && job.timesheets.length) {
                            url = process.env.CLIENT_DOMAIN + "/timesheets/" + job.timesheets[0].id + "/edit";
                            console.log(url);
                          /* send notification 
                            this.mailer.send(user.email, { url: url, confirmationNumber: job.timesheets[0].confirmationNumber }, "notifySupervisor");
                        */
                        }
                        _a.label = 3;
                    case 3:
                        res.send();
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(JobController.prototype, "permitedAttributes", {
        get: function () {
            return [
                "title",
                "totalPo",
                "jobType",
                "requestTime",
                "requestor",
                "supervisor",
                "department",
                "section",
                "po",
                "maxWorkers",
                "feeder",
                "wr",
                "requisition",
                "structure",
                "locations",
                "comment",
                "workers",
                "jobStatus",
                "status",
                "creatorId",
                "account",
                "municipality",
                "endTime",
                "hasSeen",
                "jobImages"
            ];
        },
        enumerable: false,
        configurable: true
    });
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_add");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_addWorker");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_updateWorker");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_removeWorker");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_addMany");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_findAll");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "jobsProjects");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_find");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_show");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_update");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_delete");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "_updatePO");
    __decorate([
        decorators_1.rescuable
    ], JobController.prototype, "notifySupervisor");
    JobController = __decorate([
        inversify_1.injectable(),
        __param(0, inversify_1.inject(_commons_1.TYPES.SystemLogger)), __param(1, inversify_1.inject(_commons_1.TYPES.Mailer))
    ], JobController);
    return JobController;
}(applicationController_1["default"]));
exports.JobController = JobController;
