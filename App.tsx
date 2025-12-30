import React, { useState, useEffect, useRef } from 'react';
import { UploadedFile, AppStatus, AnalysisResult } from './types';
import FileUploader from './components/FileUploader';
import SummaryView from './components/SummaryView';
import QuizView from './components/QuizView';
import Button from './components/Button';
import { fileToBase64, analyzeDocuments, generateAudioFromDocuments } from './services/geminiService';
import { generateQuizPDF } from './services/pdfService';
import { Sparkles, Layout, BrainCircuit, Printer, FileText, Moon, Sun, Headphones, Loader2, RotateCcw, Home, Download, ArrowLeft } from 'lucide-react';

// Helper to convert Raw PCM (Gemini Default) to WAV Blob URL
const createWavUrl = (base64: string): string => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini PCM defaults: 24kHz, 1 channel, 16-bit
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  // RIFF chunk
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + bytes.byteLength, true);
  writeString(8, 'WAVE');
  
  // fmt chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  
  // data chunk
  writeString(36, 'data');
  view.setUint32(40, bytes.byteLength, true);

  const blob = new Blob([header, bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioFinished, setAudioFinished] = useState(false);
  const [isExportingMp3, setIsExportingMp3] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'quiz'>('summary');
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Force dark mode logic for this new design, though we keep the state for potential future toggle
  const [theme, setTheme] = useState<'dark'>('dark');

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizShowResults, setQuizShowResults] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleResetApp = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setFiles([]);
    setSelectedFileIds([]);
    setAudioUrl(null);
    setAudioBase64(null);
    setAudioFinished(false);
    setQuizAnswers({});
    setQuizShowResults(false);
  };

  const handleReplayAudio = () => {
    setAudioFinished(false);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }, 50);
  };

  const handleFilesAdded = async (newFiles: File[]) => {
    // 1. Validation Phase
    const allowedExtensions = ['.pdf', '.txt', '.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 20 * 1024 * 1024; 

    const validFiles: File[] = [];
    const rejectedFiles: {name: string, reason: string}[] = [];

    newFiles.forEach(file => {
      const lowerName = file.name.toLowerCase();
      const hasValidExt = allowedExtensions.some(ext => lowerName.endsWith(ext));
      const hasValidMime = allowedMimeTypes.includes(file.type);
      
      const isValidType = hasValidExt || hasValidMime;
      const isValidSize = file.size <= maxSize;

      if (isValidType && isValidSize) {
        validFiles.push(file);
      } else {
        if (!isValidType) rejectedFiles.push({ name: file.name, reason: 'Formato no soportado' });
        if (!isValidSize) rejectedFiles.push({ name: file.name, reason: 'Excede 20MB' });
      }
    });

    if (rejectedFiles.length > 0) {
      const msg = rejectedFiles.map(f => `- ${f.name}: ${f.reason}`).join('\n');
      alert(`Algunos archivos no se pudieron subir:\n${msg}`);
    }

    // 2. Processing Phase
    const successfullyProcessedFiles: UploadedFile[] = [];

    for (const file of validFiles) {
      try {
        const base64 = await fileToBase64(file);
        successfullyProcessedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          mimeType: file.type || 'application/octet-stream',
          base64
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    if (successfullyProcessedFiles.length > 0) {
      setFiles(prev => [...prev, ...successfullyProcessedFiles]);
      setSelectedFileIds(prev => [...prev, ...successfullyProcessedFiles.map(f => f.id)]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelectedFileIds(prev => prev.filter(fid => fid !== id));
  };

  const handleToggleFile = (id: string) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map(f => f.id));
    }
  };

  const getSelectedFiles = () => files.filter(f => selectedFileIds.includes(f.id));

  const handleAnalyze = async () => {
    const targetFiles = getSelectedFiles();
    if (targetFiles.length === 0) return;

    setStatus(AppStatus.PROCESSING);
    setQuizAnswers({});
    setQuizShowResults(false);
    setResult(null); 
    setAudioUrl(null);
    setAudioBase64(null);
    setAudioFinished(false);
    
    try {
      const data = await analyzeDocuments(targetFiles);
      setResult(data);
      setStatus(AppStatus.COMPLETED);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al analizar los documentos. Por favor intenta de nuevo.");
      // Reset to IDLE on error so UI doesn't crash trying to render null result
      setStatus(AppStatus.IDLE);
    }
  };

  const handleGenerateAudio = async () => {
    const targetFiles = getSelectedFiles();
    if (targetFiles.length === 0) return;

    setStatus(AppStatus.GENERATING_AUDIO);
    setAudioFinished(false);
    
    try {
      const base64Audio = await generateAudioFromDocuments(targetFiles);
      setAudioBase64(base64Audio);
      const url = createWavUrl(base64Audio);
      setAudioUrl(url);
      
      if (result) {
        setStatus(AppStatus.COMPLETED);
      } else {
        setStatus(AppStatus.IDLE);
      }

    } catch (error) {
      console.error(error);
      alert("Hubo un error al generar el audio. Puede que el documento sea demasiado largo.");
      
      // Safety reset: If we have results, go to COMPLETED view, otherwise go back to IDLE
      if (result) {
        setStatus(AppStatus.COMPLETED);
      } else {
        setStatus(AppStatus.IDLE);
      }
    }
  };

  const handleDownloadMp3 = async () => {
    if (!audioBase64) {
        alert("No hay audio disponible para descargar.");
        return;
    }

    // @ts-ignore
    const lib = window.lamejs;
    if (!lib) {
        alert("Error: La librería de codificación MP3 no se cargó correctamente.");
        return;
    }
    
    setIsExportingMp3(true);
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const binaryString = window.atob(audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        let sampleBytes = bytes;
        if (bytes.length % 2 !== 0) {
            sampleBytes = new Uint8Array(len + 1);
            sampleBytes.set(bytes);
        }
        
        const samples = new Int16Array(sampleBytes.buffer);
        const mp3encoder = new lib.Mp3Encoder(1, 24000, 128);
        const mp3Data = [];
        const sampleBlockSize = 1152;

        for (let i = 0; i < samples.length; i += sampleBlockSize) {
            const chunk = samples.subarray(i, i + sampleBlockSize);
            const mp3buf = mp3encoder.encodeBuffer(chunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resumen-a-mas-estudia-mejor.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error exporting MP3", error);
        alert(`Error: ${error instanceof Error ? error.message : 'Desconocido'}`);
    } finally {
        setIsExportingMp3(false);
    }
  };

  const handleQuizAnswer = (key: string, index: number) => {
    setQuizAnswers(prev => ({...prev, [key]: index}));
  };

  const handleQuizFinish = () => {
    setQuizShowResults(true);
  };

  const handleQuizReset = () => {
    setQuizAnswers({});
    setQuizShowResults(false);
  };

  const handleDownloadQuizPDF = () => {
    if (!result) return;
    generateQuizPDF(result, quizAnswers);
  };

  // CONDITIONAL RENDERING BASED ON STATUS
  
  // 1. Initial / Upload State
  // Added AppStatus.ERROR here to prevent falling through to result view and crashing on null result
  if (status === AppStatus.IDLE || status === AppStatus.PROCESSING || status === AppStatus.GENERATING_AUDIO || status === AppStatus.ERROR) {
    const hasAudioButNoAnalysis = audioUrl && !result;

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
         {/* Simplified Header for Landing */}
         <div className="absolute top-6 left-6 flex items-center gap-2 opacity-50">
             <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                <BrainCircuit size={18} className="text-white" />
             </div>
             <span className="font-bold tracking-tight hidden sm:inline">A+ Estudia Mejor</span>
         </div>

         {/* Main Card Container */}
         <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
            {/* Audio Player in Landing (if generated independently) */}
            {hasAudioButNoAnalysis && (
              <div className="mb-6 p-4 bg-zinc-900 rounded-3xl border border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-lime-400/20 text-lime-400 rounded-full">
                        <Headphones size={20} />
                      </div>
                      <span className="font-bold">Audio Generado</span>
                    </div>
                    <Button onClick={handleDownloadMp3} variant="ghost" className="text-xs h-8 px-3">
                      <Download size={14} className="mr-1" /> MP3
                    </Button>
                  </div>
                  <audio ref={audioRef} controls src={audioUrl} className="w-full h-10 mb-2 accent-lime-400" />
                  <Button onClick={handleResetApp} variant="outline" className="w-full mt-2 text-xs h-9 rounded-xl">
                    <RotateCcw size={14} className="mr-2" /> Empezar de nuevo
                  </Button>
              </div>
            )}
            
            <FileUploader 
              files={files} 
              selectedFileIds={selectedFileIds}
              onFilesAdded={handleFilesAdded} 
              onRemoveFile={handleRemoveFile} 
              onToggleFile={handleToggleFile}
              onToggleAll={handleToggleAll}
              onAnalyze={handleAnalyze}
              onGenerateAudio={handleGenerateAudio}
              isProcessing={status === AppStatus.PROCESSING}
              isGeneratingAudio={status === AppStatus.GENERATING_AUDIO}
            />

            {/* Loading Overlay */}
            {(status === AppStatus.PROCESSING || status === AppStatus.GENERATING_AUDIO) && (
               <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-none">
                  <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col items-center shadow-2xl">
                    <Loader2 size={40} className="text-lime-400 animate-spin mb-4" />
                    <h3 className="text-lg font-bold text-white">
                      {status === AppStatus.GENERATING_AUDIO ? 'Generando Audio...' : 'Analizando...'}
                    </h3>
                    <p className="text-zinc-500 text-sm mt-2">Nuestra IA está trabajando.</p>
                  </div>
               </div>
            )}
         </div>
      </div>
    );
  }

  // 2. Results State (Analysis Completed)
  return (
    <div className="min-h-screen bg-zinc-950 text-white transition-colors duration-200">
      
      {/* Results Header */}
      <header className="bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={handleResetApp} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                <ArrowLeft size={20} className="text-zinc-400" />
             </button>
             <h1 className="text-lg font-bold">Resultados</h1>
          </div>
          
          <div className="flex items-center gap-2">
             <Button onClick={() => window.print()} variant="ghost" className="hidden sm:inline-flex">
                <Printer size={18} />
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-32">
        
        {/* Audio Player Card (If exists) */}
        {audioUrl && (
           <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center gap-6 animate-in slide-in-from-top-4">
              <div className="h-16 w-16 bg-lime-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                 <Headphones size={32} className="text-lime-400" />
              </div>
              <div className="flex-1 w-full text-center sm:text-left">
                 <h3 className="text-xl font-bold text-white">Resumen de Audio</h3>
                 <p className="text-zinc-400 text-sm mb-4">Escucha el resumen generado por IA.</p>
                 <audio ref={audioRef} controls src={audioUrl} className="w-full accent-lime-400" />
              </div>
              <Button onClick={handleDownloadMp3} variant="outline" isLoading={isExportingMp3} className="w-full sm:w-auto shrink-0">
                 <Download size={18} className="mr-2" /> MP3
              </Button>
           </div>
        )}

        {/* Tab Navigation - Updated to Lime Aesthetic */}
        <div className="flex justify-center mb-6">
           <div className="bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 inline-flex shadow-inner">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'summary' 
                    ? 'bg-lime-400 text-zinc-950 shadow-md transform scale-105' 
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Layout size={18} />
                Resumen
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'quiz' 
                    ? 'bg-lime-400 text-zinc-950 shadow-md transform scale-105' 
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <BrainCircuit size={18} />
                Evaluación
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'summary' ? (
             <div className="relative">
                <SummaryView summary={result!.summary} />
             </div>
          ) : (
            <>
             <div className="flex justify-end mb-4">
                {quizShowResults && (
                   <Button variant="primary" onClick={handleDownloadQuizPDF}>
                    <FileText size={18} className="mr-2" /> Guardar Resultado en PDF
                  </Button>
                )}
             </div>
             <QuizView 
                quizzes={result!.quizzes} 
                answers={quizAnswers}
                onAnswerSelect={handleQuizAnswer}
                showResults={quizShowResults}
                onFinish={handleQuizFinish}
                onReset={handleQuizReset}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;