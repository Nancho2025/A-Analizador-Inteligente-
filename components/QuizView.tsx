import React, { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle, RefreshCw, Award } from 'lucide-react';
import { QuizTopic } from '../types';
import Button from './Button';

interface QuizViewProps {
  quizzes: QuizTopic[];
  answers: Record<string, number>;
  onAnswerSelect: (questionKey: string, optionIndex: number) => void;
  showResults: boolean;
  onFinish: () => void;
  onReset: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ 
  quizzes, 
  answers, 
  onAnswerSelect, 
  showResults, 
  onFinish,
  onReset 
}) => {
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  const currentTopic = quizzes[activeTopicIndex];

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (showResults) return; // Prevent changing after submit
    const key = `${activeTopicIndex}-${questionIndex}`;
    onAnswerSelect(key, optionIndex);
  };

  const calculateScore = () => {
    let correct = 0;
    let total = 0;
    quizzes.forEach((topic, tIndex) => {
      topic.questions.forEach((q, qIndex) => {
        total++;
        if (answers[`${tIndex}-${qIndex}`] === q.correctAnswerIndex) {
          correct++;
        }
      });
    });
    return { correct, total };
  };

  const score = calculateScore();
  const percentage = Math.round((score.correct / score.total) * 100) || 0;

  const handleReset = () => {
    setActiveTopicIndex(0);
    onReset();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* Topic Navigation */}
      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
        {quizzes.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTopicIndex(idx)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              activeTopicIndex === idx
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {q.topic}
          </button>
        ))}
      </div>

      {/* Questions Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{currentTopic.topic}</h3>
          <span className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600">
            {currentTopic.questions.length} Preguntas
          </span>
        </div>

        <div className="p-6 space-y-8">
          {currentTopic.questions.map((question, qIndex) => {
            const answerKey = `${activeTopicIndex}-${qIndex}`;
            const selectedOption = answers[answerKey];
            const isCorrect = selectedOption === question.correctAnswerIndex;
            
            return (
              <div key={qIndex} className="space-y-4">
                <h4 className="text-base font-medium text-slate-900 dark:text-slate-100 flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-xs font-bold mt-0.5">
                    {qIndex + 1}
                  </span>
                  {question.text}
                </h4>

                <div className="space-y-2 ml-9">
                  {question.options.map((option, oIndex) => {
                    let optionClass = "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300";
                    let icon = <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-500 mr-3" />;
                    
                    if (showResults) {
                      if (oIndex === question.correctAnswerIndex) {
                        optionClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
                        icon = <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />;
                      } else if (selectedOption === oIndex) {
                        optionClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300";
                        icon = <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />;
                      } else {
                        optionClass = "border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600 opacity-60";
                      }
                    } else if (selectedOption === oIndex) {
                      optionClass = "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600 dark:ring-blue-500";
                      icon = <div className="w-5 h-5 rounded-full border-[5px] border-blue-600 dark:border-blue-500 mr-3" />;
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswerSelect(qIndex, oIndex)}
                        disabled={showResults}
                        className={`w-full text-left p-3 rounded-lg border flex items-center transition-all ${optionClass}`}
                      >
                        {icon}
                        <span className="text-sm">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {showResults && (
                  <div className={`ml-9 text-sm p-3 rounded-lg ${isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'}`}>
                    <p className="font-semibold flex items-center gap-2">
                      <HelpCircle size={16} />
                      Explicación:
                    </p>
                    <p className="mt-1 opacity-90">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        {!showResults ? (
          <>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Responde todas las preguntas de todos los temas antes de finalizar.
            </div>
            <Button onClick={onFinish} variant="primary" className="w-full sm:w-auto">
              Finalizar y Ver Resultados
            </Button>
          </>
        ) : (
          <>
             <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Puntuación Final</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{percentage}% <span className="text-base font-normal text-slate-400 dark:text-slate-500">({score.correct}/{score.total})</span></p>
                </div>
             </div>
             <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                <RefreshCw size={18} className="mr-2" />
                Intentar de nuevo
             </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizView;