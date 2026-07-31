# Reporte de Calidad - Dataset Procesado
## Fase 2: Preparacion y Limpieza de Datos Academicos

**Fecha de generacion**: 2026-07-29 15:07:49

---

## Resumen General

| Metrica | Antes (LMS) | Antes (SICOA) | Despues (Merge) |
|---------|-------------|---------------|-----------------|
| Filas | 74,464 | 4,000 | 4,000 |
| Columnas | 25 | 48 | 89 |
| Nulos totales | 115,716 | 19,789 | 10,525 |

## Transformaciones Aplicadas

### Dataset LMS (Logs de Actividad)
- Eliminadas 5 columnas vacias/constantes
- Eliminadas 8,049 filas de tutores
- Timestamp parseado en: fecha, hora_num, franja_horaria
- 36 features de comportamiento digital generadas por estudiante

### Dataset SICOA (Registros Academicos)
- Eliminadas 5 columnas vacias/constantes
- Creada variable `tiene_titulacion` (flag binario)
- Nulos imputados: enfermedad, dificultad_aprendizaje -> "Ninguna"
- Calculada `edad` a partir de fecha_nacimiento
- Variables binarias codificadas: matricula_vigente, beca, vulnerabilidad

## Calidad del Dataset Final

### Valores Nulos

| Columna | Nulos | % del Total |
|---------|-------|-------------|
| nota_record | 2,600 | 65.0% |
| nota_trabajo | 2,600 | 65.0% |
| nota_sustentacion | 2,600 | 65.0% |
| promedio_grado | 2,600 | 65.0% |
| edad | 125 | 3.1% |

### Tipos de Variables

- **Numericas** (69): matricula_vigente, num_matriculas_titulacion, ultimo_nivel, niveles_aprobados, aprobadas_1ra, aprobadas_2da, aprobadas_3ra, nivel, matriculas_asignatura, asistencia...
- **Categoricas** (20): id_estudiante, estado_estudiante, modalidad_titulacion, codigo_asignatura, nombre_asignatura, genero, etnia, canton_procedencia, provincia_procedencia, sector_procedencia...

### Diccionario de Datos

