# -*- coding: utf-8 -*-
"""
Evaluación de Modelos - Validación y Pruebas de Rendimiento
============================================================
Pipeline: Carga → Preprocesamiento → Entrenamiento → Validación Cruzada
         → Evaluación Test → Métricas (AUC, Precisión, Recall) → Reportes

Target: en_riesgo (1 = nota_final < 7, 0 = nota_final >= 7)
Modelos: Logistic Regression, Decision Tree, Random Forest, XGBoost, SVM

Entregable: Resultados de métricas y validación
"""

# =============================================================================
# IMPORTACIONES
# =============================================================================
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import os
import sys
import io
import warnings
import json
from datetime import datetime

from sklearn.model_selection import (
    train_test_split, cross_val_score, StratifiedKFold,
    cross_validate, learning_curve
)
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_selection import SelectKBest, mutual_info_classif
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, confusion_matrix, classification_report,
    precision_recall_curve, average_precision_score
)

# Fix encoding para Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
warnings.filterwarnings('ignore')

# =============================================================================
# CONFIGURACIÓN
# =============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
DATASET_FILE = os.path.join(PROJECT_DIR, "01_Diseno_e_Implementacion_ML", "dataset_procesado.csv")
GRAFICOS_DIR = os.path.join(BASE_DIR, "graficos")
RESULTADOS_JSON = os.path.join(BASE_DIR, "resultados_evaluacion.json")
REPORTE_FILE = os.path.join(BASE_DIR, "reporte_evaluacion.md")

os.makedirs(GRAFICOS_DIR, exist_ok=True)

# Configuración global de matplotlib
plt.rcParams.update({
    'figure.figsize': (12, 7),
    'figure.dpi': 150,
    'font.size': 11,
    'font.family': 'sans-serif',
    'axes.titlesize': 14,
    'axes.labelsize': 12,
    'savefig.bbox': 'tight',
    'savefig.pad_inches': 0.2,
})

SEED = 42
np.random.seed(SEED)

# Paleta de colores profesional
COLORS = {
    'primary': '#1F4E79',
    'secondary': '#2E75B6',
    'accent': '#BDD7EE',
    'danger': '#C00000',
    'success': '#548235',
    'warning': '#ED7D31',
    'riesgo': '#E74C3C',
    'no_riesgo': '#2ECC71',
    'models': ['#1F4E79', '#2E75B6', '#548235', '#ED7D31', '#C00000'],
}


