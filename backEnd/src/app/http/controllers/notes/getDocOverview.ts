import { NextFunction, Response, Request } from "express";
import { NoteRepository } from './repository/NoteRepository';

type DocOverview = {
    questions: string[];
    doc_overview: string;
};

export async function getDocOverview(req: Request, res: Response, next: NextFunction) {
    try {

        const { noteId } = req.query as { noteId: string }
        if (!noteId)
            return res.status(422).send({ message: "provide the noteId" })



        const noteRepo = NoteRepository.getInstance()
        const noteDocs = await noteRepo.getSingleNote2(noteId)


        if (noteDocs && noteDocs?.docs?.length > 0) {
            const arrayDocs = noteDocs?.docs as any
            const aiResult = genereteQuestionsAndDocOverview({
                docs: arrayDocs,
            });
            return res.status(200).send({ aiResult })
        }
        return res.status(200).send({ aiResult: emptyOverview() })

    } catch (error) {

        next(error)

    }

}




export function genereteQuestionsAndDocOverview(props: {
    docs: Array<{ title?: string; summary?: string }>;
}): DocOverview {
    const docs = props.docs.filter(Boolean);
    const titles = docs
        .map((doc) => doc.title?.trim())
        .filter((title): title is string => Boolean(title));
    const summaries = docs
        .map((doc) => doc.summary?.trim())
        .filter((summary): summary is string => Boolean(summary));

    const overviewFromSummaries = normalizeText(summaries.join(" "));
    const sourceDescription = titles.length
        ? `This note contains ${titles.length} source${titles.length === 1 ? "" : "s"}: ${titles.join(", ")}.`
        : "This note contains uploaded sources that are ready to explore.";

    return {
        doc_overview: overviewFromSummaries || sourceDescription,
        questions: createSuggestedQuestions(titles),
    };
}

function emptyOverview(): DocOverview {
    return {
        doc_overview: "Add a source to see its overview and suggested questions.",
        questions: [],
    };
}

function normalizeText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function createSuggestedQuestions(titles: string[]): string[] {
    const subject = titles[0] || "this source";
    return [
        `What are the main ideas in ${subject}?`,
        "Which facts best support the key claims?",
        "What should I remember from this source?",
        "Can you explain the difficult concepts simply?",
        "What are the most useful practical takeaways?",
        "Create a short quiz from this material.",
    ];
}

