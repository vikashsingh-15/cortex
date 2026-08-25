import LeftPanel from '@/components/chat/LeftPanel'
import MiddlePanel from '@/components/chat/MiddlePanel'
import RightPanel from '@/components/chat/RightPanel'
import { useEffect, useState } from 'react'
import CreateNoteModal from '@/components/note/createNoteModal/CreateNoteModal'
import { Link, useParams } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import { fetchDocOverviewAndQuestions, fetchSingleNote } from '@/store/chatSlice'
import { Trash2 } from 'lucide-react'
import UserAvatar from '@/components/base/UserAvatar'
import ThemeToggle from '@/components/base/ThemeToggle'
import DiscoveryModal from '@/components/note/DiscoveryModal'
import { EditNote } from '@/components/note/EditNote'
import { fetchNoteSourceResult } from '@/store/rightPanelSlice'
import { CreditMenu } from '@/components/base/CreditMenu'
import { fetchChats } from '@/store/chatHistorySlice'
import { getUserData } from '@/helper/getUserData'
import BuyCreditModal from '@/components/payment/BuyCreditModal'
import { fetchUserCreditAndPayment } from '@/store/creditMenuSlice'
import { deleteNote } from '@/api/notes'
import { showError, showSuccess } from '@/util/toast-notification'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function ChatPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate()


  const dispatch = useDispatch<AppDispatch>();
  const { note,loading,aiResult } = useSelector((state: RootState) => state.chat);

  const {chatHistory } = useSelector((state: RootState) => state.chatHistory);

  const {result } = useSelector((state: RootState) => state.creditMenu);

  const userData=getUserData()


  


  useEffect(() => {

    if (id) {
      dispatch(fetchSingleNote(id))
      dispatch(fetchNoteSourceResult(id))

      dispatch(fetchChats({userId:userData?._id as string,noteId:id}))

      dispatch(fetchDocOverviewAndQuestions(id))

      dispatch(fetchUserCreditAndPayment(userData?._id))



    }
  }, [dispatch, id]);

  const handleDeleteNote = async () => {
    if (!id || !userData?._id) return;

    try {
      setDeleting(true);
      const data = await deleteNote(id, userData._id);
      showSuccess(data?.message || "Notebook deleted successfully.");
      navigate('/notes');
    } catch (error: any) {
      showError(error?.message || "Unable to delete the notebook. Please try again.");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };



  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3">

        <EditNote note={note}></EditNote>
        <div className='flex shrink-0 items-center gap-4'>
          {/* header actions here */}
         
          <CreditMenu result={result} />
          <ThemeToggle />
          <UserAvatar />
          <BuyCreditModal />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-slate-500 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete notebook"
            title="Delete notebook"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </header>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this notebook?</DialogTitle>
            <DialogDescription>
              This permanently deletes “{note?.title || "this notebook"}”, its documents, and generated sources. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDeleteNote}>
              {deleting ? "Deleting…" : "Delete notebook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <main className="mt-2 flex min-h-0 flex-1 gap-2">

        <LeftPanel loading={loading} note={note} />
        <MiddlePanel aiResult={aiResult} chatHistory={chatHistory} note={note} userId={userData?._id}></MiddlePanel>
        <RightPanel noteId={id}/>

        <CreateNoteModal noteId={id} ></CreateNoteModal>
        <DiscoveryModal noteId={id}></DiscoveryModal>
        

      </main>
    </div>
  )
}

export default ChatPage