def print_section(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")


def print_step(step):
    print(f"  >> {step}")


# =============================================================================
# PASO 1: CARGA Y PREPARACIÓN DE DATOS
# =============================================================================
def paso1_cargar_y_preparar():
    print_section("PASO 1: CARGA Y PREPARACIÓN DE DATOS")

    df = pd.read_csv(DATASET_FILE)
    print_step(f"Dataset cargado: {df.shape}")

    # Crear variable target
    df['en_riesgo'] = (df['nota_final'] < 7).astype(int)
    print_step(f"Target 'en_riesgo' creado:")
    print_step(f"  En riesgo (1): {df['en_riesgo'].sum()} ({df['en_riesgo'].mean()*100:.1f}%)")
    print_step(f"  Sin riesgo (0): {(df['en_riesgo']==0).sum()} ({(1-df['en_riesgo'].mean())*100:.1f}%)")

    # Eliminar columnas con data leakage
    leak_cols = ['nota_final', 'primer_parcial', 'segundo_parcial',
                 'nota_record', 'nota_trabajo', 'nota_sustentacion',
                 'promedio_grado', 'tiene_titulacion', 'estado_estudiante',
                 'modalidad_titulacion', 'num_matriculas_titulacion']

    leak_presentes = [c for c in leak_cols if c in df.columns]
    df = df.drop(columns=leak_presentes)
    print_step(f"Columnas con data leakage eliminadas ({len(leak_presentes)})")

    # Eliminar ID y código asignatura
    for col in ['id_estudiante', 'codigo_asignatura']:
        if col in df.columns:
            df = df.drop(columns=[col])

    # Eliminar features ruidosas (bajo poder predictivo o irrelevantes)
    noise_cols = ['navegador_principal', 'dispositivo_principal', 'so_principal',
                  'asignaturas_lms', 'comp_curso', 'comp_archivo_pdf']
    noise_presentes = [c for c in noise_cols if c in df.columns]
    df = df.drop(columns=noise_presentes)
    print_step(f"Features ruidosas eliminadas ({len(noise_presentes)}): {noise_presentes}")

    # Separar X, y
    y = df['en_riesgo']
    X = df.drop(columns=['en_riesgo'])

    # Encoding de categóricas
    cat_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    label_encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        label_encoders[col] = le

    # Tratar NaN
    nan_count = X.isnull().sum().sum()
    if nan_count > 0:
        X = X.fillna(X.median())
        print_step(f"NaN imputados con mediana: {nan_count} valores")

    # Feature Selection con SelectKBest (mutual information)
    print_step("Aplicando SelectKBest (mutual_info_classif)...")
    n_features_target = min(30, X.shape[1])
    selector = SelectKBest(score_func=mutual_info_classif, k=n_features_target)
    X_selected = selector.fit_transform(X, y)
    selected_mask = selector.get_support()
    selected_features = X.columns[selected_mask].tolist()
    eliminated_features = X.columns[~selected_mask].tolist()
    X = pd.DataFrame(X_selected, columns=selected_features, index=X.index)
    print_step(f"Features seleccionadas: {len(selected_features)} de {len(selected_mask)}")
    if eliminated_features:
        print_step(f"Features eliminadas por baja información: {eliminated_features}")

    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )
    print_step(f"Train: {X_train.shape}, Test: {X_test.shape}")
    print_step(f"  Train target: en_riesgo={y_train.sum()}, sin_riesgo={(y_train==0).sum()}")
    print_step(f"  Test target:  en_riesgo={y_test.sum()}, sin_riesgo={(y_test==0).sum()}")

    # Escalado
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train),
        columns=X_train.columns, index=X_train.index
    )
    X_test_scaled = pd.DataFrame(
        scaler.transform(X_test),
        columns=X_test.columns, index=X_test.index
    )
    print_step("StandardScaler aplicado")

    return X_train, X_test, X_train_scaled, X_test_scaled, y_train, y_test, X.columns.tolist(), scaler


