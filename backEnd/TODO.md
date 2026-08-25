graph db : https://js.langchain.com/docs/how_to/graph_constructing/
fronted :  https://docs.mind-elixir.com/docs/guides/use-theme or ReactFlow




-------------------------------------------------------------
- multi-vector retriever
- Corrective CRAG (FOR QA)[assistant for QA]
                        

ASSISTANT CREATION
- Chat (QA,Summarization)
-------------------------SEPERATE QUERIES
- MindMap (endpoint)
- Briefing Doc (endpoint)
- FAQ (endpoint)
- Video (endpoint)
- Study guide
- Summary

- Design Layouts
- set up expess Server

------------------------------------------------------------------
- QA/
- Graph generation



TO DO LIST
-----------

- Summary,Studyguide,FAQ,BriefingDoc,,MindMap(ref langchain),Audio[Later]
- arrange folders
- setup express server(create graph endpoint)
- google auth & account creation & drive integration
- creating Notes

- installing React ,Tailwind,Shadcn
- creating layouts(auth,notes,chat)[finish]

---------------------------------------------------------------------------------
UBS

- install mongo DB
- init React Proj
- design a mongoDB

https://medium.com/@eloutmadiabderrahim/mongodb-schema-d-23003eeb0199



-------------------------------------------------------------image generation

 app.get('/r', async (req: Request, res: Response) => {

        const uploadsDir = path.join(currentDir, "public", "uploads");
        sharp(`${uploadsDir}/1757991094027-231304505.png`)
            .resize(102, 100)
            // Convert white (#ffffff) to transparent
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .toFile(`${uploadsDir}/r.png`, (err: any, info: any) => {
                if (err) console.error(err);
                else console.log("finish resize");
            });
        res.json({ message: "server is up" })
    })



prompt to generate emoji :

Generate a single, clean emoji-style illustration of {emojiName here}.

Output exactly one {emojiName here}icon in the style of modern emojis.

Flat, vector-like design with soft lighting and subtle depth.

White background only — no gradients, no patterns.

No text and no extra objects — just the {emojiName here} emoji.

Centered composition, sharp, and instantly recognizable.





Deep research with Exa : https://colab.research.google.com/drive/1K-y9enP_Oj5BQBl6F0iOaBCxKYprhgcP#scrollTo=yyIMf2p40CEG

Deep Research with Langchain : 

Sales Agent:https://colab.research.google.com/drive/1LyIp4tchW1-MStNhY3egG8HwUDz6trlX?usp=sharing#scrollTo=Nrxugmnk91AR


==========================================================================================================================================================================================================



// npm i elevenlabs-js
