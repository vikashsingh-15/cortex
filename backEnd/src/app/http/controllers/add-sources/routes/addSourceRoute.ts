import { Router } from "express";
import { storeDriveFiles } from "../storeDriveFiles";
import { storeWeblinkData } from "../storeWeblinkData";
import { storeTextData } from "../storeTextData";
import { storeYoutubeScript } from "../storeYoutubeScript";
import multer from "multer";
import { storeUploadFiles } from "../storeUploadFiles";
import { searchWeb } from "../searchWeb";

const documentFileFilter = (req: any, file: any, cb: (error: any, acceptFile: boolean) => void) => {
  const allowedTypes = /pdf|doc|docx|html|csv|txt/;
  const isDoc = allowedTypes.test(file.mimetype) || allowedTypes.test(file.originalname.toLowerCase());

  if (isDoc) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only documents are allowed (pdf, doc, docx, txt)."), false);
  }
};


const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: documentFileFilter,
      limits: { fileSize: 6 * 1024 * 1024 } // 6MB

});


export function addSourceRoutes(router:Router){

      router.post('/notes/drive-files',storeDriveFiles)
      router.post('/notes/weblinkdata',storeWeblinkData)
      router.post('/notes/text-data',storeTextData)
      router.post('/notes/youtube-link',storeYoutubeScript)
     router.post("/notes/upload-files", upload.single("doc"), storeUploadFiles);

      router.get('/notes/search/web',searchWeb)




     
    return router
    
}