# =============================================================================
# PASO 2: ENTRENAMIENTO CON VALIDACIÓN CRUZADA DETALLADA
# =============================================================================
def paso2_entrenar_con_cv(X_train_scaled, X_train, y_train):
    print_section("PASO 2: ENTRENAMIENTO CON VALIDACIÓN CRUZADA (5-Fold)")

    modelos = {
        'Logistic Regression': LogisticRegression(
            max_iter=1000, random_state=SEED, C=0.1, penalty='l2'
        ),
        'Decision Tree': DecisionTreeClassifier(
            max_depth=4, min_samples_split=30, min_samples_leaf=15,
            random_state=SEED
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=300, max_depth=5, min_samples_split=20,
            min_samples_leaf=10, max_features='sqrt',
            random_state=SEED, n_jobs=-1
        ),
        'XGBoost': XGBClassifier(
            n_estimators=300, max_depth=3, learning_rate=0.05,
            min_child_weight=5, subsample=0.8, colsample_bytree=0.7,
            reg_alpha=1.0, reg_lambda=5.0, gamma=0.3,
            random_state=SEED, eval_metric='logloss',
            use_label_encoder=False, verbosity=0
        ),
        'SVM': SVC(
            kernel='rbf', C=0.5, gamma='scale',
            probability=True, random_state=SEED
        ),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

    scoring = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']

    resultados_cv = {}
    modelos_entrenados = {}

    for nombre, modelo in modelos.items():
        print_step(f"Entrenando y validando {nombre}...")

        # Usar datos escalados para LR y SVM
        if nombre in ['Logistic Regression', 'SVM']:
            X_fit = X_train_scaled
        else:
            X_fit = X_train

        # Cross-validation con múltiples métricas
        cv_results = cross_validate(
            modelo, X_fit, y_train, cv=cv,
            scoring=scoring, return_train_score=True
        )

        resultados_cv[nombre] = {
            'accuracy_mean': cv_results['test_accuracy'].mean(),
            'accuracy_std': cv_results['test_accuracy'].std(),
            'accuracy_scores': cv_results['test_accuracy'].tolist(),
            'precision_mean': cv_results['test_precision'].mean(),
            'precision_std': cv_results['test_precision'].std(),
            'precision_scores': cv_results['test_precision'].tolist(),
            'recall_mean': cv_results['test_recall'].mean(),
            'recall_std': cv_results['test_recall'].std(),
            'recall_scores': cv_results['test_recall'].tolist(),
            'f1_mean': cv_results['test_f1'].mean(),
            'f1_std': cv_results['test_f1'].std(),
            'f1_scores': cv_results['test_f1'].tolist(),
            'roc_auc_mean': cv_results['test_roc_auc'].mean(),
            'roc_auc_std': cv_results['test_roc_auc'].std(),
            'roc_auc_scores': cv_results['test_roc_auc'].tolist(),
            'train_accuracy_mean': cv_results['train_accuracy'].mean(),
            'train_f1_mean': cv_results['train_f1'].mean(),
        }

        print(f"      Accuracy:  {cv_results['test_accuracy'].mean():.4f} (±{cv_results['test_accuracy'].std():.4f})")
        print(f"      Precision: {cv_results['test_precision'].mean():.4f} (±{cv_results['test_precision'].std():.4f})")
        print(f"      Recall:    {cv_results['test_recall'].mean():.4f} (±{cv_results['test_recall'].std():.4f})")
        print(f"      F1-Score:  {cv_results['test_f1'].mean():.4f} (±{cv_results['test_f1'].std():.4f})")
        print(f"      AUC-ROC:   {cv_results['test_roc_auc'].mean():.4f} (±{cv_results['test_roc_auc'].std():.4f})")

        # Entrenar modelo final con todos los datos de train
        modelo.fit(X_fit, y_train)
        modelos_entrenados[nombre] = modelo

    return modelos_entrenados, resultados_cv


# =============================================================================
# PASO 3: EVALUACIÓN EN CONJUNTO DE TEST
# =============================================================================
def paso3_evaluar_test(modelos_entrenados, X_test, X_test_scaled, y_test):
    print_section("PASO 3: EVALUACIÓN EN CONJUNTO DE TEST")

    resultados_test = {}

    for nombre, modelo in modelos_entrenados.items():
        if nombre in ['Logistic Regression', 'SVM']:
            X_eval = X_test_scaled
        else:
            X_eval = X_test

        y_pred = modelo.predict(X_eval)
        y_prob = modelo.predict_proba(X_eval)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred)
        avg_prec = average_precision_score(y_test, y_prob)

        # Extraer TN, FP, FN, TP
        tn, fp, fn, tp = cm.ravel()
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0

        resultados_test[nombre] = {
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1': f1,
            'auc_roc': auc,
            'avg_precision': avg_prec,
            'specificity': specificity,
            'confusion_matrix': cm.tolist(),
            'tn': int(tn), 'fp': int(fp), 'fn': int(fn), 'tp': int(tp),
            'y_prob': y_prob,
            'y_pred': y_pred,
        }

        print_step(f"{nombre}:")
        print(f"      Accuracy:    {acc:.4f}")
        print(f"      Precision:   {prec:.4f}")
        print(f"      Recall:      {rec:.4f}")
        print(f"      F1-Score:    {f1:.4f}")
        print(f"      AUC-ROC:     {auc:.4f}")
        print(f"      Avg Prec:    {avg_prec:.4f}")
        print(f"      Specificity: {specificity:.4f}")
        print(f"      Confusion:   TN={tn}, FP={fp}, FN={fn}, TP={tp}")

    return resultados_test


