import { jsPDF } from "jspdf";
import { AnalysisResult } from "../types";

export const generateQuizPDF = (result: AnalysisResult, answers: Record<string, number>) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let y = 20;

  // Color Palette
  const COLORS = {
    primary: '#2563eb',   // Blue 600
    secondary: '#1e293b', // Slate 800
    text: '#334155',      // Slate 700
    subtext: '#64748b',   // Slate 500
    correct: '#16a34a',   // Green 600
    incorrect: '#dc2626', // Red 600
    bgLight: '#f8fafc',   // Slate 50
    border: '#e2e8f0'     // Slate 200
  };

  // Helper: Check page break
  const checkPageBreak = (heightNeeded: number) => {
    if (y + heightNeeded > pageHeight - margin) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // --- HEADER ---
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary);
  doc.text("A+ Estudia Mejor", margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.secondary);
  doc.text("Resultados de Evaluación", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(COLORS.subtext);
  doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, margin, y);
  y += 15;

  // --- SCORE CARD ---
  let correctCount = 0;
  let totalCount = 0;
  result.quizzes.forEach((topic, tIndex) => {
    topic.questions.forEach((q, qIndex) => {
      totalCount++;
      if (answers[`${tIndex}-${qIndex}`] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
  });
  const scorePercentage = Math.round((correctCount / totalCount) * 100) || 0;

  // Draw Score Box
  doc.setDrawColor(COLORS.border);
  doc.setFillColor(COLORS.bgLight);
  doc.roundedRect(margin, y, maxWidth, 35, 3, 3, 'FD');
  
  const scoreY = y + 12;
  doc.setFontSize(12);
  doc.setTextColor(COLORS.subtext);
  doc.text("Puntuación Obtenida", margin + 10, scoreY);
  
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(scorePercentage >= 60 ? COLORS.correct : COLORS.incorrect);
  doc.text(`${scorePercentage}%`, margin + 10, scoreY + 12);

  doc.setFontSize(12);
  doc.setTextColor(COLORS.secondary);
  doc.text(`${correctCount} de ${totalCount} respuestas correctas`, margin + 60, scoreY + 10);
  
  y += 50;

  // --- CONTENT ---
  result.quizzes.forEach((quiz, i) => {
    checkPageBreak(40);
    
    // Topic Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.secondary);
    doc.text(`Tema ${i + 1}: ${quiz.topic}`, margin, y);
    y += 8;
    
    // Separator line
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 30, y);
    y += 12;

    quiz.questions.forEach((q, j) => {
      const answerKey = `${i}-${j}`;
      const selected = answers[answerKey];
      
      // Question Text
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.text);
      const questionLines = doc.splitTextToSize(`${j + 1}. ${q.text}`, maxWidth);
      const questionHeight = questionLines.length * 6;
      
      checkPageBreak(questionHeight + 40); // Pre-check space for question + options
      
      doc.text(questionLines, margin, y);
      y += questionHeight + 4;

      // Options
      q.options.forEach((opt, k) => {
        const isSelected = k === selected;
        const isCorrect = k === q.correctAnswerIndex;
        
        let prefix = "O "; // Circle bullet placeholder
        let color = COLORS.subtext;
        let fontStyle = "normal";

        if (isCorrect) {
          prefix = "✓ ";
          color = COLORS.correct;
          fontStyle = "bold";
        } else if (isSelected) {
          prefix = "X "; // Incorrect selection
          color = COLORS.incorrect;
          fontStyle = "bold";
        } else if (isSelected) {
            // Should not happen given logic above, but fallback
             color = COLORS.incorrect;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", fontStyle);
        doc.setTextColor(color);
        
        const optText = `${prefix} ${opt}`;
        const optLines = doc.splitTextToSize(optText, maxWidth - 10);
        const optHeight = optLines.length * 5;
        
        checkPageBreak(optHeight);
        
        doc.text(optLines, margin + 5, y);
        y += optHeight + 2;
      });

      // Explanation Box
      y += 2;
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(COLORS.text);
      
      const explPrefix = "Explicación: ";
      const explLines = doc.splitTextToSize(explPrefix + q.explanation, maxWidth - 15);
      const explHeight = explLines.length * 4.5;
      
      checkPageBreak(explHeight + 10);
      
      // Background for explanation
      doc.setFillColor(COLORS.bgLight);
      doc.setDrawColor(COLORS.border);
      doc.rect(margin + 4, y - 3, maxWidth - 4, explHeight + 6, 'FD');
      
      doc.text(explLines, margin + 8, y + 2);
      y += explHeight + 14; // Space between questions
    });
    
    y += 10; // Space between topics
  });

  // --- FOOTER (Page Numbers) ---
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(COLORS.subtext);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
    doc.text("A+ Estudia Mejor", margin, pageHeight - 10);
  }

  doc.save("a-mas-estudia-mejor-reporte.pdf");
};