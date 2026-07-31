# -*- coding: utf-8 -*-
"""
Fase 2: Preparación y Limpieza de Datos Académicos
===================================================
Pipeline completo: Limpieza → Feature Engineering → Merge → Exportación

Datasets:
  - dataset_LMS_2025_2S.xlsx  (74,464 filas × 25 cols) — Logs de actividad LMS
  - dataset_sicoa_2025.xlsx   (4,000 filas × 48 cols)  — Registros académicos SICOA

Autor: Proyecto de Investigación - Ayudantía
Fecha: 2025
"""

import pandas as pd
import numpy as np
import sys
import io
import os
from datetime import datetime

# Fix encoding para Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ============================================================================
# CONFIGURACION
# ============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LMS_FILE = os.path.join(BASE_DIR, "dataset_LMS_2025_2S.xlsx")
SICOA_FILE = os.path.join(BASE_DIR, "dataset_sicoa_2025.xlsx")
OUTPUT_CSV = os.path.join(BASE_DIR, "dataset_procesado.csv")
OUTPUT_XLSX = os.path.join(BASE_DIR, "dataset_procesado.xlsx")
REPORTE_FILE = os.path.join(BASE_DIR, "reporte_calidad.md")

# ============================================================================
# UTILIDADES
# ============================================================================
def print_section(title):
    """Imprime un encabezado de seccion."""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")

def print_step(step):
    """Imprime un paso del pipeline."""
    print(f"\n  >> {step}")

def dataset_info(df, name):
    """Muestra info basica de un DataFrame."""
    nulls = df.isnull().sum()
    null_cols = nulls[nulls > 0]
    print(f"  {name}: {df.shape[0]} filas x {df.shape[1]} columnas")
    if len(null_cols) > 0:
        print(f"  Columnas con nulos: {dict(null_cols)}")
    else:
        print(f"  Sin valores nulos")

# ============================================================================
# PASO 1: LIMPIEZA DEL DATASET LMS
# ============================================================================
def limpiar_lms(df):
    """
    Limpieza del dataset LMS:
    1. Eliminar columnas vacias/constantes
    2. Filtrar solo estudiantes
    3. Parsear timestamps
    4. Tipificar categoricas
    """
    print_section("PASO 1: LIMPIEZA DATASET LMS")
    print_step(f"Shape original: {df.shape}")

    # 1.1 Eliminar columnas vacias y constantes
    cols_eliminar = ['observacion', 'contexto', 'ip_anon', 'periodo']
    cols_presentes = [c for c in cols_eliminar if c in df.columns]
    df = df.drop(columns=cols_presentes)
    print_step(f"Columnas eliminadas (vacias/constantes): {cols_presentes}")

    # 1.2 Filtrar solo estudiantes (eliminar tutores)
    n_antes = len(df)
    df = df[df['tipo_usuario'] == 'Estudiante'].copy()
    n_tutores = n_antes - len(df)
    print_step(f"Filas de tutores eliminadas: {n_tutores}")
    
    # Eliminar columna tipo_usuario (ahora es constante)
    df = df.drop(columns=['tipo_usuario'])

    # 1.3 Parsear timestamps
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['fecha'] = df['timestamp'].dt.date
    df['hora_num'] = df['timestamp'].dt.hour + df['timestamp'].dt.minute / 60.0

    # Franja horaria
    def franja_horaria(hora):
        if 6 <= hora < 12:
            return 'manana'
        elif 12 <= hora < 18:
            return 'tarde'
        elif 18 <= hora < 24:
            return 'noche'
        else:
            return 'madrugada'

    df['franja_horaria'] = df['timestamp'].dt.hour.apply(franja_horaria)
    print_step("Timestamp parseado: fecha, hora_num, franja_horaria creadas")

    # 1.4 Tipificar categoricas
    cols_cat = ['evento', 'accion', 'componente', 'recurso', 'navegador',
                'dispositivo', 'sistema_operativo', 'dia_semana', 'estado']
    for col in cols_cat:
        if col in df.columns:
            df[col] = df[col].astype('category')
    print_step(f"Columnas categorizadas: {cols_cat}")

    print_step(f"Shape final LMS limpio: {df.shape}")
    dataset_info(df, "LMS limpio")

    return df


