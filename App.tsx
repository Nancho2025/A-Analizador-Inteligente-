import React, { useState } from 'react';
import { UploadedFile, AppStatus, AnalysisResult } from './types';
import FileUploader from './components/FileUploader';
import SummaryView from './components/SummaryView';
import QuizView from './components/QuizView';
import Button from './components/Button';
import { fileToBase64, analyzeDocuments } from './services/geminiService';
import { Sparkles, Layout, BrainCircuit, FileDown, Printer, FileText } from 'lucide-react';
import { jsPDF } from "jspdf";

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'quiz'>('summary');
  
  // Quiz State lifted to App
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizShowResults, setQuizShowResults] = useState(false);

  const handleFilesAdded = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== newFiles.length) {
      alert("Algunos archivos fueron ignorados. Asegúrate de que sean PDF, JPG o PNG y pesen menos de 10MB.");
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
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let y = 20;

    // Helper to add text and advance y
    const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setTextColor(color);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin, y);
      y += (lines.length * fontSize * 0.4) + 2; 
    };

    // Header
    addText("A+ Estudia Mejor - Resultados de Evaluación", 22, true, '#2563eb');
    y += 5;
    addText(`Fecha: ${new Date().toLocaleDateString()}`, 10, false, '#64748b');
    y += 10;

    // Overall Score Calculation
    let correct = 0;
    let total = 0;
    result.quizzes.forEach((topic, tIndex) => {
      topic.questions.forEach((q, qIndex) => {
        total++;
        if (quizAnswers[`${tIndex}-${qIndex}`] === q.correctAnswerIndex) {
          correct++;
        }
      });
    });
    const percentage = Math.round((correct / total) * 100) || 0;

    addText(`Puntuación Total: ${percentage}% (${correct}/${total})`, 16, true, '#0f172a');
    y += 10;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Content
    result.quizzes.forEach((quiz, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      
      addText(`Tema ${i + 1}: ${quiz.topic}`, 14, true, '#1e293b');
      y += 5;

      quiz.questions.forEach((q, j) => {
        if (y > 250) { doc.addPage(); y = 20; }
        
        const answerKey = `${i}-${j}`;
        const selected = quizAnswers[answerKey];
        const isCorrect = selected === q.correctAnswerIndex;
        
        // Question
        addText(`${j + 1}. ${q.text}`, 11, true, '#334155');
        y += 2;

        // Options
        q.options.forEach((opt, k) => {
           let prefix = "O ";
           let color = "#475569"; // default slate
           let fontStyle = "normal";

           if (k === q.correctAnswerIndex) {
               prefix = "✓ "; // Checkmark for correct
               color = "#16a34a"; // green
               fontStyle = "bold";
           } else if (k === selected && k !== q.correctAnswerIndex) {
               prefix = "X "; // X for incorrect selection
               color = "#dc2626"; // red
           } else if (k === selected) {
              // Selected and correct is handled by first if, usually
              // But just in case
              prefix = "✓ ";
              color = "#16a34a";
           }

           // Indent options
           if (y > 280) { doc.addPage(); y = 20; }
           
           doc.setFontSize(10);
           doc.setFont("helvetica", fontStyle);
           doc.setTextColor(color);
           const optLines = doc.splitTextToSize(`${prefix}${opt}`, maxWidth - 10);
           doc.text(optLines, margin + 5, y);
           y += (optLines.length * 5) + 2; 
        });

        // Explanation
        y += 2;
        if (y > 280) { doc.addPage(); y = 20; }
        // Background for explanation
        doc.setFillColor(241, 245, 249); // slate-100
        // Simple rect approximation
        // doc.rect(margin, y - 4, maxWidth, 15, 'F'); 
        addText(`Explicación: ${q.explanation}`, 9, false, '#475569');
        y += 8;
      });
      y += 5; // Space between topics
    });

    doc.save("a-mas-estudia-mejor-evaluacion.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-lg">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
              A+ Estudia Mejor
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             {status === AppStatus.COMPLETED && (
               <button 
                 onClick={() => {
                   setStatus(AppStatus.IDLE);
                   setResult(null);
                   setFiles([]);
                   setQuizAnswers({});
                   setQuizShowResults(false);
                 }}
                 className="text-sm text-slate-500 hover:text-blue-600 font-medium"
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
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mb-4">
                Transforma documentos en conocimiento
              </h2>
              <p className="text-lg text-slate-600">
                Sube tus PDFs o imágenes. Nuestra IA generará un resumen estructurado y un quiz personalizado para evaluar tu aprendizaje.
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
              <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={20} className="text-blue-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-800">Analizando documentos...</h3>
                <p className="text-slate-500 mt-2">Esto puede tomar unos segundos.</p>
              </div>
            )}
          </div>
        )}

        {/* State: COMPLETED (Results View) */}
        {status === AppStatus.COMPLETED && result && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Toolbar: Tabs & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 no-print">
              
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'summary' 
                      ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layout size={18} />
                  Resumen
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'quiz' 
                      ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BrainCircuit size={18} />
                  Evaluación
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'quiz' && quizShowResults && (
                   <Button variant="outline" onClick={handleDownloadQuizPDF} className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                    <FileText size={18} className="mr-2" />
                    Descargar Resultados PDF
                  </Button>
                )}
                {activeTab === 'summary' && (
                  <Button variant="outline" onClick={handleDownloadTxt} className="bg-white text-slate-600 hover:text-blue-600">
                    <FileDown size={18} className="mr-2" />
                    TXT
                  </Button>
                )}
                 {/* Universal Print Button */}
                <Button variant="outline" onClick={() => window.print()} className="bg-white text-slate-600 hover:text-blue-600">
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