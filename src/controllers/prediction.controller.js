const predictionService = require("../services/prediction.service");

// Consultar características
function getFeatures(req, res) {
    res.json({
        features: predictionService.getFeatures(),
    });
}

// Comprobar estado del servicio
function getHealth(req, res) {
    res.status(200).json({
        status: "ok",
        service: "prediction-service",
    });
}

// Comprobar si el modelo está listo
function getReady(req, res) {
    if (predictionService.isReady()) {
        return res.status(200).json({
            ready: true,
            modelVersion: "v1.0",
        });
    }
    return res.status(503).json({
        ready: false,
        modelVersion: "v1.0",
        message: "Model is not ready",
    });
}

// Procesar petición de predicción
async function predict(req, res) {
    try {
        const body = req.body || {};
        const features = body.features;
        const meta = body.meta;

        const resultado = await predictionService.predict(features, meta);

        res.status(201).json({
            predictionId: resultado.predictionId,
            prediction: resultado.prediction,
            timestamp: resultado.timestamp,
            latencyMs: resultado.latencyMs,
        });
    } catch (error) {
        console.error(error);

        res.status(error.status || 500).json({
            error:
                error.status === 400 || error.status === 503
                    ? error.message
                    : "Error al ejecutar la predicción",
        });
    }
}

module.exports = {
    getFeatures,
    getHealth,
    getReady,
    predict,
};
