import { getNoteChats, type chatHistoryType } from '@/api/notes';
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'



export const fetchChats = createAsyncThunk(
  "chats/history",
  async ({userId,noteId}:{userId:string,noteId:string}) => getNoteChats(userId,noteId)
);

type ChatState = {
  chatHistory: chatHistoryType | null|undefined;
  activeNoteId: string | null;
  loading: boolean;
  error: string | null;
};


const chatState :ChatState= {
  chatHistory: null,
  activeNoteId: null,
  loading: false,
  error: null,
};


const chatHistorySlice = createSlice({
  name: 'chatHistory',
  initialState: {
 
    ...chatState
  },
  reducers: {
    resetChatHistory: (state, action: PayloadAction<string>) => {
      state.chatHistory = null;
      state.activeNoteId = action.payload;
      state.loading = false;
      state.error = null;
    },


    addMessageInChatHistory: (state,action) => {
      if(state.chatHistory && action.payload?.noteId === state.activeNoteId){
       state.chatHistory?.chatHistory?.push(action.payload)
      }
   
    },


  },
  extraReducers: (builder) => {
    builder .addCase(fetchChats.pending, (state, action) => {
        state.chatHistory = null;
        state.activeNoteId = action.meta.arg.noteId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        if (state.activeNoteId !== action.meta.arg.noteId) return;
        state.chatHistory = action.payload;
        state.loading = false;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        if (state.activeNoteId !== action.meta.arg.noteId) return;
        state.loading = false;
        state.error = action.error.message || "Failed to fetch notes";
      });
      
  },
})

export const { addMessageInChatHistory, resetChatHistory } = chatHistorySlice.actions



export default chatHistorySlice.reducer
