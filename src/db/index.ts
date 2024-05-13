import { Mongoose } from "mongoose";
import { Config } from "../domains/config/index";


export class MongoDatabase {
  public static mainDataBaseConnection: Mongoose = new Mongoose()
  public static async initMainDataBaseConnection(): Promise<void> {
      console.log(`Trying to connect to ${Config.mongoUrl}`)

      return MongoDatabase.mainDataBaseConnection
          .connect(Config.mongoUrl)
          .then(() => console.log(`Connected to ${Config.mongoUrl}`))
          .catch((err) => {
              console.log(`Couldn't connect to ${Config.mongoUrl}`)
              throw err
          })
  }
}