| # | Columna | Tipo | Nulos | Unicos | Descripcion |
|---|---------|------|-------|--------|-------------|
| 1 | `id_estudiante` | object | 0 | 500 | Identificador anonimizado del estudiante |
| 2 | `estado_estudiante` | category | 0 | 3 | Estado academico (Titulado, Matriculado, etc.) |
| 3 | `matricula_vigente` | int64 | 0 | 2 | Matricula vigente (1=Si, 0=No) |
| 4 | `modalidad_titulacion` | category | 0 | 5 | Modalidad de titulacion |
| 5 | `num_matriculas_titulacion` | int64 | 0 | 3 | Numero de matriculas para titulacion |
| 6 | `ultimo_nivel` | int64 | 0 | 9 | Ultimo nivel cursado |
| 7 | `niveles_aprobados` | int64 | 0 | 10 | Niveles aprobados acumulados |
| 8 | `aprobadas_1ra` | int64 | 0 | 16 | Asignaturas aprobadas en 1ra matricula |
| 9 | `aprobadas_2da` | int64 | 0 | 11 | Asignaturas aprobadas en 2da matricula |
| 10 | `aprobadas_3ra` | int64 | 0 | 4 | Asignaturas aprobadas en 3ra matricula |
| 11 | `nivel` | int64 | 0 | 9 | Nivel actual de la asignatura |
| 12 | `codigo_asignatura` | object | 0 | 400 | Codigo de la asignatura (SICOA) |
| 13 | `nombre_asignatura` | category | 0 | 8 | Nombre de la asignatura |
| 14 | `matriculas_asignatura` | int64 | 0 | 3 | Numero de matriculas en la asignatura |
| 15 | `asistencia` | int64 | 0 | 32 | Porcentaje de asistencia |
| 16 | `primer_parcial` | float64 | 0 | 71 | Nota del primer parcial |
| 17 | `segundo_parcial` | float64 | 0 | 71 | Nota del segundo parcial |
| 18 | `nota_final` | float64 | 0 | 62 | Nota final de la asignatura |
| 19 | `tutorias` | int64 | 0 | 11 | Numero de sesiones de tutoria |
| 20 | `puntaje_admision` | int64 | 0 | 331 | Puntaje de admision a la universidad |
| 21 | `matriculas_nivelacion` | int64 | 0 | 2 | Matriculas en curso de nivelacion |
| 22 | `promedio_nivelacion` | float64 | 0 | 301 | Promedio en nivelacion |
| 23 | `num_retiros` | int64 | 0 | 3 | Numero de retiros historicos |
| 24 | `num_reingresos` | int64 | 0 | 2 | Numero de reingresos |
| 25 | `nota_record` | float64 | 2600 | 299 | Nota del record academico (titulacion) |
| 26 | `nota_trabajo` | float64 | 2600 | 300 | Nota del trabajo de titulacion |
| 27 | `nota_sustentacion` | float64 | 2600 | 294 | Nota de sustentacion (titulacion) |
| 28 | `promedio_grado` | float64 | 2600 | 233 | Promedio de grado (titulacion) |
| 29 | `genero` | category | 0 | 3 | Genero del estudiante |
| 30 | `etnia` | category | 0 | 4 | Grupo etnico |
| 31 | `canton_procedencia` | category | 0 | 3 | Canton de procedencia |
| 32 | `provincia_procedencia` | category | 0 | 2 | Provincia de procedencia |
| 33 | `sector_procedencia` | category | 0 | 2 | Sector de procedencia (Urbano/Rural) |
| 34 | `canton_residencia` | category | 0 | 2 | Canton de residencia |
| 35 | `provincia_residencia` | category | 0 | 2 | Provincia de residencia |
| 36 | `sector_residencia` | category | 0 | 2 | Sector de residencia (Urbano/Rural) |
| 37 | `enfermedad` | category | 0 | 3 | Enfermedad reportada (o Ninguna) |
| 38 | `beca` | int64 | 0 | 2 | Tiene beca (1=Si, 0=No) |
| 39 | `tipo_beca` | category | 0 | 3 | Tipo de beca |
| 40 | `vulnerabilidad` | int64 | 0 | 2 | Situacion de vulnerabilidad (1=Si, 0=No) |
| 41 | `dificultad_aprendizaje` | category | 0 | 3 | Dificultad de aprendizaje reportada (o Ninguna) |
| 42 | `tiene_titulacion` | int64 | 0 | 2 | Flag: tiene fecha de titulacion (1=Si, 0=No) |
| 43 | `edad` | float64 | 125 | 8 | Edad estimada al inicio del periodo |
| 44 | `total_eventos` | int64 | 0 | 56 | Total de eventos registrados en LMS |
| 45 | `total_sesiones` | int64 | 0 | 56 | Numero de sesiones unicas en LMS |
| 46 | `duracion_total_seg` | int64 | 0 | 498 | Duracion total de actividad LMS (segundos) |
| 47 | `duracion_promedio_seg` | float64 | 0 | 499 | Duracion promedio por evento LMS (segundos) |
| 48 | `tiempo_conexion_total_min` | int64 | 0 | 476 | Tiempo total de conexion LMS (minutos) |
| 49 | `tiempo_conexion_promedio_min` | float64 | 0 | 455 | Tiempo promedio de conexion LMS (minutos) |
| 50 | `calificacion_lms_promedio` | float64 | 0 | 483 | Promedio de calificaciones en LMS |
| 51 | `calificacion_lms_max` | float64 | 0 | 40 | Calificacion maxima en LMS |
| 52 | `calificacion_lms_min` | float64 | 0 | 38 | Calificacion minima en LMS |
| 53 | `calificacion_lms_std` | float64 | 0 | 471 | Desviacion estandar de calificaciones LMS |
| 54 | `dias_activos` | int64 | 0 | 31 | Dias distintos con actividad en LMS |
| 55 | `eventos_por_dia` | float64 | 0 | 50 | Promedio de eventos por dia activo |
| 56 | `evt_assignment_submitted` | int64 | 0 | 23 | Conteo/Feature generada - evt_assignment_submitted |
| 57 | `evt_assignment_viewed` | int64 | 0 | 23 | Conteo/Feature generada - evt_assignment_viewed |
| 58 | `evt_course_viewed` | int64 | 0 | 23 | Conteo/Feature generada - evt_course_viewed |
| 59 | `evt_forum_post` | int64 | 0 | 22 | Conteo/Feature generada - evt_forum_post |
| 60 | `evt_forum_viewed` | int64 | 0 | 22 | Conteo/Feature generada - evt_forum_viewed |
| 61 | `evt_page_viewed` | int64 | 0 | 22 | Conteo/Feature generada - evt_page_viewed |
| 62 | `evt_quiz_attempted` | int64 | 0 | 22 | Conteo/Feature generada - evt_quiz_attempted |
| 63 | `evt_quiz_submitted` | int64 | 0 | 20 | Conteo/Feature generada - evt_quiz_submitted |
| 64 | `evt_resource_viewed` | int64 | 0 | 23 | Conteo/Feature generada - evt_resource_viewed |
| 65 | `evt_url_viewed` | int64 | 0 | 20 | Conteo/Feature generada - evt_url_viewed |
| 66 | `comp_archivo_pdf` | int64 | 0 | 23 | Conteo/Feature generada - comp_archivo_pdf |
| 67 | `comp_cuestionario` | int64 | 0 | 30 | Conteo/Feature generada - comp_cuestionario |
| 68 | `comp_curso` | int64 | 0 | 23 | Conteo/Feature generada - comp_curso |
| 69 | `comp_foro` | int64 | 0 | 27 | Conteo/Feature generada - comp_foro |
| 70 | `comp_página` | int64 | 0 | 22 | Conteo/Feature generada - comp_página |
| 71 | `comp_tarea` | int64 | 0 | 30 | Conteo/Feature generada - comp_tarea |
| 72 | `comp_url` | int64 | 0 | 20 | Conteo/Feature generada - comp_url |
| 73 | `tasa_errores` | float64 | 0 | 337 | Proporcion de eventos con estado Error |
| 74 | `dispositivo_principal` | category | 0 | 4 | Dispositivo mas usado en LMS |
| 75 | `navegador_principal` | category | 0 | 3 | Navegador mas usado en LMS |
| 76 | `so_principal` | category | 0 | 5 | Sistema operativo mas usado en LMS |
| 77 | `actividad_finde` | float64 | 0 | 343 | Proporcion de actividad en fin de semana |
| 78 | `franja_preferida` | object | 0 | 4 | Franja horaria con mayor actividad |
| 79 | `asignaturas_lms` | int64 | 0 | 1 | Numero de asignaturas con actividad en LMS |
| 80 | `ratio_aprobadas_total` | float64 | 0 | 192 | Conteo/Feature generada - ratio_aprobadas_total |
| 81 | `engagement_score` | float64 | 0 | 475 | Conteo/Feature generada - engagement_score |
| 82 | `tasa_entrega` | float64 | 0 | 151 | Conteo/Feature generada - tasa_entrega |
| 83 | `tasa_quiz_completado` | float64 | 0 | 166 | Conteo/Feature generada - tasa_quiz_completado |
| 84 | `intensidad_foro` | float64 | 0 | 315 | Conteo/Feature generada - intensidad_foro |
| 85 | `calificacion_lms_rango` | float64 | 0 | 52 | Conteo/Feature generada - calificacion_lms_rango |
| 86 | `minutos_por_dia_activo` | float64 | 0 | 481 | Conteo/Feature generada - minutos_por_dia_activo |
| 87 | `es_repetidor` | int64 | 0 | 2 | Conteo/Feature generada - es_repetidor |
| 88 | `tiene_retiros` | int64 | 0 | 2 | Conteo/Feature generada - tiene_retiros |
| 89 | `riesgo_historico` | float64 | 0 | 28 | Conteo/Feature generada - riesgo_historico |

