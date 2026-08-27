import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { Resend } from 'resend';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

// Fallback de modelos para Gemini
async function generatePostIdea(systemPrompt) {
  const models = ['gemini-3.6-flash', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: systemPrompt
      });
      return response.text;
    } catch (err) {
      console.warn(`⚠️ Falló ${model}:`, err?.message || err);
    }
  }
  throw new Error('No se pudo generar el contenido con Gemini.');
}

async function main() {
  console.log('🤖 1. Generando propuesta de publicación para Kinesud...');

  const systemPrompt = `Sos el Community Manager oficial de Kinesud, consultorio de salud y kinesiología en Quilmes Oeste.

INFORMACIÓN OFICIAL DE KINESUD:
- Ubicación: República del Líbano 2628, Quilmes Oeste.
- Turnos / WhatsApp: 11 3895-5502 | 11 5065-0300.
- Servicios y Especialidades: Kinesiología, Osteopatía, RPG (Reeducación Postural Global), Osteopatía Pediátrica, Rehabilitación Vestibular, Drenaje Linfático, Taping neuromuscular, MEP (Microelectrólisis Percutánea), Masoterapia y Fisioterapia.
- Obras Sociales y Prepagas que atendemos: OSDE, Swiss Medical, Galeno, Omint, Medicus, Medifé, IOMA, SanCor Salud, Centro Médico Pueyrredón, Luis Pasteur, Avalian, TV Salud, AMEBPBA, OSSEG, HOPE, DoctoRed, OSMECON Salud, AMFFA Salud, IOSE, ATSA, Jerárquicos Salud, Poder Judicial de la Nación, OSDOP, Fundación COMEI, Colegio de Escribanos PBA, APSOT, OSPEDYC, Universidad Nacional de Luján.

OBJETIVO:
Generá UNA idea de publicación para el día de hoy orientada a Instagram. Debe rotar dinámicamente entre estos pilares:
1. Lesiones comunes y cómo recuperarlas (ej: lumbalgia, fascitis plantar, tendinitis, esguinces, síndrome meniscal, dolor cervical).
2. Explicación clara de especialidades (¿Qué es la Osteopatía?, Beneficios de RPG, ¿Cuándo hacer Rehabilitación Vestibular o Drenaje Linfático?).
3. Coberturas y Obras Sociales (Recordatorios de atención por cartilla/prepagas para facilitar turnos).
4. Fechas conmemorativas o tips de bienestar y prevención postural.

REQUISITOS DEL COPY:
- Conciso, dinámico y fácil de leer en celular (párrafos cortos y emojis).
- Formato: Gancho inicial + Explicación clara/puntos clave + Llamado a la acción.
- Siempre incluir al pie la dirección (República del Líbano 2628, Quilmes Oeste) y WhatsApp de turnos (11 3895-5502 / 11 5065-0300).
- Hashtags relevantes al final (#Kinesud #KinesiologiaQuilmes #Osteopatia #RPG #QuilmesOeste #Salud).

Devolvé ÚNICAMENTE un JSON válido con esta estructura:
{
  "tema": "Título breve y descriptivo de la idea de hoy",
  "tipo_contenido": "Tipo de post sugerido (ej: Carrusel educativo, Placa informativa, Reel/Video de ejercicios, Recordatorio de cartilla)",
  "enfoque_visual": "Breve recomendación de qué mostrar o diseñar en la publicación (ej: 'Foto del profesional trabajando la zona cervical', 'Placa con logos de obras sociales', etc.)",
  "caption": "Texto completo listo para publicar en el feed de Instagram."
}`;

  const rawResult = await generatePostIdea(systemPrompt);
  const cleanJson = rawResult.replace(/```json|```/g, '').trim();
  const postData = JSON.parse(cleanJson);

  console.log(`📌 Tema del día: ${postData.tema}`);
  console.log('📧 2. Enviando idea por correo...');

  const fechaHoy = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  await resend.emails.send({
    from: 'Kinesud Bot <onboarding@resend.dev>',
    to: [process.env.DESTINATION_EMAIL],
    subject: `💡 Idea Instagram Kinesud [${fechaHoy}]: ${postData.tema}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #f97316; padding: 18px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px;">KINESUD · IDEAS DE CONTENIDO</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; text-transform: capitalize;">${fechaHoy}</p>
        </div>

        <div style="padding: 24px;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">📌 ${postData.tema}</h2>
          
          <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 15px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Formato sugerido:</strong> ${postData.tipo_contenido}</p>
            <p style="margin: 0; font-size: 13px;"><strong>Sugerencia visual:</strong> ${postData.enfoque_visual}</p>
          </div>

          <h3 style="color: #334155; margin-bottom: 8px; font-size: 15px;">📝 Copy listo para Instagram:</h3>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #334155;">${postData.caption}</div>

          <div style="margin-top: 24px; padding: 12px; background: #f1f5f9; border-radius: 6px; font-size: 12px; color: #64748b; text-align: center;">
            📍 República del Líbano 2628, Quilmes Oeste · 📲 11 3895-5502 / 11 5065-0300
          </div>
        </div>
      </div>
    `
  });

  console.log('✅ ¡Idea de publicación enviada con éxito!');
}

main().catch(console.error);