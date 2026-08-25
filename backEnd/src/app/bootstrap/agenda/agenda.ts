// // jobs/agenda.ts
// import Agenda from "agenda";

// const agenda = new Agenda({
//   db: { address: process.env.DB_URL as string, collection: "jobs" },
// });

// export default agenda;

//way 2

import Agenda from "agenda";

const agenda = new Agenda();

export default agenda;