---

## Estadisticas Descriptivas (Variables Numericas)

```
       matricula_vigente  num_matriculas_titulacion  ultimo_nivel  niveles_aprobados  aprobadas_1ra  aprobadas_2da  aprobadas_3ra    nivel  matriculas_asignatura  asistencia  primer_parcial  segundo_parcial  nota_final  tutorias  puntaje_admision  matriculas_nivelacion  promedio_nivelacion  num_retiros  num_reingresos  nota_record  nota_trabajo  nota_sustentacion  promedio_grado    beca  vulnerabilidad  tiene_titulacion     edad  total_eventos  total_sesiones  duracion_total_seg  duracion_promedio_seg  tiempo_conexion_total_min  tiempo_conexion_promedio_min  calificacion_lms_promedio  calificacion_lms_max  calificacion_lms_min  calificacion_lms_std  dias_activos  eventos_por_dia  evt_assignment_submitted  evt_assignment_viewed  evt_course_viewed  evt_forum_post  evt_forum_viewed  evt_page_viewed  evt_quiz_attempted  evt_quiz_submitted  evt_resource_viewed  evt_url_viewed  comp_archivo_pdf  comp_cuestionario  comp_curso  comp_foro  comp_página  comp_tarea  comp_url  tasa_errores  actividad_finde  asignaturas_lms  ratio_aprobadas_total  engagement_score  tasa_entrega  tasa_quiz_completado  intensidad_foro  calificacion_lms_rango  minutos_por_dia_activo  es_repetidor  tiene_retiros  riesgo_historico
count             4000.0                    4000.00       4000.00            4000.00        4000.00        4000.00        4000.00  4000.00                4000.00     4000.00         4000.00          4000.00     4000.00   4000.00           4000.00                4000.00              4000.00      4000.00          4000.0      1400.00       1400.00            1400.00         1400.00  4000.0         4000.00           4000.00  3875.00        4000.00         4000.00             4000.00                4000.00                    4000.00                       4000.00                    4000.00               4000.00               4000.00               4000.00       4000.00          4000.00                   4000.00                4000.00            4000.00         4000.00           4000.00          4000.00             4000.00             4000.00              4000.00         4000.00           4000.00            4000.00     4000.00    4000.00      4000.00     4000.00   4000.00       4000.00          4000.00           4000.0                4000.00           4000.00       4000.00               4000.00          4000.00                 4000.00                 4000.00       4000.00        4000.00           4000.00
mean                 0.5                       1.00          5.01               4.45          42.47           4.91           1.48     4.98                   1.99       85.64            6.45             6.50        7.16      4.98            813.87                   1.49                 8.52         0.99             0.5         8.52          8.51               8.52            8.52     0.5            0.49              0.35    22.29         132.83          132.83           477658.85                3595.87                   16010.10                        120.55                       7.51                  9.93                  5.07                  1.44         80.28             1.65                     13.35                  13.17              13.16           13.15             13.61            13.15               13.39               13.15                13.38           13.31             13.38              26.54       13.16      26.77        13.15       26.53     13.31          0.25             0.29              5.0                   0.87              0.52          0.50                  1.08             0.20                    4.85                  199.49          0.66           0.66              6.65
std                  0.5                       0.82          2.55               2.87           4.66           3.15           1.11     2.56                   0.82        9.30            2.03             2.01        1.86      3.12             94.96                   0.50                 0.87         0.82             0.5         0.87          0.87               0.88            0.51     0.5            0.50              0.48     1.97          11.42           11.41            47198.46                 173.02                    1597.67                          6.58                       0.18                  0.09                  0.08                  0.08          5.16             0.10                      3.85                   3.66               3.44            3.69              3.57             3.73                3.84                3.82                 3.85            3.52              3.85               5.38        3.44       4.88         3.73        5.33      3.52          0.04             0.04              0.0                   0.06              0.16          0.10                  0.52             0.03                    0.11                   16.20          0.47           0.47              2.61
min                  0.0                       0.00          1.00               0.00          35.00           0.00           0.00     1.00                   1.00       70.00            3.00             3.00        4.00      0.00            650.00                   1.00                 7.00         0.00             0.0         7.00          7.00               7.00            7.22     0.0            0.00              0.00    19.00         102.00          102.00           330861.00                3052.41                   11216.00                        102.77                       6.89                  9.14                  5.00                  1.18         63.00             1.41                      4.00                   4.00               2.00            4.00              4.00             4.00                3.00                5.00                 4.00            4.00              4.00              14.00        2.00      14.00         4.00       11.00      4.00          0.14             0.18              5.0                   0.73              0.05          0.19                  0.26             0.10                    4.07                  149.55          0.00           0.00              0.00
25%                  0.0                       0.00          3.00               2.00          38.00           2.00           0.00     3.00                   1.00       78.00            4.70             4.80        5.60      2.00            734.00                   1.00                 7.76         0.00             0.0         7.76          7.77               7.73            8.15     0.0            0.00              0.00    21.00         126.00          126.00           445639.50                3487.20                   14993.25                        115.97                       7.39                  9.90                  5.02                  1.39         77.00             1.59                     11.00                  11.00              11.00           10.00             11.00            11.00               11.00               10.00                11.00           11.00             11.00              23.00       11.00      23.00        11.00       23.00     11.00          0.22             0.26              5.0                   0.82              0.41          0.43                  0.76             0.18                    4.81                  188.37          0.00           0.00              5.00
50%                  0.0                       1.00          5.00               4.00          42.00           5.00           1.00     5.00                   2.00       85.00            6.40             6.50        7.10      5.00            812.00                   1.00                 8.53         1.00             0.0         8.53          8.49               8.53            8.49     0.0            0.00              0.00    22.00         133.00          133.00           479010.00                3607.59                   16019.50                        120.40                       7.51                  9.95                  5.05                  1.45         80.00             1.66                     13.00                  13.00              13.00           13.00             14.00            13.00               13.00               13.00                13.00           13.00             13.00              26.00       13.00      27.00        13.00       26.00     13.00          0.25             0.29              5.0                   0.87              0.52          0.50                  1.00             0.20                    4.88                  199.93          1.00           1.00              6.50
75%                  1.0                       2.00          7.00               7.00          47.00           8.00           2.00     7.00                   3.00       93.00            8.20             8.30        8.70      8.00            896.00                   2.00                 9.27         2.00             1.0         9.29          9.27               9.28            8.89     1.0            1.00              1.00    24.00         141.00          141.00           508060.50                3713.78                   17147.25                        125.20                       7.63                  9.98                  5.11                  1.50         84.00             1.72                     16.00                  15.00              16.00           16.00             16.00            16.00               16.00               16.00                16.00           16.00             16.00              30.00       16.00      30.00        16.00       30.00     16.00          0.27             0.32              5.0                   0.92              0.64          0.57                  1.30             0.22                    4.93                  210.15          1.00           1.00              8.50
max                  1.0                       2.00          9.00               9.00          50.00          10.00           3.00     9.00                   3.00      105.00           10.00            10.00       11.00     10.00            980.00                   2.00                10.00         2.00             1.0        10.00         10.00              10.00            9.88     1.0            1.00              1.00    26.00         161.00          161.00           633035.00                4112.97                   20979.00                        139.18                       8.09                 10.00                  5.63                  1.68         95.00             1.92                     26.00                  27.00              25.00           28.00             27.00            26.00               25.00               24.00                34.00           23.00             34.00              43.00       25.00      40.00        26.00       42.00     23.00          0.36             0.42              5.0                   1.00              0.94          0.80                  4.00             0.32                    4.99                  251.22          1.00           1.00             13.50
```

---

*Reporte generado automaticamente por el pipeline de Fase 2.*
