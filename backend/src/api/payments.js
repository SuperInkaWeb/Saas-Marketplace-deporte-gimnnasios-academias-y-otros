const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { title, price, quantity } = req.body;

    const preference = {
      items: [
        {
          title: title || "Producto de prueba",
          unit_price: price || 100,
          quantity: quantity || 1
        }
      ],
      back_urls: {
        success: "https://tu-proyecto.vercel.app/success",
        failure: "https://tu-proyecto.vercel.app/failure",
        pending: "https://tu-proyecto.vercel.app/pending"
      },
      auto_return: "approved",
      notification_url: "https://tu-proyecto.vercel.app/api/webhook"
    };

    const response = await mercadopago.preferences.create(preference);
    res.status(200).json(response.body);
  } catch (error) {
    console.error("Error creando preferencia:", error);
    res.status(500).json({ error: "Error creando preferencia" });
  }
};
