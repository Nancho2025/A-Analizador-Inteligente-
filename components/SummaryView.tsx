import React from 'react';
import { FileText, Sparkles } from 'lucide-react';

interface SummaryViewProps {
  summary: string;
}

const SummaryView: React.FC<SummaryViewProps> = ({ summary }) => {
  // Markdown rendering adapted for the new Dark Theme
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // H3: Subheaders
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold text-lime-400 mt-6 mb-3 tracking-wide">{line.replace('### ', '')}</h3>;
      }
      // H2: Section Headers
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold text-white mt-8 mb-4 pb-2 border-b border-zinc-800 flex items-center gap-2">
          {line.replace('## ', '')}
        </h2>;
      }
      // H1: Main Title
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-extrabold text-white mt-4 mb-6 leading-tight">{line.replace('# ', '')}</h1>;
      }
      // Lists
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="ml-4 list-none relative pl-5 text-zinc-300 mb-2">
            <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-lime-400 rounded-full"></span>
            {line.replace('- ', '')}
          </li>
        );
      }
      // Break
      if (line.trim() === '') {
        return <br key={index} />;
      }
      // Paragraphs
      return <p key={index} className="text-zinc-400 mb-3 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-900 rounded-3xl shadow-lg border border-zinc-800 p-8">
        
        {/* Header of the Card */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-zinc-800">
          <div className="p-3 bg-zinc-800 rounded-2xl text-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.1)]">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Resumen Inteligente</h2>
            <p className="text-sm text-zinc-500">Generado por IA basado en tus documentos</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          {renderContent(summary)}
        </div>
      </div>
    </div>
  );
};

export default SummaryView;