# ============================================================================
# PASO 2: LIMPIEZA DEL DATASET SICOA
# ============================================================================
def limpiar_sicoa(df):
    """
    Limpieza del dataset SICOA:
    1. Eliminar columnas vacias/constantes
    2. Tratar nulos
    3. Parsear fechas y calcular edad
    4. Codificar variables binarias
    5. Tipificar categoricas
    """
    print_section("PASO 2: LIMPIEZA DATASET SICOA")
    print_step(f"Shape original: {df.shape}")

    # 2.1 Eliminar columnas vacias y constantes
    cols_eliminar = ['recuperacion', 'periodo', 'periodo_titulacion',
                     'asignaturas_malla', 'periodo_inicio']
    cols_presentes = [c for c in cols_eliminar if c in df.columns]
    df = df.drop(columns=cols_presentes)
    print_step(f"Columnas eliminadas (vacias/constantes): {cols_presentes}")

    # 2.2 Tratar nulos
    # fecha_titulacion: crear flag binario
    df['tiene_titulacion'] = df['fecha_titulacion'].notna().astype(int)
    print_step(f"tiene_titulacion creada (1={df['tiene_titulacion'].sum()}, 0={len(df)-df['tiene_titulacion'].sum()})")

    # Notas de titulacion: mantener como NaN (decision aprobada)
    notas_tit = ['nota_record', 'nota_trabajo', 'nota_sustentacion', 'promedio_grado']
    for col in notas_tit:
        if col in df.columns:
            nulos = df[col].isnull().sum()
            print_step(f"  {col}: {nulos} nulos mantenidos como NaN (no titulados)")

    # enfermedad: nulos -> 'Ninguna'
    df['enfermedad'] = df['enfermedad'].fillna('Ninguna')
    print_step(f"enfermedad: nulos imputados como 'Ninguna'")

    # dificultad_aprendizaje: nulos -> 'Ninguna'
    df['dificultad_aprendizaje'] = df['dificultad_aprendizaje'].fillna('Ninguna')
    print_step(f"dificultad_aprendizaje: nulos imputados como 'Ninguna'")

    # 2.3 Parsear fechas y calcular edad
    df['fecha_nacimiento'] = pd.to_datetime(df['fecha_nacimiento'], errors='coerce')
    fecha_ref = pd.Timestamp('2025-09-01')  # Inicio del periodo 2025-2S
    df['edad'] = ((fecha_ref - df['fecha_nacimiento']).dt.days / 365.25).round(0)
    print_step(f"edad calculada: media={df['edad'].mean():.1f}, rango=[{df['edad'].min():.0f}-{df['edad'].max():.0f}]")

    # 2.4 Codificar variables binarias
    mapa_binario = {
        'matricula_vigente': {'Sí': 1, 'Si': 1, 'No': 0},
        'beca': {'Sí': 1, 'Si': 1, 'No': 0},
        'vulnerabilidad': {'Sí': 1, 'Si': 1, 'No': 0},
    }
    for col, mapa in mapa_binario.items():
        if col in df.columns:
            df[col] = df[col].map(mapa).fillna(df[col])
            print_step(f"{col} codificada: {df[col].value_counts().to_dict()}")

    # 2.5 Tipificar categoricas
    cols_cat = ['estado_estudiante', 'modalidad_titulacion', 'genero', 'etnia',
                'canton_procedencia', 'provincia_procedencia', 'sector_procedencia',
                'canton_residencia', 'provincia_residencia', 'sector_residencia',
                'enfermedad', 'tipo_beca', 'dificultad_aprendizaje', 'nombre_asignatura']
    for col in cols_cat:
        if col in df.columns:
            df[col] = df[col].astype('category')
    print_step(f"Columnas categorizadas: {len(cols_cat)} columnas")

    print_step(f"Shape final SICOA limpio: {df.shape}")
    dataset_info(df, "SICOA limpio")

    return df


