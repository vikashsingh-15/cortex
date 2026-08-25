import { Router } from "express"
import { updateOrCreateSummary } from "../summary/updateOrCreateSummary"
import { getDocSummary } from "../summary/getDocSummary"



export function summaryRoutes(router:Router){

    //  router.get('/notes/summary',getDocSummary)
    router.post('/notes/summary',getDocSummary)
    // router.put('/notes/summary',updateOrCreateSummary)

    return router
}