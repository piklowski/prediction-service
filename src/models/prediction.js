const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PredictionSchema = new Schema({
    dataId: String,
    features: [Number],
    prediction: Number,
    featureCount: Number,
    source: String,
    latencyMs: Number,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Prediction", PredictionSchema);
