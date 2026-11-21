const ort = require("onnxruntime-node");
const path = require("path");
const fs = require("fs");
const Prediction = require("../models/prediction"); // 1. Importar el modelo

// Rutas de los archivos del modelo
const modelPath = path.join(__dirname, "../../modelo/modelo.onnx");
const normPath = path.join(__dirname, "../../modelo/normalizacion.json");

// Cargar parámetros de normalización
const norm = JSON.parse(fs.readFileSync(normPath, "utf8"));

let session;

// Inicializar el modelo
async function initModel() {
    session = await ort.InferenceSession.create(modelPath);
    console.log("Modelo ONNX cargado correctamente");
}

// Comprobar si el modelo está listo
function isReady() {
    if (session) {
        return true;
    } else {
        return false;
    }
}

// Obtener nombres de las características
function getFeatures() {
    return norm.features;
}

// Realizar predicción y guardar en MongoDB
async function predict(features, meta) {
    // Comprobar que el modelo está cargado
    if (!session) {
        const error = new Error("Model is not ready");
        error.status = 503;
        throw error;
    }

    // Validar entrada
    if (
        !Array.isArray(features) ||
        features.length !== norm.mean.length ||
        !features.every((v) => typeof v === "number" && Number.isFinite(v))
    ) {
        const error = new Error(
            `Se esperan ${norm.mean.length} valores numéricos`,
        );
        error.status = 400;
        throw error;
    }

    // Iniciar medición del tiempo
    const inicio = performance.now();

    // Normalizar las entradas
    const datos = features.map(
        (valor, i) => (valor - norm.mean[i]) / norm.scale[i],
    );

    // Construir tensor de entrada
    const tensor = new ort.Tensor("float32", Float32Array.from(datos), [
        1,
        datos.length,
    ]);

    // Ejecutar inferencia
    const resultado = await session.run({
        [session.inputNames[0]]: tensor,
    });

    // Calcular latencia
    const latencyMs = Number((performance.now() - inicio).toFixed(2));
    const prediction = Number(resultado[session.outputNames[0]].data[0]);

    // Preparar metadatos básicos por si vienen vacíos
    let dataId = null;
    let source = "unknown";
    if (meta) {
        if (meta.dataId) {
            dataId = meta.dataId;
        }
        if (meta.source) {
            source = meta.source;
        }
    }

    // 2. Crear y guardar el documento en MongoDB
    const nuevaPrediccion = new Prediction({
        dataId: dataId,
        features: features,
        prediction: prediction,
        featureCount: features.length,
        source: source,
        latencyMs: latencyMs,
    });

    const prediccionGuardada = await nuevaPrediccion.save();

    // 3. Devolver los valores que exige el contrato
    return {
        predictionId: prediccionGuardada._id,
        prediction: prediction,
        timestamp: prediccionGuardada.createdAt.toISOString(),
        latencyMs: latencyMs,
    };
}

module.exports = {
    initModel,
    isReady,
    getFeatures,
    predict,
};
