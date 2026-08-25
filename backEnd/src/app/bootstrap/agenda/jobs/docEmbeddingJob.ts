
import { docEmbedding } from "@/app/http/controllers/notes/chat/EmbedDoc";
import agenda from "../agenda";

agenda.define("docEmbedding", async (job:any) => {

  const { noteId, docId, userId } = job.attrs.data as any;
   console.log("🎨 Starting document embedding");

   await docEmbedding({ docId, userId, noteId })
  
  console.log('finish embedding')

});

