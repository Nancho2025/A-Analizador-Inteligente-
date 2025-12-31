import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { AnalysisResult, UploadedFile } from "../types";

// Schema definition for structured output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Un resumen completo y bien estructurado de los documentos proporcionados, en formato Markdown.",
    },
    flashcards: {
      type: Type.ARRAY,
      description: "Una lista de 10 a 15 tarjetas de estudio (Flashcards) para memorización rápida. Deben centrarse en definiciones clave, fechas o conceptos puros, DIFERENTES a las preguntas de opción múltiple.",
      items: {
        type: Type.OBJECT,
        properties: {
          front: {
            type: Type.STRING,
            description: "La cara frontal de la tarjeta: Un término, concepto o pregunta corta.",
          },
          back: {
            type: Type.STRING,
            description: "La cara posterior: La definición, explicación o respuesta concisa.",
          },
        },
        required: ["front", "back"],
      },
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
  required: ["summary", "quizzes", "flashcards"],
};

const getPartsFromFiles = (files: UploadedFile[]) => {
  const parts: any[] = [];
  for (const f of files) {
    // Robust MimeType detection
    let mimeType = f.mimeType;
    const lowerName = f.file.name.toLowerCase();
    
    if (!mimeType || mimeType === '' || mimeType === 'application/octet-stream') {
      if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (lowerName.endsWith('.txt')) mimeType = 'text/plain';
      else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (lowerName.endsWith('.png')) mimeType = 'image/png';
    }

    // Handle Text Files
    if (mimeType === 'text/plain' || mimeType.startsWith('text/')) {
      try {
        const binaryString = atob(f.base64 || "");
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const textContent = new TextDecoder().decode(bytes);
        parts.push({ text: `--- DOCUMENTO: ${f.file.name} ---\n${textContent}\n--- FIN DOCUMENTO ---\n` });
      } catch (e) {
        // Fallback if decoding fails
        parts.push({
          inlineData: {
            mimeType: mimeType || 'text/plain',
            data: f.base64 || "",
          },
        });
      }
    } else {
      // Handle PDF and Images
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: f.base64 || "",
        },
      });
    }
  }
  return parts;
};

export const analyzeDocuments = async (files: UploadedFile[]): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key no encontrada.");

  const ai = new GoogleGenAI({ apiKey });
  const parts = getPartsFromFiles(files);

  parts.push({
    text: `Analiza los documentos adjuntos con el objetivo de crear material de estudio completo.
    1. Genera un resumen detallado y educativo.
    2. Crea tarjetas de estudio (flashcards) para memorizar conceptos clave (distintas al quiz).
    3. Identifica los temas principales y crea un cuestionario de evaluación (quiz).
    Responde estrictamente en formato JSON según el esquema.`,
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: { role: "user", parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "Eres un profesor experto. Responde en Español.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No se generó respuesta.");
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing:", error);
    throw error;
  }
};

export const generateAudioFromDocuments = async (files: UploadedFile[]): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key no encontrada.");

  const ai = new GoogleGenAI({ apiKey });
  
  // Step 1: Generate a script from the documents using a vision/text model
  const scriptParts = getPartsFromFiles(files);
  scriptParts.push({
    text: `Tu objetivo es extraer el texto completo de los documentos proporcionados para ser leído en voz alta.
    
    INSTRUCCIONES ESTRICTAS:
    1. NO RESUMAS el contenido.
    2. NO INTERPRETES ni cambies el significado.
    3. NO agregues introducciones (ej. "Aquí está el texto") ni despedidas.
    4. Devuelve el contenido textual verbatim (palabra por palabra) tal como aparece en el documento.
    5. Solo puedes omitir elementos que no se leen naturalmente, como números de página, encabezados repetitivos o pies de página técnicos.
    
    Devuelve SOLAMENTE el texto plano del documento.`
  });

  let scriptText = "";
  try {
    const scriptResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { role: "user", parts: scriptParts },
    });
    scriptText = scriptResponse.text || "";
  } catch (e) {
    console.error("Error generating script", e);
    throw new Error("No se pudo analizar el contenido para crear el audio. Verifica que los archivos sean válidos.");
  }

  // Step 2: Convert the script to Audio using the TTS model
  if (!scriptText) throw new Error("El guion de audio estaba vacío.");

  // Safety Truncation: 
  // Large verbatim texts can exceed the TTS model's input limit or timeout.
  // We limit to ~20,000 characters to ensure stability while providing a significant amount of audio.
  const MAX_TTS_CHARS = 20000;
  if (scriptText.length > MAX_TTS_CHARS) {
    console.warn(`Script too long (${scriptText.length} chars). Truncating to ${MAX_TTS_CHARS} for TTS.`);
    scriptText = scriptText.substring(0, MAX_TTS_CHARS) + "... [Audio finalizado por límite de longitud]";
  }

  try {
    const audioResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: scriptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No se generaron datos de audio.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};