import { Router } from "express"
import { getBriefingDoc } from "../briefingdoc/getBriefingDoc"
import { updateOrCreateBriefingDoc } from "../briefingdoc/updateOrCreateBriefingDoc"


export function briefingRoutes(router:Router){

    router.post('/notes/briefingdoc',getBriefingDoc)
    // router.put('/notes/briefing-doc',updateOrCreateBriefingDoc)

    return router
}