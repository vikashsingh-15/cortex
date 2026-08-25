import { createSlice, configureStore } from '@reduxjs/toolkit'

export const addSourceSlice= createSlice({
    name: 'noteCreation',
    initialState: {
        modal: false,
    },
    reducers: {
        toggleAddSourceNoteModal: state => {

            state.modal=!state.modal
        },
        closeAddSourceNoteModal: state => {
            state.modal = false
        },
       

    }
})

export const { toggleAddSourceNoteModal, closeAddSourceNoteModal } = addSourceSlice.actions


export default addSourceSlice.reducer
