// import mongoose from "mongoose";

// export async function dbConnection() {
//   mongoose
//     .connect(process.env.DB_URL as string)
//     .then(() => console.log("Connected!"))
//     .catch(() => console.log("Db connection Error !"));
// }

import mongoose from "mongoose";

export async function dbConnection() {
  await mongoose.connect(process.env.DB_URL as string);
  console.log("Connected!");
}
