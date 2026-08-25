import { Router } from "express"
import { getBriefingDoc } from "../briefingdoc/getBriefingDoc"
import { updateOrCreateBriefingDoc } from "../briefingdoc/updateOrCreateBriefingDoc"
import { getMindMap } from "../mindmap/getMindMap"
import { createorUpdateMindMap } from "../mindmap/createorUpdateMindMap"


export function getMindMapRoutes(router:Router){

    router.post('/notes/mindmap',getMindMap)
    // router.put('/notes/mindmap',createorUpdateMindMap)

    return router
}