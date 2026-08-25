import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoveLeft, Loader2, } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router";
import { updateNote } from "@/api/notes";
import { useEffect } from "react";

// Schema validation with Zod
const editNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

type EditNoteFormValues = z.infer<typeof editNoteSchema>;
interface EditNoteProps {
  note?: { _id: string; title: string };
  //   onSave: (data: EditNoteFormValues) => Promise<void>;
}

export const EditNote = ({ note }: EditNoteProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<EditNoteFormValues>({
    resolver: zodResolver(editNoteSchema),
    defaultValues: {
      title: "",
    },
  });



  // 🧠 When note data changes (e.g., from API), update the form value
  useEffect(() => {
    if (note?.title) {
      setValue("title", note.title)
    }
  }, [note, setValue])


  // Submit only on blur
  const handleBlur = async () => {
    const data = getValues();
    if (!errors.title) {
      //   await onSave(data);
      await updateNote(note?._id as string, data?.title)
    }
  };

  return (
    <div className="flex w-[clamp(15rem,36vw,34rem)] min-w-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-2 py-1 shadow-sm backdrop-blur-sm transition-shadow focus-within:border-indigo-200 focus-within:shadow-md">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          to="/notes"
          aria-label="Back to notes"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
        >
          <MoveLeft size={18} />
        </Link>
        {/* <span style={{ fontSize: "3rem", lineHeight: "1.2" }}>🧠✨</span> */}
        <div className="min-w-0 flex-1">

          <Input
            id="title"
            {...register("title")}
            onBlur={handleBlur}
            className="h-9 w-full border-0 bg-transparent px-1 text-base font-semibold text-slate-800 shadow-none focus-visible:border-0 focus-visible:ring-0"
          />

          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>
      </div>

    </div>
  );
};
