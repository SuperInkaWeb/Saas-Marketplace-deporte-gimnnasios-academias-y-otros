module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    console.log("Webhook recibido:", req.body);

    // Aquí puedes llamar a tu servicio de payments en NestJS
    // Ejemplo: guardar estado del pago en DB
    // const paymentId = req.body.data.id;

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook:", error);
    res.status(500).json({ error: "Error procesando webhook" });
  }
};
