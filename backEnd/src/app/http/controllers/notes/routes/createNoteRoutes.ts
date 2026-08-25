import multer from "multer";
import { Response, Router } from "express";
import { createNote, createNote2 } from "../createNote";

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

export function createNoteRoute(router: Router) {
  router.post("/notes", upload.single("doc"), createNote);

 
  return router;
}
