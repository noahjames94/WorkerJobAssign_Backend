import "module-alias/register";
import chalk from "chalk";
import * as mongo from "mongodb";


import app from "./app";

const port = process.env.PORT || 3000;

app.listen(port, (err: any) => {
  if (err) {
    return console.log(chalk.red(err));
  }
  return console.log(chalk.greenBright("Server Started!!!"));
});

export class MongoHelper {
  public static client: mongo.MongoClient;

  public static connect(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (MongoHelper.client) {
        return resolve(MongoHelper.client);
      }
      mongo.MongoClient.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT || 27017}`, { useNewUrlParser: true, useUnifiedTopology: true },
        (err, client: mongo.MongoClient) => {
          if (err) {
            reject(err);
          } else {
            MongoHelper.client = client;
            resolve(client);
          }
        });
    });
  }

  public disconnect(): void {
    MongoHelper.client.close();
    MongoHelper.client = undefined;
  }

  public static getCollection = (name: string) => {
    return MongoHelper.client.db(process.env.DB_DATABASE_NAME).collection(name);
  }
}


