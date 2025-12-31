import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { ArrowLeft, ArrowRight, RotateCw, Layers } from 'lucide-react';
import Button from './Button';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset state when flashcards change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 200);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const currentCard = flashcards[currentIndex];

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center p-12 text-zinc-500">
        No se generaron fichas de estudio para este documento.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Info */}
      <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium tracking-wide uppercase">
        <Layers size={16} className="text-lime-400" />
        <span>Ficha {currentIndex + 1} de {flashcards.length}</span>
      </div>

      {/* 3D Card Container */}
      <div 
        className="relative w-full aspect-[4/3] sm:aspect-[16/9] perspective-1000 cursor-pointer group"
        onClick={handleFlip}
      >
        <div 
          className={`relative w-full h-full transition-all duration-500 transform-style-3d shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front Face */}
          <div className="absolute inset-0 backface-hidden bg-zinc-900 border border-zinc-700 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            <h3 className="text-sm font-bold text-lime-400 mb-6 uppercase tracking-wider">Pregunta / Concepto</h3>
            <p className="text-xl sm:text-3xl font-bold text-white leading-tight">
              {currentCard.front}
            </p>
            <div className="mt-8 text-zinc-500 text-sm flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <RotateCw size={14} /> Haz clic para ver la respuesta
            </div>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-zinc-800 border border-lime-500/30 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-bold text-lime-400 mb-6 uppercase tracking-wider">Respuesta</h3>
            <p className="text-lg sm:text-2xl font-medium text-white leading-relaxed">
              {currentCard.back}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-6">
        <Button 
          variant="secondary" 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="rounded-full w-14 h-14 !p-0 flex items-center justify-center"
        >
          <ArrowLeft size={24} />
        </Button>

        <div className="h-2 w-32 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-lime-400 transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>

        <Button 
          variant="secondary" 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="rounded-full w-14 h-14 !p-0 flex items-center justify-center"
        >
          <ArrowRight size={24} />
        </Button>
      </div>

      <div className="text-zinc-500 text-xs">
        Tip: También puedes usar las flechas del teclado.
      </div>

      {/* Inline Styles for 3D Transform Utilities that might not be in standard Tailwind config provided */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardsView;