import React, { useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Headphones, Sparkles, Plus, Trash2 } from 'lucide-react';
import { UploadedFile } from '../types';
import Button from './Button';

interface FileUploaderProps {
  files: UploadedFile[];
  selectedFileIds: string[];
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onToggleFile: (id: string) => void;
  onToggleAll: () => void;
  onAnalyze: () => void;
  onGenerateAudio: () => void;
  isProcessing: boolean;
  isGeneratingAudio: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  files, 
  selectedFileIds,
  onFilesAdded, 
  onRemoveFile, 
  onToggleFile,
  onToggleAll,
  onAnalyze,
  onGenerateAudio,
  isProcessing,
  isGeneratingAudio
}) => {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, [onFilesAdded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isBusy = isProcessing || isGeneratingAudio;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-full justify-between">
      
      {/* Top Section */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
            </span>
            <span className="text-lime-400 text-xs font-bold tracking-wider uppercase">Nueva Sesión</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            ¿Qué vamos a <br />
            <span className="text-zinc-500">estudiar hoy?</span>
          </h2>
        </div>

        {/* Drop Zone Card - Styled like the top card in example */}
        <div 
          className="relative group cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-lime-400 to-emerald-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-zinc-900 rounded-3xl p-8 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col items-center justify-center text-center space-y-4 min-h-[220px]">
             
             <div className="h-16 w-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-300 mb-2 group-hover:scale-110 transition-transform duration-300">
                <Upload size={32} />
             </div>
             
             <div>
               <h3 className="text-lg font-bold text-white">Sube tus documentos</h3>
               <p className="text-zinc-500 text-sm mt-1">PDF, Imágenes o Texto (Max 20MB)</p>
             </div>

             <input
                type="file"
                multiple
                accept=".pdf,application/pdf,.jpg,.jpeg,.png,image/*,.txt,text/plain"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                disabled={isBusy}
              />
          </div>
        </div>

        {/* File List - Styled like the Options List in example */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <h3 className="text-sm font-semibold text-zinc-400">Tus Archivos</h3>
              <button onClick={onToggleAll} className="text-xs text-lime-400 hover:text-lime-300 font-medium">
                {selectedFileIds.length === files.length ? 'Deseleccionar' : 'Seleccionar Todo'}
              </button>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {files.map((file) => {
                 const isSelected = selectedFileIds.includes(file.id);
                 return (
                  <div 
                    key={file.id} 
                    className={`relative p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 group ${
                      isSelected 
                        ? 'bg-zinc-900 border-lime-500/50 shadow-[0_0_10px_rgba(132,204,22,0.1)]' 
                        : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    {/* Checkbox / Selection Area */}
                    <button 
                      onClick={() => onToggleFile(file.id)}
                      className="absolute inset-0 z-0"
                    />

                    {/* Icon Box */}
                    <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                       isSelected ? 'bg-lime-400 text-zinc-900' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {file.mimeType.includes('pdf') || file.mimeType.includes('text') ? <FileText size={24} /> : <ImageIcon size={24} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
                      <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                        {file.file.name}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    {/* Delete Action */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemoveFile(file.id); }}
                      className="relative z-20 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
              )})}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions - Styled like the sticky bottom buttons */}
      <div className="mt-8 grid grid-cols-2 gap-4 pb-4">
         <Button 
          onClick={onGenerateAudio} 
          variant="secondary"
          isLoading={isGeneratingAudio}
          disabled={selectedFileIds.length === 0 || isBusy}
          className="w-full"
        >
          {!isGeneratingAudio && <Headphones size={20} className="mr-2 text-lime-400" />}
          Crear Audio
        </Button>
        <Button 
          onClick={onAnalyze} 
          variant="primary"
          isLoading={isProcessing}
          disabled={selectedFileIds.length === 0 || isBusy}
          className="w-full"
        >
          {!isProcessing && <Sparkles size={20} className="mr-2" />}
          Analizar
        </Button>
      </div>

    </div>
  );
};

export default FileUploader;