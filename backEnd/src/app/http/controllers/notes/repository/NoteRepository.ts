import agenda from "@/app/bootstrap/agenda/agenda";
import { Doc } from "@/app/models/docSchema";
import { Note } from "@/app/models/noteSchema";
import { Source } from "@/app/models/sourceSchema";



export class NoteRepository {
  private static instance: NoteRepository;


  // singleton design pattern
  public static getInstance(): NoteRepository {
    if (!NoteRepository.instance) {
      NoteRepository.instance = new NoteRepository();
    }
    return NoteRepository.instance;
  }


  async createNote(noteProps: { title: string, image: string, userId: string },
    imageProps: { generateImagePrompt: string, uploadsDir: string, randomName: string }
  ) {


    const note = new Note({
      ...noteProps
    })

    const newNote = await note.save()


    agenda.now('generateImage', {
      noteId: newNote.toObject()._id,
      ...imageProps
    })
    return newNote.toObject()

  }


  
  /**
   * 
   * @param noteProps 
   * @returns 
   */
   async createNote2(noteProps: { title: string, image: string, userId: string }
  ) {


    const note = new Note({
      ...noteProps
    })

    const newNote = await note.save()

    return newNote.toObject()

  }


  async updateNotes(props: { id: string, title: string,image?:string }) {

    const updateNote = await Note.findByIdAndUpdate(props.id,
      { title: props.title,image:props?.image }, { new: true, runValidators: true });
    return updateNote
  }

  async deleteNote(props: { id: string; userId: string }) {
    const deletedNote = await Note.findOneAndDelete({
      _id: props.id,
      userId: props.userId,
    });

    if (!deletedNote) return null;

    await Promise.all([
      Doc.deleteMany({ noteId: props.id, userId: props.userId }),
      Source.deleteMany({ noteId: props.id, userId: props.userId }),
    ]);

    return deletedNote.toObject();
  }

  async getSingleNote2(noteId: string) {

    const note = await Note.findById(noteId)
      .populate({
        path: "docs",
        select: "_id title summary"
      })
      .lean();
    return note
  }

  async getSingleNote(noteId: string) {

    const note = await Note.findById(noteId)
      .populate("docs")
      .lean();
    return note
  }


  async getNoteSummary(props: { noteId: string, docId: string }) {
    const { noteId, docId } = props

    const note = await Note.findById(noteId)
      .populate({
        path: "docs",
        select: "_id title summary",
      })
      .lean();

    if (!note) throw new Error("Note not found");

    const singleDoc = note.docs.find(
      (doc: any) => doc._id.toString() === docId
    );

    

    return {
      ...note,
      docs: singleDoc ? [singleDoc] : [],
    };

  }





  async getAllNotes({
    search = "",
    page = 1,
    limit = 10,
    userId,
  }: {
    search?: string;
    page?: number;
    limit?: number;
    userId: string;
  }) {
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { userId };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }) // newest first
        .populate("docs") // pulls in docs
        .lean(),
      Note.countDocuments(filter),
    ]);

    return {
      notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


}
