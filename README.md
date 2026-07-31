# 🎓 UNACH-LA — Sistema Predictivo de Riesgo Académico
## Carrera: Ciencia de Datos e Inteligencia Artificial

**Universidad Nacional de Chimborazo (UNACH) — Extensión Latacunga**  
Proyecto de Investigación — Ayudantía 2025-2026

---

## 📂 Estructura del Proyecto

```
UNACH_LA_OFICIAL/
├── 📊 proyecto ML matriculados CD 2025 2S.xlsx   ← Dataset oficial UNACH
├── 01_Diseno_e_Implementacion_ML/                ← Pipeline de datos y modelos base
├── 02_Evaluacion_de_Modelos/                     ← Evaluación y métricas ML
├── 06_Dashboard_React/                           ← Dashboard interactivo (React + Vite)
├── 07_Backend_API/                               ← Backend FastAPI
├── 08_Datos_Oficiales_UNACH/                     ← [NUEVO] Modelos con datos oficiales
├── INFORME_FINAL_COMPLETO_UNACH_LA_Actualizado.docx
├── ENTREGABLE 1 ... .docx
├── ENTREGABLE 2 ... .docx
├── ENTREGABLE 3 ... .docx
├── ENTREGABLE 4 ... .docx
└── requirements.txt
```

---

## 🚀 Cómo ejecutar

### Dashboard React
```bash
cd 06_Dashboard_React
npm install
npm run dev
```

### Backend FastAPI
```bash
cd 07_Backend_API
pip install -r requirements.txt
uvicorn main:app --reload
```

### Pipeline ML Oficial
```bash
cd 08_Datos_Oficiales_UNACH
python procesar_datos_oficiales.py
python modelos_oficiales.py
```

---

## 🤖 Modelos de IA

| Modelo | AUC-ROC | F1-Score |
|--------|---------|----------|
| XGBoost ★ | 0.512 | 0.420 |
| SVM | 0.507 | 0.280 |
| Random Forest | 0.504 | 0.226 |
| Decision Tree | 0.480 | 0.388 |
| Logistic Regression | 0.482 | 0.343 |

> ★ Mejor modelo con datos sintéticos (referencia). Los modelos con datos oficiales UNACH están en `08_Datos_Oficiales_UNACH/`.

---

## 📋 Datos Oficiales

El dataset `proyecto ML matriculados CD 2025 2S.xlsx` contiene datos reales anonimizados:

- **MatriculasCarrera**: 3,849 registros — 277 estudiantes, 5 periodos (2024-1S a 2026-1S)
- **MatriculasNivelación**: 1,260 registros — resultados de nivelación
- **PuntajePostulación**: 251 registros — puntaje SENESCYT de ingreso

---

*Proyecto de Investigación — Ayudantía UNACH-LA 2025-2026*
