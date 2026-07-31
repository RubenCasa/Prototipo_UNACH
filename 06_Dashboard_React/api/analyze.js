export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY no configurada en las variables de entorno de Vercel.' });
  }

  const { fileName, rowCount, colCount, columns, sampleRows } = req.body;

  if (!columns || !sampleRows) {
    return res.status(400).json({ error: 'Datos insuficientes para el análisis.' });
  }

  const prompt = `Eres un experto en Learning Analytics y análisis de datos académicos de la Universidad Nacional de Chimborazo (UNACH). Analiza los siguientes datos académicos extraídos del archivo "${fileName}":

RESUMEN DEL DATASET:
- Total de registros: ${rowCount}
- Total de columnas: ${colCount}

COLUMNAS DETECTADAS Y ESTADÍSTICAS:
${columns.map(c => `• ${c.name} (${c.type}): ${c.nonEmpty} valores válidos, ${c.missing} faltantes${c.mean ? `, media=${c.mean}, min=${c.min}, max=${c.max}, desv=${c.stdDev}` : ''}`).join('\n')}

MUESTRA DE DATOS (primeras filas):
${JSON.stringify(sampleRows.slice(0, 8), null, 2)}

Genera un análisis completo estructurado con estas secciones:

📊 RESUMEN GENERAL
Describe brevemente el dataset y su utilidad académica.

🎯 VARIABLES CLAVE PARA PREDICCIÓN DE RIESGO
Identifica qué columnas son más relevantes para predecir riesgo académico y por qué.

⚠️ ALERTAS Y ANOMALÍAS
Señala problemas en los datos (valores faltantes, distribuciones sesgadas, outliers potenciales).

📋 RECOMENDACIONES PARA EL PROFESOR
Da al menos 5 recomendaciones específicas y accionables basadas en los patrones detectados.

💡 SUGERENCIAS DE MEJORA
Propón mejoras al proceso de recolección de datos o seguimiento estudiantil.

Responde de forma profesional, concreta y en español.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en Learning Analytics de la Universidad Nacional de Chimborazo (UNACH). Responde siempre en español con análisis profesionales y recomendaciones accionables para profesores y directivos académicos.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errData.error?.message || `Groq API error: ${response.status}`
      });
    }

    const data = await response.json();
    return res.status(200).json({
      analysis: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    return res.status(500).json({ error: `Error interno: ${error.message}` });
  }
}
