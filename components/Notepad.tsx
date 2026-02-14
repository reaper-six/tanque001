
import React, { useState, useEffect, useRef } from 'react';
import { subscribeToNotepad, saveNotepad, archiveNote } from '../services/firebaseService';
import { StickyNote, Minimize2, Maximize2, Check, Loader2, Edit3, Save, RotateCcw } from 'lucide-react';
import { User } from '../types';

interface NotepadProps {
    currentUser?: User | null;
}

export const Notepad: React.FC<NotepadProps> = ({ currentUser }) => {
  const [content, setContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Status states
  const [status, setStatus] = useState<'idle' | 'syncing' | 'saved' | 'archiving'>('idle');

  // Ref to track if the change comes from local typing or remote DB update
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial Load & Subscribe (Sync Draft)
    const unsubscribe = subscribeToNotepad((remoteContent) => {
       // Only update from remote if user is NOT currently actively typing
       if (!isTypingRef.current) {
           setContent(remoteContent);
       }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setContent(newText);
    isTypingRef.current = true;
    setStatus('syncing');

    // Debounce Auto-Save (Draft)
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
        saveNotepad(newText);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
        isTypingRef.current = false;
    }, 1000);
  };

  // Force sync on component unmount (closing page/component)
  useEffect(() => {
      return () => {
          // If there is pending text in state, force save it as draft
          if (isTypingRef.current) {
             saveNotepad(content);
          }
      };
  }, [content]);

  const handleArchive = async () => {
      if (!content.trim()) return;
      
      setStatus('archiving');
      
      const author = currentUser ? currentUser.name : 'Operador Anônimo';
      await archiveNote(content, author);
      
      // Clear local state (remote draft is cleared by archiveNote service)
      setContent('');
      isTypingRef.current = false;
      
      setStatus('saved'); // Reusing saved status for "Done"
      setTimeout(() => setStatus('idle'), 2000);
      
      // Optionally close the notepad or keep it open for new note
  };

  return (
    <>
      {/* Trigger Button (Closed State) */}
      {!isOpen && (
        <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[60] bg-yellow-500 hover:bg-yellow-400 text-slate-900 p-4 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all transform hover:scale-110 group"
            title="Abrir Bloco de Operações"
        >
            <StickyNote size={24} />
            {/* Notification dot if there is draft content */}
            {content && <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900"></span>}
            
            <span className="hidden md:block absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Bloco de Operações
            </span>
        </button>
      )}

      {/* Expanded Notepad */}
      <div 
        className={`fixed z-[60] transition-all duration-300 ease-in-out shadow-2xl rounded-2xl overflow-hidden border border-yellow-500/30 bg-slate-900 flex flex-col ${
            isOpen 
            ? 'bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 w-auto md:w-96 h-80 md:h-[450px] opacity-100 translate-y-0' 
            : 'bottom-6 right-6 w-0 h-0 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-yellow-500/10 p-3 flex justify-between items-center border-b border-yellow-500/20 cursor-move shrink-0">
            <div className="flex items-center gap-2 text-yellow-500">
                <Edit3 size={18} />
                <span className="font-bold text-sm">Bloco de Operações</span>
            </div>
            <div className="flex items-center gap-3">
                {status === 'syncing' ? (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Sincronizando...
                    </span>
                ) : status === 'archiving' ? (
                    <span className="text-[10px] text-yellow-500 flex items-center gap-1 animate-pulse">
                        <Save size={10} /> Arquivando...
                    </span>
                ) : status === 'saved' ? (
                    <span className="text-[10px] text-emerald-500 flex items-center gap-1 transition-opacity duration-500">
                        <Check size={10} /> Salvo
                    </span>
                ) : null}
                
                <button 
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <Minimize2 size={18} />
                </button>
            </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 bg-slate-900/95 relative">
             <textarea 
                value={content}
                onChange={handleChange}
                placeholder="Digite ocorrências do turno, pendências ou observações. O texto é salvo como rascunho automaticamente..."
                className="w-full h-full bg-transparent text-slate-200 p-4 pb-16 text-sm focus:outline-none resize-none font-mono leading-relaxed custom-scrollbar"
                spellCheck={false}
             />
             
             {/* Footer Actions inside Text Area */}
             <div className="absolute bottom-3 right-3 left-3 flex justify-between items-center">
                 <div className="text-[10px] text-slate-600 flex items-center gap-1">
                    <RotateCcw size={10} /> Sincronização Auto
                 </div>
                 
                 <button
                    onClick={handleArchive}
                    disabled={!content.trim() || status === 'archiving'}
                    className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-yellow-600/20 transition-all active:scale-95"
                 >
                    {status === 'archiving' ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />}
                    Salvar Nota
                 </button>
             </div>
        </div>
      </div>
    </>
  );
};
