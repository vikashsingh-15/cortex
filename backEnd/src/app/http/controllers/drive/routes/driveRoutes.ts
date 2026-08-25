import { Router } from "express";
import { getUserDriveFiles } from "../getUserDriveFiles";
import { getDriveAccessToken } from "../getDriveAccessToken";



export function driveRoutes(router:Router){

    router.get('/users/files',getUserDriveFiles)
    router.get('/users/drive-access-token',getDriveAccessToken)
  

    return router
    
}
