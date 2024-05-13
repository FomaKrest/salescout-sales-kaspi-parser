import { ObjectId, Schema } from "mongoose";
import { MongoDatabase } from "../index.js";

const COLLECTION_NAME = 'PositionProsess';

export interface IPositionProsess {
  requestId: string,
  userId: string,
  merchantId: string,
  products: {
    productId: string,
    isProcessing: boolean,
    position: number,
    name: string,
    minPrice?: number,
    price?: string
  }[],
  productsAmount: number,
  //createdAt: Date
}

const PositionProcessSchema = new Schema<IPositionProsess>(
  {
    requestId: {
      type: String,
      required: true,
    },

    userId: {
      type: String,
      required: true,
    },
    merchantId: {
      type: String,
      required: true,
    },

    productsAmount: {
      type: Number,
      required: true,
    },

    products: [{
      productId: {
        type: String,
        required: true
      },
      isProcessing: {
        type: Boolean,
        required: true,
        default: true,
      },
      position: {
        type: Number,
        required: false,
        default: -1
      },
      name: {
        type: String,
        required: true,
      },
      minPrice: {
        type: Number,
        required: false,
      },
      price: {
        type: String,
        required: false,
      }
    }],

    //createdAt: {
    //  type: Date,
    //  required: true,
    //}
  },
  //{ timestamps: true, }
)

export const PositionProcessModel = MongoDatabase.mainDataBaseConnection.model<IPositionProsess>(
  COLLECTION_NAME,
  PositionProcessSchema,
  COLLECTION_NAME,
)
