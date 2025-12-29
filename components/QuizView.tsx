import React, { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle, RefreshCw, Award, ArrowRight } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Topic Navigation - Pills Style */}
      <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
        {quizzes.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTopicIndex(idx)}
            className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${
              activeTopicIndex === idx
                ? 'bg-lime-400 text-zinc-950 shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            {q.topic}
          </button>
        ))}
      </div>

      {/* Questions Card */}
      <div className="bg-zinc-900 rounded-3xl shadow-lg border border-zinc-800 overflow-hidden relative">
        {/* Card Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{currentTopic.topic}</h3>
          <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
            {currentTopic.questions.length} PREGUNTAS
          </span>
        </div>

        <div className="p-6 space-y-10">
          {currentTopic.questions.map((question, qIndex) => {
            const answerKey = `${activeTopicIndex}-${qIndex}`;
            const selectedOption = answers[answerKey];
            const isCorrect = selectedOption === question.correctAnswerIndex;
            
            return (
              <div key={qIndex} className="space-y-4">
                <h4 className="text-lg font-medium text-white flex gap-4 leading-relaxed">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-800 text-lime-400 border border-zinc-700 flex items-center justify-center text-sm font-bold">
                    {qIndex + 1}
                  </span>
                  {question.text}
                </h4>

                <div className="space-y-3 ml-0 sm:ml-12">
                  {question.options.map((option, oIndex) => {
                    let optionClass = "border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700";
                    let icon = <div className="w-5 h-5 rounded-full border-2 border-zinc-700 mr-3 transition-colors group-hover:border-zinc-500" />;
                    
                    if (showResults) {
                      if (oIndex === question.correctAnswerIndex) {
                        // Correct Answer State
                        optionClass = "border-lime-500/50 bg-lime-500/10 text-lime-200";
                        icon = <CheckCircle className="w-5 h-5 text-lime-400 mr-3" />;
                      } else if (selectedOption === oIndex) {
                        // Wrong Selection State
                        optionClass = "border-red-500/50 bg-red-500/10 text-red-200";
                        icon = <XCircle className="w-5 h-5 text-red-500 mr-3" />;
                      } else {
                        // Neutral State in Results
                        optionClass = "border-zinc-800/50 bg-zinc-950/50 text-zinc-600 opacity-50";
                      }
                    } else if (selectedOption === oIndex) {
                      // Selected State (Pre-results)
                      optionClass = "border-lime-400 bg-zinc-800 text-white shadow-[0_0_10px_rgba(163,230,53,0.1)]";
                      icon = (
                        <div className="w-5 h-5 rounded-full border-2 border-lime-400 mr-3 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-lime-400" />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswerSelect(qIndex, oIndex)}
                        disabled={showResults}
                        className={`group w-full text-left p-4 rounded-xl border-2 flex items-center transition-all duration-200 ${optionClass}`}
                      >
                        {icon}
                        <span className="text-sm font-medium">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {showResults && (
                  <div className={`ml-0 sm:ml-12 text-sm p-4 rounded-xl border ${isCorrect ? 'bg-lime-400/10 border-lime-400/20 text-lime-200' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>
                    <p className="font-bold flex items-center gap-2 mb-1">
                      <HelpCircle size={16} className={isCorrect ? 'text-lime-400' : 'text-zinc-400'} />
                      Explicación:
                    </p>
                    <p className="opacity-90 leading-relaxed">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="sticky bottom-4 z-20">
        <div className="bg-zinc-900/90 backdrop-blur-lg p-4 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          {!showResults ? (
            <>
              <div className="text-sm text-zinc-400 font-medium">
                Responde todo antes de finalizar.
              </div>
              <Button onClick={onFinish} variant="primary" className="w-full sm:w-auto shadow-lg shadow-lime-400/20">
                Finalizar Evaluación <ArrowRight size={18} className="ml-2" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-800 rounded-xl text-lime-400 border border-zinc-700">
                    <Award size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tu Puntuación</p>
                    <p className="text-2xl font-black text-white">
                      {percentage}% <span className="text-base font-medium text-zinc-500">({score.correct}/{score.total})</span>
                    </p>
                  </div>
              </div>
              <Button onClick={handleReset} variant="secondary" className="w-full sm:w-auto">
                  <RefreshCw size={18} className="mr-2" />
                  Intentar de nuevo
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizView;