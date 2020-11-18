/**
 * NESTED OBJECT
 * This is not an entity
 */
import { Column } from "typeorm";
import { IsDate, IsNotEmpty, IsString } from "class-validator";

export class Comment {
	@Column()
	@IsString()
	@IsNotEmpty()
	author: string;

	@Column({default: new Date()})
	@IsDate()
	@IsNotEmpty()
	createdAt: Date;

	@Column()
	@IsString()
	@IsNotEmpty()
	comment: string;
}
