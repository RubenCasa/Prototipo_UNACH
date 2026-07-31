from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

app = FastAPI(title="SICOA AI API", description="API Backend para el Dashboard del SICOA de la UNACH")

# Configurar CORS para permitir que React se conecte
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción se pondría el dominio de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentData(BaseModel):
    id_estudiante: str
    carrera: str
    probabilidad_riesgo_ml: float
    semaforo: str
    nivel_riesgo: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "API de SICOA UNACH funcionando correctamente."}

@app.post("/api/generar-plan")
async def generar_plan(student: StudentData):
    """
    Simula la llamada a la API de OpenAI/LLM con un retraso de red,
    utilizando los datos reales enviados desde el Dashboard.
    """
    # Simulamos el tiempo de procesamiento de la IA (2 segundos)
    await asyncio.sleep(2)
    
    plan_texto = f"""[SISTEMA IA UNACH-LA: INFORME GENERATIVO DE INTERVENCIÓN]
Evaluando al estudiante ID: {student.id_estudiante} (Carrera: {student.carrera})
Probabilidad de Riesgo Predictiva: {student.probabilidad_riesgo_ml}% ({student.nivel_riesgo})

--- ANÁLISIS DE PATRONES DE RIESGO ---
El motor XGBoost ha identificado vulnerabilidades críticas en el desempeño actual del estudiante, ubicándolo en el semáforo '{student.semaforo}'. Se detectan posibles deficiencias latentes en:
- Continuidad de asistencia en asignaturas de especialidad.
- Participación activa en el Entorno Virtual de Aprendizaje (Moodle/SICOA).
- Cumplimiento de entregables en las fechas estipuladas.

--- PLAN ESTRATÉGICO DE INTERVENCIÓN A LA MEDIDA ---

Fase 1: Intervención Inmediata (24-48 horas)
1. Convocatoria Diagnóstica: El Director de Carrera debe citar al estudiante presencialmente para identificar factores externos (socioeconómicos, familiares o de salud mental).
2. Derivación a Bienestar Estudiantil: Evaluación urgente para determinar si aplica a becas de apoyo, alimentación o asistencia psicopedagógica.

Fase 2: Estrategia Académica y Acompañamiento (Próximos 15 días)
3. Tutorías de Pares (Mentoría): Emparejar al estudiante con un compañero de alto rendimiento (utilizando el módulo A/B) para acompañamiento de estudio intensivo.
4. Refuerzo Obligatorio: Inscripción automática en talleres de nivelación de materias críticas.
5. Flexibilidad Condicionada: Acordar un cronograma de nivelación para trabajos atrasados, firmado como compromiso académico.

Fase 3: Monitoreo Continuo (Cierre de Parcial)
6. Seguimiento Docente Activo: Alerta configurada en el SICOA para que los docentes reporten nuevas inasistencias de este estudiante en un máximo de 24 horas.
7. Re-evaluación Predictiva: Correr nuevamente el modelo ML al finalizar el mes para medir la reducción porcentual de su nivel de riesgo.

[Documento oficial emitido por el Motor Predictivo Institucional de la Universidad Nacional de Chimborazo (UNACH-LA)]"""

    return {"plan": plan_texto}
