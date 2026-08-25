import { Router } from "express"
import { chatOverDocs } from "../ChatOverDocs"
import { getNoteChats } from "../get-note-chats"



export function chatRoutes(router:Router){

      router.post('/chats',chatOverDocs)
    router.get('/chats/history',getNoteChats)

return router
}