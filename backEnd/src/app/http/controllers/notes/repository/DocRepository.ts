import agenda from "@/app/bootstrap/agenda/agenda";
import { Doc } from "@/app/models/docSchema";
import { Note } from "@/app/models/noteSchema";
import { Types } from "mongoose";



export class DocRepository {
    private static instance: DocRepository;


    // singleton design pattern
    public static getInstance(): DocRepository {
        if (!DocRepository.instance) {
            DocRepository.instance = new DocRepository();
        }
        return DocRepository.instance;
    }


    async createDoc(docProps: { fileName: string, fileData?: Buffer, userId: string, noteId: Types.ObjectId,title?:string ,source_type?:string},

    ) {


        const doc = new Doc({
            ...docProps
        })

        const newDoc = await doc.save()

        await Note.findByIdAndUpdate(docProps.noteId, { $push: { docs: newDoc._id } });
        if (docProps.title?.trim()) {
            await Note.findOneAndUpdate(
                {
                    _id: docProps.noteId,
                    userId: docProps.userId,
                    title: "untitled notebook",
                },
                { $set: { title: docProps.title.trim() } },
            );
        }

        return newDoc.toObject()

    }


     async updateSummary2(props: { docId:any,userId: string, noteId: string, summary: string }) {

        const { userId, noteId,docId } = props
        const row = await Doc.findOneAndUpdate({_id:docId, userId, noteId }, {
            $set: { summary: props.summary }
        }, { new: true, runValidators: true })

        

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }


    async updateSummary(props: { userId: string, noteId: string, summary: string }) {

        const { userId, noteId } = props
        const row = await Doc.findOneAndUpdate({ userId, noteId }, {
            $set: { summary: props.summary }
        }, { new: true, runValidators: true })

        

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }

async updateBriefingDoc2(props: {_id:string, userId: string, noteId: string, briefingDoc: string }) {

        const { userId, noteId,_id } = props
        const row = await Doc.findOneAndUpdate({_id, userId, noteId }, {
            $set: { briefingDoc: props.briefingDoc }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }

    async updateBriefingDoc(props: { userId: string, noteId: string, briefingDoc: string }) {

        const { userId, noteId } = props
        const row = await Doc.findOneAndUpdate({ userId, noteId }, {
            $set: { briefingDoc: props.briefingDoc }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }


     async updateFaq2(props: {_id:string, userId: string, noteId: string, faq: string }) {

        const { userId, noteId ,_id} = props
        const row = await Doc.findOneAndUpdate({ _id,userId, noteId }, {
            $set: { faq: props.faq }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }


    async updateFaq(props: { userId: string, noteId: string, faq: string }) {

        const { userId, noteId } = props
        const row = await Doc.findOneAndUpdate({ userId, noteId }, {
            $set: { faq: props.faq }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }

    async updateStudyGuide2(props: {_id:string, userId: string, noteId: string, studyGuide: string }) {

        const { userId, noteId,_id } = props
        const row = await Doc.findOneAndUpdate({ _id,userId, noteId }, {
            $set: { studyGuide: props.studyGuide }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }

    async updateStudyGuide(props: { userId: string, noteId: string, studyGuide: string }) {

        const { userId, noteId } = props
        const row = await Doc.findOneAndUpdate({ userId, noteId }, {
            $set: { studyGuide: props.studyGuide }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }

    async updateMindMap(props: { userId: string, noteId: string, mindMap: string }) {

        const { userId, noteId } = props
        const row = await Doc.findOneAndUpdate({ userId, noteId }, {
            $set: { mindMap: props.mindMap }
        }, { new: true, runValidators: true })

        if (!row) {
            throw new Error('No doc found')
        }

        return row
    }


    async getSingleDoc(props: { userId: string, noteId: string }) {
        const doc = await Doc.findOne({ ...props }).select("+fileData")
        return doc
    }

    async getSingleDoc2(props: { _id:string,userId: string, noteId: string }) {

        const doc = await Doc.findOne({ ...props }).select("+fileData")
        return doc
    }
}
