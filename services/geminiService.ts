import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, UploadedFile } from "../types";

// Schema definition for structured output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Un resumen completo y bien estructurado de los documentos proporcionados, en formato Markdown.",
    },
    quizzes: {
      type: Type.ARRAY,
      description: "Una lista de temas extraídos de los documentos, cada uno con su cuestionario.",
      items: {
        type: Type.OBJECT,
        properties: {
          topic: {
            type: Type.STRING,
            description: "El título del tema evaluado.",
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: "La pregunta del cuestionario.",
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "4 opciones de respuesta posibles.",
                },
                correctAnswerIndex: {
                  type: Type.INTEGER,
                  description: "El índice (0-3) de la respuesta correcta en el array de opciones.",
                },
                explanation: {
                  type: Type.STRING,
                  description: "Una breve explicación de por qué la respuesta es correcta.",
                },
              },
              required: ["text", "options", "correctAnswerIndex", "explanation"],
            },
          },
        },
        required: ["topic", "questions"],
      },
    },
  },
  required: ["summary", "quizzes"],
};

export const analyzeDocuments = async (files: UploadedFile[]): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key no encontrada. Por favor configura tu entorno.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare parts for the model
  const parts: any[] = [];

  for (const f of files) {
    if (f.mimeType.startsWith('text/')) {
      // For text files, we decode the base64 content and send it as a text part
      try {
        const binaryString = atob(f.base64 || "");
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const textContent = new TextDecoder().decode(bytes);
        parts.push({ text: `--- INICIO DOCUMENTO DE TEXTO: ${f.file.name} ---\n${textContent}\n--- FIN DOCUMENTO ---\n` });
      } catch (e) {
        console.error(`Error decoding text file ${f.file.name}:`, e);
        // Fallback to inlineData if decoding fails, though highly unlikely for text/plain
        parts.push({
          inlineData: {
            mimeType: f.mimeType,
            data: f.base64 || "",
          },
        });
      }
    } else {
      // For PDF and Images, use inlineData
      parts.push({
        inlineData: {
          mimeType: f.mimeType,
          data: f.base64 || "",
        },
      });
    }
  }

  // Add the text prompt
  parts.push({
    text: `Analiza los documentos adjuntos.
    1. Genera un resumen detallado y educativo del contenido.
    2. Identifica los temas principales y crea un cuestionario de evaluación (quiz) para cada tema.
    3. Asegúrate de que las preguntas sean desafiantes pero justas.
    
    Responde estrictamente en formato JSON según el esquema proporcionado.`,
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: {
        role: "user",
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "Eres un profesor experto y analista de documentos. Tu objetivo es ayudar a los estudiantes a comprender y evaluar su conocimiento sobre los materiales subidos. Responde siempre en Español.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No se generó respuesta del modelo.");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing documents:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};