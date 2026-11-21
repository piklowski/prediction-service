const mongoose = require("mongoose");
const app = require("./src/app");
const predictionService = require("./src/services/prediction.service");

const PORT = 3002;
const MONGO_URI = "mongodb://localhost:27017/prediction";

async function iniciar() {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Conexion a la base de datos establecida");

    console.log("Cargando modelo...");
    await predictionService.initModel();
    console.log("Modelo cargado");

    app.listen(PORT, () => {
        console.log(`Servidor en http://localhost:${PORT}`);
    });
}

iniciar().catch((error) => {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
});
