
import type { NoteType } from '@/types/note-types';
import { formatDate } from '@/util/formatDate';
import { truncateTitle } from '@/util/truncateTitle';

import DefaultImage from '@/assets/default.png'
import { Ellipsis } from 'lucide-react';



type NoteCardProps = {
    notebooks: NoteType[];
    viewNoteDetail:(id:string)=>void
};

const cards = [
  'bg1',
  'bg2',
  'bg3',
  'bg4',
  'bg5',
  'bg6',
  'bg7',
  'bg8',
  'bg9',
  'bg10'
  
];

export function getRandomBg() {
  const randomIndex = Math.floor(Math.random() * cards.length);
  return cards[randomIndex];
}

const NoteCard = ({ notebooks ,viewNoteDetail}: NoteCardProps) => {

    const cards=['bg-blue-50','bg-red-50','bg-orange-50','bg-green-50','bg-yellow-50','bg-gray-50']

    const renderNotebookImage = (image?: string) => {
      const value = image?.trim() || "";
      const isImageUrl = /^https?:\/\//i.test(value);
      const isEmoji = value.length > 0 && value.length <= 8 && !/[\s/\\]/.test(value);

      if (isImageUrl) {
        return (
          <img
            src={value}
            alt=""
            onError={(event) => {
              event.currentTarget.src = DefaultImage;
            }}
            className="h-20 w-20 object-contain pt-2"
          />
        );
      }

      if (isEmoji) {
        return <span className="block text-5xl leading-none">{value}</span>;
      }

      return <img src={DefaultImage} alt="" className="h-20 w-20 object-contain pt-2" />;
    };

    return (<>
        {
            notebooks.map((note: NoteType) => (

                <div
                    key={note._id}
                    className={`relative p-4 rounded-xl shadow-sm hover:shadow-md transition h-52 ${getRandomBg()}`}
                    onClick={()=>viewNoteDetail(note?._id)}
                >

                    {/* Image at top */}
                    <div className="h-24">
                      {renderNotebookImage(note.image)}
                      
                    </div>

                    {/* Content */}
                    <div className="flex flex-col  justify-between ">
                        <h2 className="text-xl  font-semibold text-gray-800 line-clamp-2">
                            {truncateTitle(note.title)}
                        </h2>
                        <p className="text-xs text-gray-500 pt-2">
                            {formatDate(note.createdAt)} • {note?.docs?.length } sources
                        </p>
                    </div>
                </div>
            ))
        } </>);
}

export default NoteCard;
