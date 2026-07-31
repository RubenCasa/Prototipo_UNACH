# Reporte de Evaluación de Modelos
## Evaluación de Modelos - Validación y Pruebas de Rendimiento

**Fecha de generación**: 2026-07-29 15:09:13
**Entregable**: Resultados de métricas y validación

---

## 1. Configuración del Experimento

| Parámetro | Valor |
|-----------|-------|
| Total de registros | 4,000 |
| Train set | 3,200 (80%) |
| Test set | 800 (20%) |
| Features | 30 |
| Validación cruzada | 5-Fold Stratified |
| Semilla aleatoria | 42 |
| Escalado | StandardScaler (LR, SVM) |

### Distribución del Target

| Clase | Train | Test | Total |
|-------|-------|------|-------|
| En riesgo (1) | 1,503 | 376 | 1,879 |
| Sin riesgo (0) | 1,697 | 424 | 2,121 |

---

## 2. Resultados de Validación Cruzada (5-Fold)

| Modelo | Accuracy | Precision | Recall | F1-Score | AUC-ROC |
|--------|----------|-----------|--------|----------|---------|
| Logistic Regression | 0.5172 ±0.0151 | 0.4787 ±0.0249 | 0.3100 ±0.0205 | 0.3761 ±0.0212 | 0.5063 ±0.0216 |
| Decision Tree | 0.5206 ±0.0239 | 0.4889 ±0.0555 | 0.1849 ±0.0852 | 0.2546 ±0.0805 | 0.5071 ±0.0245 |
| Random Forest | 0.5244 ±0.0079 | 0.4849 ±0.0239 | 0.1770 ±0.0171 | 0.2585 ±0.0163 | 0.5085 ±0.0171 |
| XGBoost | 0.5053 ±0.0136 | 0.4675 ±0.0173 | 0.3799 ±0.0180 | 0.4190 ±0.0155 | 0.5009 ±0.0184 |
| SVM | 0.5147 ±0.0158 | 0.4695 ±0.0328 | 0.2289 ±0.0234 | 0.3064 ±0.0198 | 0.5011 ±0.0249 |

---

## 3. Resultados en Conjunto de Test

| Modelo | Accuracy | Precision | Recall | F1-Score | AUC-ROC | Avg Precision | Specificity |
|--------|----------|-----------|--------|----------|---------|---------------|-------------|
| Logistic Regression | 0.4925 | 0.4380 | 0.2819 | 0.3430 | 0.4816 | 0.4545 | 0.6792 |
| Decision Tree | 0.5000 | 0.4568 | 0.3378 | 0.3884 | 0.4797 | 0.4649 | 0.6439 |
| Random Forest | 0.5125 | 0.4453 | 0.1516 | 0.2262 | 0.5043 | 0.4892 | 0.8325 |
| XGBoost **★** | 0.5162 | 0.4811 | 0.3723 | 0.4198 | 0.5125 | 0.4819 | 0.6439 |
| SVM | 0.5112 | 0.4551 | 0.2021 | 0.2799 | 0.5066 | 0.4875 | 0.7854 |

> **★ Mejor modelo por F1-Score: XGBoost**

---

## 4. Matrices de Confusión

| Modelo | TN (Verdaderos Neg.) | FP (Falsos Pos.) | FN (Falsos Neg.) | TP (Verdaderos Pos.) |
|--------|---------------------|-------------------|-------------------|----------------------|
| Logistic Regression | 288 | 136 | 270 | 106 |
| Decision Tree | 273 | 151 | 249 | 127 |
| Random Forest | 353 | 71 | 319 | 57 |
| XGBoost | 273 | 151 | 236 | 140 |
| SVM | 333 | 91 | 300 | 76 |

---

## 5. Análisis de Overfitting

| Modelo | Train Accuracy | Test Accuracy (CV) | Diferencia | Diagnóstico |
|--------|---------------|--------------------|-----------:|-------------|
| Logistic Regression | 0.5495 | 0.5172 | 0.0323 | ✅ Sin overfitting |
| Decision Tree | 0.5698 | 0.5206 | 0.0492 | ✅ Sin overfitting |
| Random Forest | 0.6620 | 0.5244 | 0.1377 | ⚡ Overfitting moderado |
| XGBoost | 0.7699 | 0.5053 | 0.2646 | ⚠️ Overfitting alto |
| SVM | 0.6851 | 0.5147 | 0.1704 | ⚠️ Overfitting alto |

---

## 6. Top-15 Variables Más Importantes

| # | Variable | Importancia |
|---|----------|-------------|
| 1 | `calificacion_lms_min` | 0.037774 |
| 2 | `es_repetidor` | 0.037661 |
| 3 | `promedio_nivelacion` | 0.037403 |
| 4 | `tiempo_conexion_promedio_min` | 0.036617 |
| 5 | `canton_procedencia` | 0.035912 |
| 6 | `num_retiros` | 0.035790 |
| 7 | `edad` | 0.035615 |
| 8 | `sector_procedencia` | 0.035020 |
| 9 | `intensidad_foro` | 0.034954 |
| 10 | `minutos_por_dia_activo` | 0.034865 |
| 11 | `evt_course_viewed` | 0.034464 |
| 12 | `enfermedad` | 0.034350 |
| 13 | `tipo_beca` | 0.034020 |
| 14 | `duracion_promedio_seg` | 0.033766 |
| 15 | `nivel` | 0.033292 |

---

## 7. Conclusiones

### Mejor Modelo: **XGBoost**

| Métrica | Valor |
|---------|-------|
| Accuracy | 0.5162 |
| Precision | 0.4811 |
| Recall | 0.3723 |
| F1-Score | 0.4198 |
| AUC-ROC | 0.5125 |

### Observaciones
- Se evaluaron 5 modelos de clasificación para predecir riesgo académico.
- La validación cruzada (5-Fold) se utilizó para estimar el rendimiento generalizado.
- Las métricas clave son: AUC-ROC (capacidad discriminativa), Precision (evitar falsos positivos),
  Recall (capturar estudiantes en riesgo), y F1-Score (balance precision-recall).
- Se generaron 9 gráficos de evaluación en la carpeta `graficos/`.

---

## 8. Gráficos Generados

| # | Archivo | Descripción |
|---|---------|-------------|
| 1 | `01_tabla_metricas.png` | Tabla comparativa de todas las métricas |
| 2 | `02_matrices_confusion.png` | Matrices de confusión por modelo |
| 3 | `03_curvas_roc.png` | Curvas ROC con AUC |
| 4 | `04_curvas_precision_recall.png` | Curvas Precision-Recall |
| 5 | `05_comparacion_metricas.png` | Barras agrupadas de métricas |
| 6 | `06_cv_boxplot.png` | Distribución CV por fold |
| 7 | `07_overfitting_check.png` | Train vs Test (overfitting) |
| 8 | `08_feature_importance.png` | Top-20 features más importantes |
| 9 | `09_radar_chart.png` | Radar chart multidimensional |

---

*Reporte generado automáticamente por el pipeline de Evaluación de Modelos.*