# =============================================================================
# PASO 4: GENERACIÓN DE GRÁFICOS DE EVALUACIÓN
# =============================================================================
def paso4_generar_graficos(resultados_test, resultados_cv, y_test, modelos_entrenados,
                            X_train, X_train_scaled, y_train, feature_names):
    print_section("PASO 4: GENERACIÓN DE GRÁFICOS")

    model_names = list(resultados_test.keys())

    # =========================================================================
    # 4.1 - Tabla comparativa de métricas
    # =========================================================================
    print_step("Generando tabla comparativa de métricas...")
    fig, ax = plt.subplots(figsize=(16, 6))
    ax.axis('off')

    cell_text = []
    for nombre in model_names:
        r = resultados_test[nombre]
        cv = resultados_cv[nombre]
        cell_text.append([
            f"{r['accuracy']:.4f}",
            f"{r['precision']:.4f}",
            f"{r['recall']:.4f}",
            f"{r['f1']:.4f}",
            f"{r['auc_roc']:.4f}",
            f"{r['avg_precision']:.4f}",
            f"{r['specificity']:.4f}",
            f"{cv['accuracy_mean']:.4f} ±{cv['accuracy_std']:.4f}",
        ])

    table = ax.table(
        cellText=cell_text,
        rowLabels=model_names,
        colLabels=['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC-ROC',
                   'Avg Precision', 'Specificity', 'CV Accuracy (5-Fold)'],
        cellLoc='center', rowLoc='center', loc='center'
    )
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1.2, 1.8)

    # Colorear header
    for j in range(8):
        table[(0, j)].set_facecolor(COLORS['primary'])
        table[(0, j)].set_text_props(color='white', fontweight='bold')
    for i in range(len(model_names)):
        table[(i+1, -1)].set_text_props(fontweight='bold')

    # Highlight mejor modelo por F1
    best_idx = max(range(len(model_names)),
                   key=lambda i: resultados_test[model_names[i]]['f1'])
    for j in range(8):
        table[(best_idx+1, j)].set_facecolor('#D4EDDA')

    ax.set_title('Tabla Comparativa de Métricas de Evaluación', fontweight='bold',
                 fontsize=15, pad=20)
    plt.savefig(os.path.join(GRAFICOS_DIR, '01_tabla_metricas.png'))
    plt.close()

    # =========================================================================
    # 4.2 - Matrices de confusión
    # =========================================================================
    print_step("Generando matrices de confusión...")
    fig, axes = plt.subplots(1, 5, figsize=(28, 5.5))
    for i, nombre in enumerate(model_names):
        ax = axes[i]
        cm = np.array(resultados_test[nombre]['confusion_matrix'])
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax,
                    xticklabels=['Sin Riesgo', 'En Riesgo'],
                    yticklabels=['Sin Riesgo', 'En Riesgo'],
                    annot_kws={'size': 16, 'fontweight': 'bold'},
                    linewidths=1, linecolor='white')
        ax.set_title(f'{nombre}\nF1={resultados_test[nombre]["f1"]:.4f}',
                     fontweight='bold', fontsize=11)
        ax.set_ylabel('Real' if i == 0 else '')
        ax.set_xlabel('Predicho')
    fig.suptitle('Matrices de Confusión por Modelo', fontweight='bold', fontsize=15, y=1.08)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAFICOS_DIR, '02_matrices_confusion.png'))
    plt.close()

    # =========================================================================
    # 4.3 - Curvas ROC
    # =========================================================================
    print_step("Generando curvas ROC...")
    fig, ax = plt.subplots(figsize=(10, 8))
    for i, nombre in enumerate(model_names):
        fpr, tpr, _ = roc_curve(y_test, resultados_test[nombre]['y_prob'])
        auc_val = resultados_test[nombre]['auc_roc']
        ax.plot(fpr, tpr, color=COLORS['models'][i], linewidth=2.5,
                label=f"{nombre} (AUC = {auc_val:.4f})")

    ax.plot([0, 1], [0, 1], 'k--', alpha=0.5, linewidth=1, label='Random (AUC = 0.5)')
    ax.fill_between([0, 1], [0, 0], [0, 1], alpha=0.05, color='gray')
    ax.set_xlabel('Tasa de Falsos Positivos (FPR)', fontsize=12)
    ax.set_ylabel('Tasa de Verdaderos Positivos (TPR)', fontsize=12)
    ax.set_title('Curvas ROC - Comparación de Modelos', fontweight='bold', fontsize=14)
    ax.legend(loc='lower right', fontsize=11, framealpha=0.9)
    ax.grid(alpha=0.3)
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.02])
    plt.tight_layout()
    plt.savefig(os.path.join(GRAFICOS_DIR, '03_curvas_roc.png'))
    plt.close()

    # =========================================================================
    # 4.4 - Curvas Precision-Recall
    # =========================================================================
    print_step("Generando curvas Precision-Recall...")
    fig, ax = plt.subplots(figsize=(10, 8))
    for i, nombre in enumerate(model_names):
        prec_curve, rec_curve, _ = precision_recall_curve(
            y_test, resultados_test[nombre]['y_prob']
        )
        avg_prec = resultados_test[nombre]['avg_precision']
        ax.plot(rec_curve, prec_curve, color=COLORS['models'][i], linewidth=2.5,
                label=f"{nombre} (AP = {avg_prec:.4f})")

    baseline = y_test.sum() / len(y_test)
    ax.axhline(y=baseline, color='k', linestyle='--', alpha=0.5,
               label=f'Baseline (prevalencia = {baseline:.2f})')
    ax.set_xlabel('Recall', fontsize=12)
    ax.set_ylabel('Precision', fontsize=12)
    ax.set_title('Curvas Precision-Recall', fontweight='bold', fontsize=14)
    ax.legend(loc='upper right', fontsize=10, framealpha=0.9)
    ax.grid(alpha=0.3)
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([0, 1.05])
    plt.tight_layout()
    plt.savefig(os.path.join(GRAFICOS_DIR, '04_curvas_precision_recall.png'))
    plt.close()

    # =========================================================================
    # 4.5 - Comparación de métricas (barras agrupadas)
    # =========================================================================
    print_step("Generando comparación de métricas...")
    fig, ax = plt.subplots(figsize=(15, 7))
    metricas = ['accuracy', 'precision', 'recall', 'f1', 'auc_roc', 'specificity']
    metricas_labels = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC-ROC', 'Specificity']
    x = np.arange(len(model_names))
    width = 0.13
    colors_met = ['#1F4E79', '#2E75B6', '#548235', '#ED7D31', '#C00000', '#7030A0']

    for i, (metrica, label) in enumerate(zip(metricas, metricas_labels)):
        valores = [resultados_test[m][metrica] for m in model_names]
        bars = ax.bar(x + i * width, valores, width, label=label,
                      color=colors_met[i], alpha=0.85, edgecolor='white')
        # Agregar valor encima de cada barra
        for bar, val in zip(bars, valores):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.005,
                    f'{val:.3f}', ha='center', va='bottom', fontsize=7, rotation=45)

    ax.set_xlabel('Modelo', fontsize=12)
    ax.set_ylabel('Valor de la Métrica', fontsize=12)
    ax.set_title('Comparación de Métricas por Modelo', fontweight='bold', fontsize=14)
    ax.set_xticks(x + width * 2.5)
    ax.set_xticklabels(model_names, fontsize=10)
    ax.legend(loc='lower right', fontsize=9)
    ax.set_ylim(0, 1.15)
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAFICOS_DIR, '05_comparacion_metricas.png'))
    plt.close()

    # =========================================================================
    # 4.6 - Resultados de Validación Cruzada (boxplot por fold)
    # =========================================================================
    print_step("Generando boxplot de validación cruzada...")
    fig, axes = plt.subplots(1, 5, figsize=(24, 6))
    metricas_cv = ['accuracy_scores', 'precision_scores', 'recall_scores', 'f1_scores', 'roc_auc_scores']
    metricas_cv_labels = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC-ROC']

    for idx, (met_key, met_label) in enumerate(zip(metricas_cv, metricas_cv_labels)):
        ax = axes[idx]
        data = [resultados_cv[m][met_key] for m in model_names]
        bp = ax.boxplot(data, labels=[m.replace(' ', '\n') for m in model_names],
                        patch_artist=True, widths=0.6)
        for i, box in enumerate(bp['boxes']):
            box.set_facecolor(COLORS['models'][i])
            box.set_alpha(0.7)
        for median in bp['medians']:
            median.set_color('black')
            median.set_linewidth(2)
        ax.set_title(met_label, fontweight='bold', fontsize=12)
        ax.grid(axis='y', alpha=0.3)
        ax.tick_params(axis='x', labelsize=8)

    fig.suptitle('Distribución de Métricas por Fold (Validación Cruzada 5-Fold)',
                 fontweight='bold', fontsize=14, y=1.03)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAFICOS_DIR, '06_cv_boxplot.png'))
    plt.close()

    # =========================================================================
    # 4.7 - Overfitting check: Train vs Test
    # =========================================================================
    print_step("Generando análisis de overfitting (Train vs Test)...")
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # Accuracy
    ax = axes[0]
    train_accs = [resultados_cv[m]['train_accuracy_mean'] for m in model_names]
    test_accs = [resultados_cv[m]['accuracy_mean'] for m in model_names]
    x = np.arange(len(model_names))
    ax.bar(x - 0.15, train_accs, 0.3, label='Train', color=COLORS['secondary'], alpha=0.8)
    ax.bar(x + 0.15, test_accs, 0.3, label='Test (CV)', color=COLORS['warning'], alpha=0.8)
    ax.set_xticks(x)
    ax.set_xticklabels([m.replace(' ', '\n') for m in model_names], fontsize=9)
    ax.set_ylabel('Accuracy')
    ax.set_title('Accuracy: Train vs Test (CV)', fontweight='bold')
    ax.legend()
    ax.grid(axis='y', alpha=0.3)

    # F1-Score
    ax = axes[1]
    train_f1s = [resultados_cv[m]['train_f1_mean'] for m in model_names]
    test_f1s = [resultados_cv[m]['f1_mean'] for m in model_names]
    ax.bar(x - 0.15, train_f1s, 0.3, label='Train', color=COLORS['secondary'], alpha=0.8)
    ax.bar(x + 0.15, test_f1s, 0.3, label='Test (CV)', color=COLORS['warning'], alpha=0.8)
    ax.set_xticks(x)
    ax.set_xticklabels([m.replace(' ', '\n') for m in model_names], fontsize=9)
    ax.set_ylabel('F1-Score')
    ax.set_title('F1-Score: Train vs Test (CV)', fontweight='bold')
    ax.legend()
    ax.grid(axis='y', alpha=0.3)

    fig.suptitle('Análisis de Overfitting', fontweight='bold', fontsize=14, y=1.03)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAFICOS_DIR, '07_overfitting_check.png'))
    plt.close()

    # =========================================================================
    # 4.8 - Feature Importance del mejor modelo
    # =========================================================================
    print_step("Generando feature importance...")
    best_model_name = max(model_names, key=lambda m: resultados_test[m]['f1'])

    if best_model_name in ['Random Forest', 'XGBoost', 'Decision Tree']:
        modelo = modelos_entrenados[best_model_name]
    else:
        modelo = modelos_entrenados['Random Forest']
        best_model_name = 'Random Forest (proxy)'

    importances = pd.Series(modelo.feature_importances_, index=feature_names)
    importances = importances.sort_values(ascending=False)

    fig, ax = plt.subplots(figsize=(12, 10))
    top_20 = importances.head(20)
    bars = ax.barh(range(len(top_20)), top_20.values[::-1],
                   color=COLORS['primary'], edgecolor='white', alpha=0.85)
    ax.set_yticks(range(len(top_20)))
    ax.set_yticklabels(top_20.index[::-1], fontsize=10)
    ax.set_xlabel('Importancia')
    ax.set_title(f'Top-20 Variables Predictivas ({best_model_name})', fontweight='bold')
    ax.grid(axis='x', alpha=0.3)
    for bar, val in zip(bars, top_20.values[::-1]):
        ax.text(bar.get_width() + 0.0005, bar.get_y() + bar.get_height()/2,
                f'{val:.4f}', va='center', fontsize=9)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAFICOS_DIR, '08_feature_importance.png'))
    plt.close()

    # =========================================================================
    # 4.9 - Radar chart de métricas por modelo
    # =========================================================================
    print_step("Generando radar chart...")
    metricas_radar = ['accuracy', 'precision', 'recall', 'f1', 'auc_roc', 'specificity']
    metricas_radar_labels = ['Accuracy', 'Precision', 'Recall', 'F1', 'AUC-ROC', 'Specificity']

    angles = np.linspace(0, 2 * np.pi, len(metricas_radar), endpoint=False).tolist()
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(polar=True))
    for i, nombre in enumerate(model_names):
        values = [resultados_test[nombre][m] for m in metricas_radar]
        values += values[:1]
        ax.plot(angles, values, 'o-', linewidth=2, label=nombre,
                color=COLORS['models'][i], alpha=0.8)
        ax.fill(angles, values, alpha=0.08, color=COLORS['models'][i])

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(metricas_radar_labels, fontsize=11)
    ax.set_ylim(0, 1)
    ax.set_title('Comparación Multidimensional de Modelos', fontweight='bold',
                 fontsize=14, pad=30)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1), fontsize=10)
    ax.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAFICOS_DIR, '09_radar_chart.png'))
    plt.close()

    print_step(f"Todos los gráficos guardados en: {GRAFICOS_DIR}")
    return importances


