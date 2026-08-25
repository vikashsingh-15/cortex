


export function getDocChunk(docSplit:any[]){
     const docChunk = [] as any
        if (docSplit.length > 0) {
            docChunk.push(docSplit[0])
        } else {
            throw new Error('The provide Document is empty')
        }

        return docChunk
}