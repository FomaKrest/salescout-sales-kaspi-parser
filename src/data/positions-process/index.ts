import { PositionProcessModel } from "../../db/positions-process";
import { IProduct } from "../../domains/parser";



export class PositionProcessData {
  public static async addNewProcess(requestId: string, products: IProduct[], userId: string, merchantId: string) {
    const productsIds: any[] = []
    products.forEach((product: IProduct) => {
      productsIds.push({
        productId: product.id,
        name: product.productName,
      })
    })
    const process = new PositionProcessModel({
      requestId,
      userId,
      merchantId,
      products: productsIds,
      productsAmount: products.length,
    })
    process
      .save()
      .then((res) => {
        return res
      }).catch((err) => {
        console.log(err);
        return err
      })
  }

  public static async getProductsByRequestId(requestId: string) {
    return PositionProcessModel
      .findOne({ requestId })
      .then((res) => {
        return res ? res.products : [];
      })
      .catch((err) => {
        console.log(err);
        return [];
      })
  }

  public static async getProductsByUserAndMerchantId(userId: string, merchantId: string) {
    return PositionProcessModel
      .find({ userId, merchantId }).limit(1).sort({ $natural: -1 })
      .then((res) => {
        return res ? res[0].products : [];
      })
      .catch((err) => {
        console.log(err);
        return [];
      })
  }

  public static async addNewProductInProcess(requestId: string, product: IProduct) {
    PositionProcessModel
      .updateOne(
        { requestId },
        { $push: { products: { productId: product.id, name: product.productName } }, $inc: { productsAmount: 1 } }
      )
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log(err);
        return err;
      })
  }

  public static async addNewProductsInProcess(requestId: string, products: IProduct[]) {
    products.forEach((product: IProduct) => {
      this.addNewProductInProcess(requestId, product);
    })
  }

  public static async finishOneProductProcess(requestId: string, productId: string, position: number, minPrice: number, price: string) {
    PositionProcessModel
      .findOneAndUpdate(
        { requestId, "products.productId": productId },
        {
          $set: {
            "products.$.isProcessing": false,
            "products.$.position": position,
            "products.$.minPrice": minPrice,
            "products.$.price": price
          }
        })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log(err);
      })
  }

  public static async isProcessFinished(requestId: string): Promise<boolean> {
    return PositionProcessModel
      .findOne({ requestId })
      .then((res) => {
        if (!res) return false
        const finishedProductProcessesAmount = res.products.filter((product) => { return product.isProcessing == false }).length
        return finishedProductProcessesAmount == res.productsAmount;
      })
      .catch((err) => {
        console.log(err);
        return false
      })
  }
}