# =============================================================================
# PASO 5: GENERAR REPORTE DE EVALUACIÓN
# =============================================================================
def paso5_generar_reporte(resultados_test, resultados_cv, feature_names,
                           importances, y_train, y_test):
    print_section("PASO 5: GENERANDO REPORTE DE EVALUACIÓN")

    model_names = list(resultados_test.keys())
    best_model = max(model_names, key=lambda m: resultados_test[m]['f1'])

    reporte = f"""# Reporte de Evaluación de Modelos
## Evaluación de Modelos - Validación y Pruebas de Rendimiento

**Fecha de generación**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Entregable**: Resultados de métricas y validación

---

## 1. Configuración del Experimento

| Parámetro | Valor |
|-----------|-------|
| Total de registros | {len(y_train) + len(y_test):,} |
| Train set | {len(y_train):,} (80%) |
| Test set | {len(y_test):,} (20%) |
| Features | {len(feature_names)} |
| Validación cruzada | 5-Fold Stratified |
| Semilla aleatoria | {SEED} |
| Escalado | StandardScaler (LR, SVM) |

### Distribución del Target

| Clase | Train | Test | Total |
|-------|-------|------|-------|
| En riesgo (1) | {y_train.sum():,} | {y_test.sum():,} | {y_train.sum() + y_test.sum():,} |
| Sin riesgo (0) | {(y_train==0).sum():,} | {(y_test==0).sum():,} | {(y_train==0).sum() + (y_test==0).sum():,} |

---

## 2. Resultados de Validación Cruzada (5-Fold)

| Modelo | Accuracy | Precision | Recall | F1-Score | AUC-ROC |
|--------|----------|-----------|--------|----------|---------|
"""

    for nombre in model_names:
        cv = resultados_cv[nombre]
        reporte += f"| {nombre} | {cv['accuracy_mean']:.4f} ±{cv['accuracy_std']:.4f} "
        reporte += f"| {cv['precision_mean']:.4f} ±{cv['precision_std']:.4f} "
        reporte += f"| {cv['recall_mean']:.4f} ±{cv['recall_std']:.4f} "
        reporte += f"| {cv['f1_mean']:.4f} ±{cv['f1_std']:.4f} "
        reporte += f"| {cv['roc_auc_mean']:.4f} ±{cv['roc_auc_std']:.4f} |\n"

    reporte += f"""
---

## 3. Resultados en Conjunto de Test

| Modelo | Accuracy | Precision | Recall | F1-Score | AUC-ROC | Avg Precision | Specificity |
|--------|----------|-----------|--------|----------|---------|---------------|-------------|
"""

    for nombre in model_names:
        r = resultados_test[nombre]
        marker = " **★**" if nombre == best_model else ""
        reporte += f"| {nombre}{marker} | {r['accuracy']:.4f} | {r['precision']:.4f} "
        reporte += f"| {r['recall']:.4f} | {r['f1']:.4f} | {r['auc_roc']:.4f} "
        reporte += f"| {r['avg_precision']:.4f} | {r['specificity']:.4f} |\n"

    reporte += f"""
> **★ Mejor modelo por F1-Score: {best_model}**

---

## 4. Matrices de Confusión

| Modelo | TN (Verdaderos Neg.) | FP (Falsos Pos.) | FN (Falsos Neg.) | TP (Verdaderos Pos.) |
|--------|---------------------|-------------------|-------------------|----------------------|
"""

    for nombre in model_names:
        r = resultados_test[nombre]
        reporte += f"| {nombre} | {r['tn']} | {r['fp']} | {r['fn']} | {r['tp']} |\n"

    reporte += f"""
---

## 5. Análisis de Overfitting

| Modelo | Train Accuracy | Test Accuracy (CV) | Diferencia | Diagnóstico |
|--------|---------------|--------------------|-----------:|-------------|
"""

    for nombre in model_names:
        cv = resultados_cv[nombre]
        diff = cv['train_accuracy_mean'] - cv['accuracy_mean']
        if diff > 0.15:
            diag = "⚠️ Overfitting alto"
        elif diff > 0.05:
            diag = "⚡ Overfitting moderado"
        else:
            diag = "✅ Sin overfitting"
        reporte += f"| {nombre} | {cv['train_accuracy_mean']:.4f} | {cv['accuracy_mean']:.4f} | {diff:.4f} | {diag} |\n"

    reporte += f"""
---

## 6. Top-15 Variables Más Importantes

| # | Variable | Importancia |
|---|----------|-------------|
"""

    for i, (feat, imp) in enumerate(importances.head(15).items()):
        reporte += f"| {i+1} | `{feat}` | {imp:.6f} |\n"

    reporte += f"""
---

## 7. Conclusiones

### Mejor Modelo: **{best_model}**

| Métrica | Valor |
|---------|-------|
| Accuracy | {resultados_test[best_model]['accuracy']:.4f} |
| Precision | {resultados_test[best_model]['precision']:.4f} |
| Recall | {resultados_test[best_model]['recall']:.4f} |
| F1-Score | {resultados_test[best_model]['f1']:.4f} |
| AUC-ROC | {resultados_test[best_model]['auc_roc']:.4f} |

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
"""

    with open(REPORTE_FILE, 'w', encoding='utf-8') as f:
        f.write(reporte)

    print_step(f"Reporte generado: {REPORTE_FILE}")
    return reporte


