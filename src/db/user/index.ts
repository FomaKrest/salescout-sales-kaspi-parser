import { ObjectId, Schema } from "mongoose";
import { MongoDatabase } from "../index.js";

const COLLECTION_NAME = 'User';

export interface IUser {
  id: string,
  userName: string,
  firstName: string
}

const UserSchema = new Schema<IUser>(
  {
    id: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: false
    }
  },
  { timestamps: true, }
)

export const UserModel = MongoDatabase.mainDataBaseConnection.model<IUser>(
  COLLECTION_NAME,
  UserSchema,
  COLLECTION_NAME,
)
