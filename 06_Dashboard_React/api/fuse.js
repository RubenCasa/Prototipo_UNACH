export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY no configurada en las variables de entorno de Vercel.' });
  }

  const { files } = req.body;

  if (!files || !Array.isArray(files) || files.length < 2) {
    return res.status(400).json({ error: 'Debes proporcionar al menos 2 archivos (esquemas) para la fusión.' });
  }

  const schemasDescr = files.map(f => `Archivo: "${f.name}"\nColumnas: ${f.headers.join(', ')}`).join('\n\n');

  const prompt = `Eres un experto en bases de datos y Learning Analytics de la UNACH.
Tu objetivo es analizar los esquemas (nombres de columnas) de múltiples archivos CSV/Excel, que corresponden al sistema SICOA y a Moodle, y determinar cómo unirlos de manera óptima para analizar la deserción académica.

Esquemas proporcionados:
${schemasDescr}

TUS TAREAS:
1. "joinKeyMapping": Identifica EXACTAMENTE UNA columna que sirva como identificador único del estudiante (por ejemplo: "cedula", "identificacion", "id", "email") y que esté presente conceptualmente en AMBOS archivos. Devuelve un objeto donde la clave es el nombre del archivo y el valor es el nombre de la columna en ese archivo. Ejemplo: {"sicoa.csv": "cedula", "moodle.csv": "id_estudiante"}.
2. "selectedColumns": De TODAS las columnas disponibles entre todos los archivos, selecciona un máximo de 15 columnas que sean las MÁS IMPORTANTES para predecir el riesgo académico y la deserción (notas, asistencias, conexiones, tareas, etc).

DEBES RESPONDER ÚNICAMENTE CON UN JSON VÁLIDO. No añadas texto introductorio ni markdown adicional (solo el JSON).

Formato esperado:
{
  "joinKeyMapping": { "archivo1.csv": "columna_id", "archivo2.csv": "columna_id" },
  "selectedColumns": ["columna1", "columna2", "columna3"]
}`;

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
            content: 'Eres un sistema backend automatizado que responde EXCLUSIVAMENTE con un objeto JSON válido, sin comentarios ni explicaciones adicionales.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errData.error?.message || `Groq API error: ${response.status}`
      });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    
    // Parse the JSON (clean markdown blocks if AI ignored the instruction)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('La IA no devolvió un JSON válido.');
    }
    const parsedJson = JSON.parse(jsonMatch[0]);

    return res.status(200).json(parsedJson);
  } catch (error) {
    return res.status(500).json({ error: `Error interno: ${error.message}` });
  }
}
