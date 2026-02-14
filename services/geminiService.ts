import { GoogleGenAI } from "@google/genai";
import { Tank } from "../types";

export const getConsumptionAnalysis = async (tank: Tank): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Erro: Chave de API não configurada. Por favor, configure a chave da API do Gemini.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Format history for the prompt
    const historySummary = tank.history.slice(-14).map(h => 
      `Data: ${h.timestamp.split('T')[0]}, Nível: ${h.level.toFixed(0)}L`
    ).join('\n');

    const prompt = `
      Atue como um especialista em logística de combustível e gestão de frota.
      Analise os dados recentes do tanque "${tank.name}" (Capacidade: ${tank.capacity}L).
      
      Histórico (últimos 14 dias):
      ${historySummary}

      Forneça um relatório curto e direto em português (Markdown) contendo:
      1. Padrão de consumo médio diário estimado.
      2. Previsão de quando será necessário o próximo reabastecimento.
      3. Alguma anomalia detectada (ex: quedas bruscas que podem indicar vazamento ou roubo)?
      4. Recomendação de otimização.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a análise no momento.";

  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "Ocorreu um erro ao gerar a análise inteligente. Tente novamente mais tarde.";
  }
};