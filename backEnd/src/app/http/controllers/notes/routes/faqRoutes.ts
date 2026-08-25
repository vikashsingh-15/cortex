import { Router } from "express"
import { getDocFaq } from "../faq/getDocFaq"
import { updateOrCreateFaq } from "../faq/createOrUpdateFaq"



export function faqRoutes(router:Router){

    router.post('/notes/faq',getDocFaq)
    // router.put('/notes/faq',updateOrCreateFaq)

    return router
}