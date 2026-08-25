import path from "path"



export function getFileExtension(filePath:string){
    
      const extentionWithoutDot=path.extname(filePath).replace('.',' ')
      return extentionWithoutDot
}