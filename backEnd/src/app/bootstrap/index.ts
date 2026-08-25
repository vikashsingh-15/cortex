import { Express } from "express";
import { expressServer } from "./express/expressServer";
import { dbConnection } from "./mongoose/dbConnection";
import agenda from "./agenda/agenda";
import "./agenda/jobs/imageJob";
import "./agenda/jobs/docEmbeddingJob";

// async function initAgenda(){
//     try {
//          await agenda.start()
//          console.log('agenda is running')
//     } catch (error) {
//         console.log('failed running agenda')
//     }
// }

// export async function bootStrapApp(app: Express, PORT: number) {
// await dbConnection()
// await initAgenda()

//     expressServer(app, PORT)

// }

//way 2

async function initAgenda() {
  agenda.database(process.env.DB_URL as string, "jobs");
  await agenda.start();
  console.log("agenda is running");
}

// await dbConnection();
// await initAgenda();
// expressServer(app, PORT);

export async function bootStrapApp(app: Express, PORT: number) {
  await dbConnection();
  await initAgenda();

  expressServer(app, PORT);
}
