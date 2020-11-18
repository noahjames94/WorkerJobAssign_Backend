import { Constructable, MetadataObj } from "@commons";
import { ApplicationEntity } from "@entities/applicationEntity";
import { Pagination } from "@paginate";
import { QueryBuilderImpl } from "@utils/queryBuilder";
import { Request } from "express";
import { AbstractRepository, DeleteResult, getMongoRepository, ObjectID } from "typeorm";

import { ApplicationRepository } from "./applicationRepository";
import { Job } from "../../entities";
import { ITEMS_PER_PAGE } from "../../utils/queryBuilder/const";

export class ApplicationRepositoryImpl<T extends ApplicationEntity> extends AbstractRepository<T>
	implements ApplicationRepository<T> {
	EntityType: Constructable<T>;

	async findById(id: string | ObjectID): Promise<T> {
		return <T>await this.repository.findOne(id);
	}

	async findByIds(ids: string[] | ObjectID[]): Promise<T[]> {
		return <T[]>await this.repository.findByIds(ids);
	}

	async findOne(query: any = {}, projection: any = {}): Promise<T> {
		const result = <any | undefined>await this.repository.findOne(query, projection);
		return result;
	}

	async findAll(request: Request, appQuery: any = {}): Promise<Pagination<T>> {
		const queryBuilder = new QueryBuilderImpl<T>(request, appQuery);
		const query = queryBuilder.build();
		const [results, total] = <[T[], number]>await this.repository.findAndCount(query);
		return new Pagination<T>({
			results,
			total,
			page: queryBuilder.page,
			limit: queryBuilder.limit
		});
	}

	async findAllNoPaginate(appQuery: any = {}): Promise<T[]> {
		return this.repository.find(appQuery);
	}

	async customCreate(args: MetadataObj, permitKeys: Array<string> = []): Promise<T> {
		const entity = await this.buidEntity();
		entity.assignAttributes(args, permitKeys);
		await entity.validate();
		return await entity.save();
	}

	async customUpdate(entity: T, args: MetadataObj, permitKeys: Array<string> = []): Promise<T> {
		entity.assignAttributes(args, permitKeys);
		await entity.validate();
		return await entity.save();
	}

	async findAndUpdate(id: string, args: MetadataObj, permitKeys: Array<string> = []) {
		const user: any = await this.findById(id);
		user.save();
		return await this.customUpdate(user, args, permitKeys);
	}

	async destroy(id: string): Promise<DeleteResult> {
		return <DeleteResult>await this.repository.delete(id);
	}

	async aggregate(query: any = {}, page: number = 1, filters?: any): Promise<Pagination<T>> {
		const totalC = getMongoRepository(Job).aggregate([
			{
				$group : { ...query.$group, total: { $sum: 1 } }
			}
		]);
		let total = 0;
		const totalRes = await totalC.next();
		if (totalRes && totalRes.hasOwnProperty("total")) {
			total = totalRes.total;
		}
		const last = Math.ceil(total / ITEMS_PER_PAGE);
		if (page > last) {
			page = last;
		}
		const skip = ((page - 1) * ITEMS_PER_PAGE < 0) ? 0 :  ((page - 1) * ITEMS_PER_PAGE);
		let resultQuery = [query, {$skip: skip}];

		if (filters && filters !== {}) {
			resultQuery = [{$match: filters}, ...resultQuery];
		}

		return new Pagination<T>({
			results: await (getMongoRepository(Job).aggregate(resultQuery)).toArray(),
			total,
			page,
			limit: ITEMS_PER_PAGE
		});
	}

	async count(appQuery: any = {}): Promise<number> {
		return this.repository.count(appQuery);
	}

	protected buidEntity(): T {
		const EntityType = this.EntityType;
		return new EntityType();
	}
}
