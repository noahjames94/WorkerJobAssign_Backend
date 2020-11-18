export interface ApplicationEntityInterface {
  tableName: string;
  [key: string]: any;
  assignAttributes: Function;
  validate: Function;
  save: Function;
}