# =============================================================================
# PASO 6: GUARDAR RESULTADOS JSON
# =============================================================================
def paso6_guardar_json(resultados_test, resultados_cv, feature_names,
                        importances, y_train, y_test):
    print_section("PASO 6: GUARDANDO RESULTADOS EN JSON")

    model_names = list(resultados_test.keys())
    best_model = max(model_names, key=lambda m: resultados_test[m]['f1'])

    export = {
        'fecha_evaluacion': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'best_model': best_model,
        'n_features': len(feature_names),
        'feature_names': feature_names,
        'train_size': len(y_train),
        'test_size': len(y_test),
        'target_distribution': {
            'en_riesgo': int(y_train.sum() + y_test.sum()),
            'sin_riesgo': int((y_train==0).sum() + (y_test==0).sum()),
        },
        'resultados_cv': {
            k: {kk: vv for kk, vv in v.items() if not kk.endswith('_scores')}
            for k, v in resultados_cv.items()
        },
        'resultados_test': {
            k: {kk: vv for kk, vv in v.items() if kk not in ['y_prob', 'y_pred']}
            for k, v in resultados_test.items()
        },
        'top_features': importances.head(20).to_dict(),
    }

    with open(RESULTADOS_JSON, 'w', encoding='utf-8') as f:
        json.dump(export, f, indent=2, ensure_ascii=False, default=str)

    print_step(f"Resultados guardados: {RESULTADOS_JSON}")


