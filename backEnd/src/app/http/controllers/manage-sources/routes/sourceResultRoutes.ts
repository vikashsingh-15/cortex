import { Router } from "express"
import { generateSummarySource } from "../generateSummaryFromSources"
import { getSourceResults } from "../getSources"
import { generateFAQFromSources } from "../generateFAQFromSources"
import { generateStudyFromSources } from "../generateStudyGuideFromSources"
import { generateBriefingSources } from "../generateBriefingDocFromSources"
import { generateMindMapFromSources } from "../generateMindMapFromSources"
import { readAudio } from "../readMp3Audio"

export function sourceResultRoutes(router:Router){

    router.post('/notes/add/sources',generateSummarySource)

    router.post('/notes/add/faq/sources',generateFAQFromSources)
    router.post('/notes/add/studyguide/sources',generateStudyFromSources)
    router.post('/notes/add/briefingdoc/sources',generateBriefingSources)
    router.post('/notes/add/mindmap/sources',generateMindMapFromSources)

    router.get('/notes/read/audios/:filename',readAudio)


    router.get('/notes/source/results',getSourceResults)


  


    

    return router
}