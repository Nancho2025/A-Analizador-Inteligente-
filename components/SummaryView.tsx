import React from 'react';
import { FileText } from 'lucide-react';

interface SummaryViewProps {
  summary: string;
}

const SummaryView: React.FC<SummaryViewProps> = ({ summary }) => {
  // Simple markdown-to-html like rendering for basic structure
  // In a production app, use react-markdown
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-6 mb-3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-4 mb-6">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 list-disc text-slate-700 dark:text-slate-300 mb-1">{line.replace('- ', '')}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 transition-colors">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
            <FileText size={24} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Resumen del Contenido</h2>
        </div>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {renderContent(summary)}
        </div>
      </div>
    </div>
  );
};

export default SummaryView;