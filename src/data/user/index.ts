import { UserModel } from "../../db/user";

export class UserData {
  public static async addNewUser(userId: string, userName: string, firstName: string) {
    const user = new UserModel({
      id: userId,
      userName,
      firstName,
    })

    user
      .save()
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log(err);
        return err;
      })
  }
}