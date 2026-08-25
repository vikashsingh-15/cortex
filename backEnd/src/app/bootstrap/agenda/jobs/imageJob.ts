import { generateImage } from "@/app/http/controllers/notes/helpers/generateImage";
import { Note } from "@/app/models/noteSchema";
import agenda from "../agenda";

agenda.define("generateImage", async (job:any) => {
  const { noteId ,generateImagePrompt, uploadsDir, randomName} = job.attrs.data as any;
   console.log("🎨 Starting image generation for note:", noteId);

   await generateImage(generateImagePrompt, uploadsDir, randomName, async (imageData: Buffer) => {
  
  console.log('Finished generating the image')
  await Note.findByIdAndUpdate(noteId, {
    image: `${process.env.APP_URL}/api/v1/notes/${noteId}/image`,
    imageData,
    imageMimeType: "image/png",
  });
  
          })
  

});
