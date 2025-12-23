import React, { useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';
import { UploadedFile } from '../types';
import Button from './Button';

interface FileUploaderProps {
  files: UploadedFile[];
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onAnalyze: () => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  files, 
  onFilesAdded, 
  onRemoveFile, 
  onAnalyze,
  isProcessing 
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div 
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors bg-white shadow-sm"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-blue-50 rounded-full text-blue-600">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-900">Sube tus documentos</h3>
            <p className="text-slate-500 text-sm mt-1">Arrastra y suelta o selecciona archivos</p>
            <p className="text-slate-400 text-xs mt-2">Soporta PDF, JPG, PNG (Max 10MB)</p>
          </div>
          
          <div className="relative">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <Button variant="outline" type="button" className="pointer-events-none">
              Seleccionar Archivos
            </Button>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h4 className="font-medium text-slate-700 text-sm">Archivos seleccionados ({files.length})</h4>
          </div>
          <ul className="divide-y divide-slate-100">
            {files.map((file) => (
              <li key={file.id} className="px-4 py-3 flex items-center justify-between group hover:bg-slate-50">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    {file.mimeType.includes('pdf') ? <FileText size={20} /> : <ImageIcon size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveFile(file.id)}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  disabled={isProcessing}
                >
                  <X size={18} />
                </button>
              </li>
            ))}
          </ul>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button 
              onClick={onAnalyze} 
              isLoading={isProcessing}
              disabled={files.length === 0}
            >
              Analizar Documentos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;