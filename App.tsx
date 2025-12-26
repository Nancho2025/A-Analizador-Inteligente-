import React, { useState, useEffect } from 'react';
import { UploadedFile, AppStatus, AnalysisResult } from './types';
import FileUploader from './components/FileUploader';
import SummaryView from './components/SummaryView';
import QuizView from './components/QuizView';
import Button from './components/Button';
import { fileToBase64, analyzeDocuments } from './services/geminiService';
import { generateQuizPDF } from './services/pdfService';
import { Sparkles, Layout, BrainCircuit, FileDown, Printer, FileText, Moon, Sun } from 'lucide-react';

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'quiz'>('summary');
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Quiz State lifted to App
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizShowResults, setQuizShowResults] = useState(false);

  // Apply theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleFilesAdded = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== newFiles.length) {
      alert("Algunos archivos fueron ignorados. Asegúrate de que sean PDF, JPG, PNG o TXT y pesen menos de 10MB.");
    }

    const processedFiles = await Promise.all(validFiles.map(async (file) => {
      const base64 = await fileToBase64(file);
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        mimeType: file.type,
        base64
      };
    }));

    setFiles(prev => [...prev, ...processedFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setStatus(AppStatus.PROCESSING);
    setQuizAnswers({});
    setQuizShowResults(false);
    
    try {
      const data = await analyzeDocuments(files);
      setResult(data);
      setStatus(AppStatus.COMPLETED);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al analizar los documentos. Por favor intenta de nuevo.");
      setStatus(AppStatus.ERROR);
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

  const handleDownloadTxt = () => {
    if (!result) return;
    
    let content = `A+ ESTUDIA MEJOR - REPORTE DE ANÁLISIS\n`;
    content += `Generado el: ${new Date().toLocaleDateString()}\n`;
    content += `=================================================\n\n`;
    
    content += `RESUMEN\n`;
    content += `=================================================\n`;
    content += result.summary + `\n\n`;
    
    content += `EVALUACIÓN (QUIZ)\n`;
    content += `=================================================\n`;
    
    result.quizzes.forEach((quiz, i) => {
      content += `\nTEMA ${i + 1}: ${quiz.topic.toUpperCase()}\n`;
      content += `-------------------------------------------------\n`;
      quiz.questions.forEach((q, j) => {
        const answerKey = `${i}-${j}`;
        const selected = quizAnswers[answerKey];
        const isCorrect = selected === q.correctAnswerIndex;
        
        content += `\n${j + 1}. ${q.text}\n`;
        q.options.forEach((opt, k) => {
           let mark = '[ ]';
           if (k === selected) mark = '[X]'; // User selection
           if (k === q.correctAnswerIndex) mark += ' (CORRECTA)';
           
           content += `   ${mark} ${opt}\n`;
        });
        if (selected !== undefined) {
             content += `   > Tu respuesta fue: ${isCorrect ? 'Correcta' : 'Incorrecta'}\n`;
        }
        content += `   > Explicación: ${q.explanation}\n`;
      });
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'a-mas-estudia-mejor-resultado.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadQuizPDF = () => {
    if (!result) return;
    generateQuizPDF(result, quizAnswers);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-200">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 no-print transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-sm">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">
              A+ Estudia Mejor
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <button 
               onClick={toggleTheme}
               className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
               aria-label="Toggle theme"
             >
               {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
             </button>
             {status === AppStatus.COMPLETED && (
               <button 
                 onClick={() => {
                   setStatus(AppStatus.IDLE);
                   setResult(null);
                   setFiles([]);
                   setQuizAnswers({});
                   setQuizShowResults(false);
                 }}
                 className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
               >
                 Nuevo Análisis
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* State: IDLE or PROCESSING (Upload View) */}
        {status !== AppStatus.COMPLETED && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="text-center max-w-2xl mx-auto mt-8">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-4xl mb-4">
                Transforma documentos en conocimiento
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Sube tus PDFs, imágenes o archivos de texto. Nuestra IA generará un resumen estructurado y un quiz personalizado.
              </p>
            </div>

            <FileUploader 
              files={files} 
              onFilesAdded={handleFilesAdded} 
              onRemoveFile={handleRemoveFile} 
              onAnalyze={handleAnalyze}
              isProcessing={status === AppStatus.PROCESSING}
            />

            {status === AppStatus.PROCESSING && (
              <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={20} className="text-blue-600 dark:text-blue-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-800 dark:text-slate-100">Analizando documentos...</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Esto puede tomar unos segundos.</p>
              </div>
            )}
          </div>
        )}

        {/* State: COMPLETED (Results View) */}
        {status === AppStatus.COMPLETED && result && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Toolbar: Tabs & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 no-print">
              
              <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 inline-flex transition-colors">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'summary' 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Layout size={18} />
                  Resumen
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'quiz' 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <BrainCircuit size={18} />
                  Evaluación
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'quiz' && quizShowResults && (
                   <Button variant="primary" onClick={handleDownloadQuizPDF} className="bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700">
                    <FileText size={18} className="mr-2" />
                    Exportar PDF
                  </Button>
                )}
                {activeTab === 'summary' && (
                  <Button variant="outline" onClick={handleDownloadTxt} className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    <FileDown size={18} className="mr-2" />
                    TXT
                  </Button>
                )}
                 {/* Universal Print Button */}
                <Button variant="outline" onClick={() => window.print()} className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                  <Printer size={18} className="mr-2" />
                  Imprimir Vista
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
              {activeTab === 'summary' ? (
                <SummaryView summary={result.summary} />
              ) : (
                <QuizView 
                  quizzes={result.quizzes} 
                  answers={quizAnswers}
                  onAnswerSelect={handleQuizAnswer}
                  showResults={quizShowResults}
                  onFinish={handleQuizFinish}
                  onReset={handleQuizReset}
                />
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;