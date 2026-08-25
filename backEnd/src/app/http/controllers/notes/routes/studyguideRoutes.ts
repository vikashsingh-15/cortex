import { Router } from "express"
import { getStudyguide } from "../studyguide/getStudyguide"
import { updateOrCreateStudyguide } from "../studyguide/createOrUpdateStudyguide"


export function studyguideRoutes(router:Router){

    router.post('/notes/studyguide',getStudyguide)
    // router.put('/notes/study-guide',updateOrCreateStudyguide)

    return router
}