# ============================================================================
# PASO 3: FEATURE ENGINEERING - METRICAS LMS POR ESTUDIANTE
# ============================================================================
def feature_engineering_lms(df_lms):
    """
    Agrega el dataset LMS a nivel de estudiante, generando features
    de comportamiento digital.
    """
    print_section("PASO 3: FEATURE ENGINEERING - METRICAS LMS")

    g = df_lms.groupby('codigo_usuario')

    # --- Features basicas de actividad ---
    features = pd.DataFrame()
    features['total_eventos'] = g.size()
    features['total_sesiones'] = g['sesion_id'].nunique()
    features['duracion_total_seg'] = g['duracion_seg'].sum()
    features['duracion_promedio_seg'] = g['duracion_seg'].mean().round(2)
    features['tiempo_conexion_total_min'] = g['tiempo_conexion_min'].sum()
    features['tiempo_conexion_promedio_min'] = g['tiempo_conexion_min'].mean().round(2)

    # --- Features de calificacion LMS ---
    features['calificacion_lms_promedio'] = g['calificacion_item'].mean().round(4)
    features['calificacion_lms_max'] = g['calificacion_item'].max()
    features['calificacion_lms_min'] = g['calificacion_item'].min()
    features['calificacion_lms_std'] = g['calificacion_item'].std().round(4)

    # --- Features temporales ---
    features['dias_activos'] = g['fecha'].nunique()
    features['eventos_por_dia'] = (features['total_eventos'] / features['dias_activos']).round(2)

    # --- Conteo por tipo de evento ---
    print_step("Generando conteos por tipo de evento...")
    evento_counts = df_lms.groupby(['codigo_usuario', 'evento'], observed=False).size().unstack(fill_value=0)
    evento_counts.columns = ['evt_' + c.replace(' ', '_').lower() for c in evento_counts.columns]
    features = features.join(evento_counts)

    # --- Conteo por componente ---
    print_step("Generando conteos por componente...")
    comp_counts = df_lms.groupby(['codigo_usuario', 'componente'], observed=False).size().unstack(fill_value=0)
    comp_counts.columns = ['comp_' + c.replace(' ', '_').lower() for c in comp_counts.columns]
    features = features.join(comp_counts)

    # --- Tasa de errores ---
    error_count = df_lms[df_lms['estado'] == 'Error'].groupby('codigo_usuario').size()
    features['tasa_errores'] = (error_count / features['total_eventos']).fillna(0).round(4)

    # --- Dispositivo/Navegador/SO principal (moda) ---
    print_step("Calculando dispositivo, navegador y SO principal...")
    features['dispositivo_principal'] = g['dispositivo'].agg(lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Desconocido')
    features['navegador_principal'] = g['navegador'].agg(lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Desconocido')
    features['so_principal'] = g['sistema_operativo'].agg(lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Desconocido')

    # --- Actividad fin de semana ---
    es_finde = df_lms['dia_semana'].isin(['Saturday', 'Sunday'])
    finde_count = df_lms[es_finde].groupby('codigo_usuario').size()
    features['actividad_finde'] = (finde_count / features['total_eventos']).fillna(0).round(4)

    # --- Franja horaria preferida ---
    features['franja_preferida'] = g['franja_horaria'].agg(lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'desconocida')

    # --- Diversidad de asignaturas LMS ---
    features['asignaturas_lms'] = g['codigo_asignatura'].nunique()

    # Reset index para merge
    features = features.reset_index().rename(columns={'codigo_usuario': 'id_estudiante'})

    print_step(f"Features generadas: {features.shape[1] - 1} features para {features.shape[0]} estudiantes")
    print_step(f"Features creadas: {list(features.columns[1:])}")

    return features


# ============================================================================
# PASO 4: MERGE LMS (AGREGADO) + SICOA
# ============================================================================
def merge_datasets(df_sicoa, df_features_lms):
    """
    Realiza left join de SICOA con features LMS por estudiante.
    """
    print_section("PASO 4: MERGE DATASETS")
    print_step(f"SICOA: {df_sicoa.shape}")
    print_step(f"Features LMS: {df_features_lms.shape}")

    # Left join: SICOA base, LMS features se agregan
    df_merged = df_sicoa.merge(df_features_lms, on='id_estudiante', how='left')

    # Verificar integridad
    sin_match = df_merged['total_eventos'].isnull().sum()
    print_step(f"Registros sin datos LMS: {sin_match} de {len(df_merged)}")

    print_step(f"Shape resultado merge: {df_merged.shape}")

    return df_merged


# ============================================================================
# PASO 4B: FEATURE ENGINEERING AVANZADO (POST-MERGE)
# ============================================================================
def feature_engineering_avanzado(df):
    """
    Genera features derivadas que combinan información académica (SICOA)
    con comportamiento digital (LMS) para mejorar la capacidad predictiva.
    """
    print_section("PASO 4B: FEATURE ENGINEERING AVANZADO")

    n_features_antes = df.shape[1]

    # 1. Ratio de aprobación a la primera vez
    total_aprobadas = df['aprobadas_1ra'] + df['aprobadas_2da'] + df['aprobadas_3ra']
    df['ratio_aprobadas_total'] = np.where(
        total_aprobadas > 0,
        df['aprobadas_1ra'] / total_aprobadas,
        0.0
    )
    print_step("ratio_aprobadas_total: eficiencia de aprobación en 1ra matrícula")

    # 2. Engagement score (compuesto normalizado)
    # Normalización min-max de cada componente antes de combinar
    def safe_minmax(series):
        smin, smax = series.min(), series.max()
        return (series - smin) / (smax - smin) if smax > smin else 0.0

    df['engagement_score'] = (
        safe_minmax(df['total_eventos']) * 0.3 +
        safe_minmax(df['dias_activos']) * 0.3 +
        safe_minmax(df['total_sesiones']) * 0.2 +
        safe_minmax(df['tiempo_conexion_total_min']) * 0.2
    ).round(4)
    print_step("engagement_score: indicador compuesto de participación LMS")

    # 3. Tasa de entrega de tareas
    denom_entrega = df['evt_assignment_submitted'] + df['evt_assignment_viewed']
    df['tasa_entrega'] = np.where(
        denom_entrega > 0,
        df['evt_assignment_submitted'] / denom_entrega,
        0.0
    ).round(4)
    print_step("tasa_entrega: proporción de tareas entregadas vs solo vistas")

    # 4. Tasa de quizzes completados
    df['tasa_quiz_completado'] = np.where(
        df['evt_quiz_attempted'] > 0,
        df['evt_quiz_submitted'] / df['evt_quiz_attempted'],
        0.0
    ).round(4)
    print_step("tasa_quiz_completado: proporción de quizzes terminados vs iniciados")

    # 5. Intensidad de participación en foros
    df['intensidad_foro'] = np.where(
        df['total_eventos'] > 0,
        (df['evt_forum_post'] + df['evt_forum_viewed']) / df['total_eventos'],
        0.0
    ).round(4)
    print_step("intensidad_foro: proporción de actividad en foros")

    # 6. Rango de calificaciones LMS
    df['calificacion_lms_rango'] = (df['calificacion_lms_max'] - df['calificacion_lms_min']).round(4)
    print_step("calificacion_lms_rango: variabilidad en calificaciones LMS")

    # 7. Minutos por día activo (concentración del estudio)
    df['minutos_por_dia_activo'] = np.where(
        df['dias_activos'] > 0,
        df['tiempo_conexion_total_min'] / df['dias_activos'],
        0.0
    ).round(2)
    print_step("minutos_por_dia_activo: intensidad de estudio por sesión")

    # 8. Flag de repetidor
    df['es_repetidor'] = (df['matriculas_asignatura'] > 1).astype(int)
    print_step(f"es_repetidor: {df['es_repetidor'].sum()} estudiantes repitiendo")

    # 9. Flag de retiros previos
    df['tiene_retiros'] = (df['num_retiros'] > 0).astype(int)
    print_step(f"tiene_retiros: {df['tiene_retiros'].sum()} con retiros previos")

    # 10. Score de riesgo histórico acumulado
    df['riesgo_historico'] = (
        df['num_retiros'] * 2 +
        df['num_reingresos'] * 1.5 +
        df['aprobadas_2da'] * 0.5 +
        df['aprobadas_3ra'] * 1.0
    ).round(2)
    print_step("riesgo_historico: score compuesto de historial de riesgo")

    n_features_nuevas = df.shape[1] - n_features_antes
    print_step(f"Features nuevas generadas: {n_features_nuevas}")
    print_step(f"Shape final con features avanzadas: {df.shape}")

    return df


# ============================================================================
# PASO 5: EXPORTACION Y DOCUMENTACION
# ============================================================================
def exportar_dataset(df, reporte_antes):
    """
    Exporta el dataset procesado y genera el reporte de calidad.
    """
    print_section("PASO 5: EXPORTACION Y DOCUMENTACION")

    # 5.1 Eliminar columna fecha_titulacion (ya tenemos el flag)
    if 'fecha_titulacion' in df.columns:
        df = df.drop(columns=['fecha_titulacion'])
        print_step("Columna fecha_titulacion eliminada (reemplazada por tiene_titulacion)")

    # 5.2 Eliminar columna fecha_nacimiento (ya tenemos edad)
    if 'fecha_nacimiento' in df.columns:
        df = df.drop(columns=['fecha_nacimiento'])
        print_step("Columna fecha_nacimiento eliminada (reemplazada por edad)")

    # 5.3 Exportar
    df.to_csv(OUTPUT_CSV, index=False, encoding='utf-8-sig')
    print_step(f"Exportado: {OUTPUT_CSV}")

    df.to_excel(OUTPUT_XLSX, index=False, engine='openpyxl')
    print_step(f"Exportado: {OUTPUT_XLSX}")

    # 5.4 Generar reporte de calidad
    generar_reporte(df, reporte_antes)

    return df


def generar_reporte(df_final, reporte_antes):
    """Genera reporte de calidad en formato Markdown."""
    print_step("Generando reporte de calidad...")

    # Estadisticas finales
    total_nulos = df_final.isnull().sum()
    cols_con_nulos = total_nulos[total_nulos > 0]

    # Tipos de columnas
    numericas = df_final.select_dtypes(include=[np.number]).columns.tolist()
    categoricas = df_final.select_dtypes(include=['category', 'object']).columns.tolist()

    reporte = f"""# Reporte de Calidad - Dataset Procesado
## Fase 2: Preparacion y Limpieza de Datos Academicos

**Fecha de generacion**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## Resumen General

| Metrica | Antes (LMS) | Antes (SICOA) | Despues (Merge) |
|---------|-------------|---------------|-----------------|
| Filas | {reporte_antes['lms_rows']:,} | {reporte_antes['sicoa_rows']:,} | {df_final.shape[0]:,} |
| Columnas | {reporte_antes['lms_cols']} | {reporte_antes['sicoa_cols']} | {df_final.shape[1]} |
| Nulos totales | {reporte_antes['lms_nulls']:,} | {reporte_antes['sicoa_nulls']:,} | {df_final.isnull().sum().sum():,} |

## Transformaciones Aplicadas

### Dataset LMS (Logs de Actividad)
- Eliminadas {reporte_antes['lms_cols_eliminadas']} columnas vacias/constantes
- Eliminadas {reporte_antes['lms_filas_tutores']:,} filas de tutores
- Timestamp parseado en: fecha, hora_num, franja_horaria
- {reporte_antes['lms_features_generadas']} features de comportamiento digital generadas por estudiante

### Dataset SICOA (Registros Academicos)
- Eliminadas {reporte_antes['sicoa_cols_eliminadas']} columnas vacias/constantes
- Creada variable `tiene_titulacion` (flag binario)
- Nulos imputados: enfermedad, dificultad_aprendizaje -> "Ninguna"
- Calculada `edad` a partir de fecha_nacimiento
- Variables binarias codificadas: matricula_vigente, beca, vulnerabilidad

## Calidad del Dataset Final

### Valores Nulos
"""

    if len(cols_con_nulos) > 0:
        reporte += "\n| Columna | Nulos | % del Total |\n|---------|-------|-------------|\n"
        for col, n_nulos in cols_con_nulos.items():
            pct = (n_nulos / len(df_final)) * 100
            reporte += f"| {col} | {n_nulos:,} | {pct:.1f}% |\n"
    else:
        reporte += "\nNo hay valores nulos en el dataset final.\n"

    reporte += f"""
### Tipos de Variables

- **Numericas** ({len(numericas)}): {', '.join(numericas[:10])}{'...' if len(numericas) > 10 else ''}
- **Categoricas** ({len(categoricas)}): {', '.join(categoricas[:10])}{'...' if len(categoricas) > 10 else ''}

### Diccionario de Datos

| # | Columna | Tipo | Nulos | Unicos | Descripcion |
|---|---------|------|-------|--------|-------------|
"""

    descripciones = {
        'id_estudiante': 'Identificador anonimizado del estudiante',
        'estado_estudiante': 'Estado academico (Titulado, Matriculado, etc.)',
        'matricula_vigente': 'Matricula vigente (1=Si, 0=No)',
        'modalidad_titulacion': 'Modalidad de titulacion',
        'num_matriculas_titulacion': 'Numero de matriculas para titulacion',
        'ultimo_nivel': 'Ultimo nivel cursado',
        'niveles_aprobados': 'Niveles aprobados acumulados',
        'aprobadas_1ra': 'Asignaturas aprobadas en 1ra matricula',
        'aprobadas_2da': 'Asignaturas aprobadas en 2da matricula',
        'aprobadas_3ra': 'Asignaturas aprobadas en 3ra matricula',
        'nivel': 'Nivel actual de la asignatura',
        'codigo_asignatura': 'Codigo de la asignatura (SICOA)',
        'nombre_asignatura': 'Nombre de la asignatura',
        'matriculas_asignatura': 'Numero de matriculas en la asignatura',
        'asistencia': 'Porcentaje de asistencia',
        'primer_parcial': 'Nota del primer parcial',
        'segundo_parcial': 'Nota del segundo parcial',
        'nota_final': 'Nota final de la asignatura',
        'tutorias': 'Numero de sesiones de tutoria',
        'puntaje_admision': 'Puntaje de admision a la universidad',
        'matriculas_nivelacion': 'Matriculas en curso de nivelacion',
        'promedio_nivelacion': 'Promedio en nivelacion',
        'num_retiros': 'Numero de retiros historicos',
        'num_reingresos': 'Numero de reingresos',
        'nota_record': 'Nota del record academico (titulacion)',
        'nota_trabajo': 'Nota del trabajo de titulacion',
        'nota_sustentacion': 'Nota de sustentacion (titulacion)',
        'promedio_grado': 'Promedio de grado (titulacion)',
        'genero': 'Genero del estudiante',
        'etnia': 'Grupo etnico',
        'canton_procedencia': 'Canton de procedencia',
        'provincia_procedencia': 'Provincia de procedencia',
        'sector_procedencia': 'Sector de procedencia (Urbano/Rural)',
        'canton_residencia': 'Canton de residencia',
        'provincia_residencia': 'Provincia de residencia',
        'sector_residencia': 'Sector de residencia (Urbano/Rural)',
        'enfermedad': 'Enfermedad reportada (o Ninguna)',
        'beca': 'Tiene beca (1=Si, 0=No)',
        'tipo_beca': 'Tipo de beca',
        'vulnerabilidad': 'Situacion de vulnerabilidad (1=Si, 0=No)',
        'dificultad_aprendizaje': 'Dificultad de aprendizaje reportada (o Ninguna)',
        'tiene_titulacion': 'Flag: tiene fecha de titulacion (1=Si, 0=No)',
        'edad': 'Edad estimada al inicio del periodo',
        'total_eventos': 'Total de eventos registrados en LMS',
        'total_sesiones': 'Numero de sesiones unicas en LMS',
        'duracion_total_seg': 'Duracion total de actividad LMS (segundos)',
        'duracion_promedio_seg': 'Duracion promedio por evento LMS (segundos)',
        'tiempo_conexion_total_min': 'Tiempo total de conexion LMS (minutos)',
        'tiempo_conexion_promedio_min': 'Tiempo promedio de conexion LMS (minutos)',
        'calificacion_lms_promedio': 'Promedio de calificaciones en LMS',
        'calificacion_lms_max': 'Calificacion maxima en LMS',
        'calificacion_lms_min': 'Calificacion minima en LMS',
        'calificacion_lms_std': 'Desviacion estandar de calificaciones LMS',
        'dias_activos': 'Dias distintos con actividad en LMS',
        'eventos_por_dia': 'Promedio de eventos por dia activo',
        'tasa_errores': 'Proporcion de eventos con estado Error',
        'dispositivo_principal': 'Dispositivo mas usado en LMS',
        'navegador_principal': 'Navegador mas usado en LMS',
        'so_principal': 'Sistema operativo mas usado en LMS',
        'actividad_finde': 'Proporcion de actividad en fin de semana',
        'franja_preferida': 'Franja horaria con mayor actividad',
        'asignaturas_lms': 'Numero de asignaturas con actividad en LMS',
    }

    for i, col in enumerate(df_final.columns):
        dtype = str(df_final[col].dtype)
        nulos = df_final[col].isnull().sum()
        unicos = df_final[col].nunique()
        desc = descripciones.get(col, f'Conteo/Feature generada - {col}')
        reporte += f"| {i+1} | `{col}` | {dtype} | {nulos} | {unicos} | {desc} |\n"

    reporte += f"""
---

## Estadisticas Descriptivas (Variables Numericas)

```
{df_final.describe().round(2).to_string()}
```

---

*Reporte generado automaticamente por el pipeline de Fase 2.*
"""

    with open(REPORTE_FILE, 'w', encoding='utf-8') as f:
        f.write(reporte)

    print_step(f"Reporte generado: {REPORTE_FILE}")


# ============================================================================
# MAIN: EJECUCION DEL PIPELINE
# ============================================================================
def main():
    print_section("INICIO DEL PIPELINE - FASE 2")
    print(f"  Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # --- Cargar datos ---
    print_step("Cargando datasets...")
    lms_raw = pd.read_excel(LMS_FILE)
    sicoa_raw = pd.read_excel(SICOA_FILE)
    print_step(f"LMS cargado: {lms_raw.shape}")
    print_step(f"SICOA cargado: {sicoa_raw.shape}")

    # Guardar metricas iniciales para el reporte
    reporte_antes = {
        'lms_rows': lms_raw.shape[0],
        'lms_cols': lms_raw.shape[1],
        'lms_nulls': int(lms_raw.isnull().sum().sum()),
        'sicoa_rows': sicoa_raw.shape[0],
        'sicoa_cols': sicoa_raw.shape[1],
        'sicoa_nulls': int(sicoa_raw.isnull().sum().sum()),
    }

    # --- Paso 1: Limpieza LMS ---
    lms_limpio = limpiar_lms(lms_raw)
    reporte_antes['lms_cols_eliminadas'] = lms_raw.shape[1] - lms_limpio.shape[1] + 3  # +3 nuevas cols
    reporte_antes['lms_filas_tutores'] = lms_raw.shape[0] - lms_limpio.shape[0]

    # --- Paso 2: Limpieza SICOA ---
    sicoa_limpio = limpiar_sicoa(sicoa_raw)
    reporte_antes['sicoa_cols_eliminadas'] = sicoa_raw.shape[1] - sicoa_limpio.shape[1] + 2  # +2 nuevas cols

    # --- Paso 3: Feature Engineering ---
    features_lms = feature_engineering_lms(lms_limpio)
    reporte_antes['lms_features_generadas'] = features_lms.shape[1] - 1  # -1 por id_estudiante

    # --- Paso 4: Merge ---
    df_final = merge_datasets(sicoa_limpio, features_lms)

    # --- Paso 4B: Feature Engineering Avanzado ---
    df_final = feature_engineering_avanzado(df_final)

    # --- Paso 5: Exportacion ---
    df_final = exportar_dataset(df_final, reporte_antes)

    # --- Resumen final ---
    print_section("PIPELINE COMPLETADO")
    print_step(f"Dataset final: {df_final.shape[0]} filas x {df_final.shape[1]} columnas")
    print_step(f"Nulos totales: {df_final.isnull().sum().sum()}")
    print_step(f"Archivos generados:")
    print(f"    - {OUTPUT_CSV}")
    print(f"    - {OUTPUT_XLSX}")
    print(f"    - {REPORTE_FILE}")
    print(f"\n{'='*70}")
    print(f"  FIN")
    print(f"{'='*70}\n")


if __name__ == '__main__':
    main()
