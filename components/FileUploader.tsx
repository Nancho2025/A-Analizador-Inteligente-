import React, { useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Headphones, CheckSquare, Square } from 'lucide-react';
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

  const allSelected = files.length > 0 && selectedFileIds.length === files.length;
  const isBusy = isProcessing || isGeneratingAudio;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div 
        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-800 shadow-sm"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Sube tus documentos</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Arrastra y suelta o selecciona archivos</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">Soporta PDF, JPG, PNG, TXT (Max 10MB)</p>
          </div>
          
          <div className="relative">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.txt"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={isBusy}
            />
            <Button variant="outline" type="button" className="pointer-events-none">
              Seleccionar Archivos
            </Button>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={onToggleAll} 
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                disabled={isBusy}
              >
                 {allSelected ? <CheckSquare size={20} /> : <Square size={20} />}
              </button>
              <h4 className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                Archivos ({selectedFileIds.length}/{files.length} seleccionados)
              </h4>
            </div>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {files.map((file) => {
               const isSelected = selectedFileIds.includes(file.id);
               return (
                <li key={file.id} className={`px-4 py-3 flex items-center justify-between group transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <button 
                      onClick={() => onToggleFile(file.id)}
                      className={`flex-shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}
                      disabled={isBusy}
                    >
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      {file.mimeType.includes('pdf') || file.mimeType.includes('text') ? <FileText size={20} /> : <ImageIcon size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{file.file.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    disabled={isBusy}
                  >
                    <X size={18} />
                  </button>
                </li>
            )})}
          </ul>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-end gap-3">
             <Button 
              onClick={onGenerateAudio} 
              variant="secondary"
              isLoading={isGeneratingAudio}
              disabled={selectedFileIds.length === 0 || isBusy}
              className="w-full sm:w-auto"
            >
              <Headphones size={18} className="mr-2" />
              Crear Audio
            </Button>
            <Button 
              onClick={onAnalyze} 
              isLoading={isProcessing}
              disabled={selectedFileIds.length === 0 || isBusy}
              className="w-full sm:w-auto"
            >
              Analizar Selección
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;