# =============================================================================
# MAIN
# =============================================================================
def main():
    print_section("EVALUACIÓN DE MODELOS - INICIO")
    print(f"  Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Paso 1: Carga y preparación
    X_train, X_test, X_train_scaled, X_test_scaled, y_train, y_test, feature_names, scaler = \
        paso1_cargar_y_preparar()

    # Paso 2: Entrenamiento con CV
    modelos_entrenados, resultados_cv = paso2_entrenar_con_cv(
        X_train_scaled, X_train, y_train
    )

    # Paso 3: Evaluación en test
    resultados_test = paso3_evaluar_test(
        modelos_entrenados, X_test, X_test_scaled, y_test
    )

    # Paso 4: Gráficos
    importances = paso4_generar_graficos(
        resultados_test, resultados_cv, y_test, modelos_entrenados,
        X_train, X_train_scaled, y_train, feature_names
    )

    # Paso 5: Reporte
    paso5_generar_reporte(
        resultados_test, resultados_cv, feature_names,
        importances, y_train, y_test
    )

    # Paso 6: JSON
    paso6_guardar_json(
        resultados_test, resultados_cv, feature_names,
        importances, y_train, y_test
    )

    print_section("EVALUACIÓN COMPLETADA")
    best = max(resultados_test.keys(), key=lambda m: resultados_test[m]['f1'])
    print_step(f"Mejor modelo: {best} (F1={resultados_test[best]['f1']:.4f})")
    print_step(f"Gráficos: {len(os.listdir(GRAFICOS_DIR))} archivos")
    print_step(f"Reporte: {REPORTE_FILE}")
    print_step(f"JSON: {RESULTADOS_JSON}")
    print(f"\n{'='*70}\n  FIN\n{'='*70}\n")


if __name__ == '__main__':
    main()
