// /api/status-pix.js
// Consulta o status de um pagamento PIX já criado no Mercado Pago
//
// USO: GET /api/status-pix?id=123456789
//
// Retorna: { status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | ... }

const ALLOWED_ORIGIN = "*";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID do pagamento é obrigatório." });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("MP_ACCESS_TOKEN não configurado no ambiente.");
      return res.status(500).json({ error: "Erro de configuração do servidor." });
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro Mercado Pago (status):", data);
      return res.status(400).json({ error: data.message || "Erro ao consultar o pagamento." });
    }

    return res.status(200).json({ status: data.status });

  } catch (err) {
    console.error("Erro ao consultar status do PIX:", err);
    return res.status(500).json({ error: "Erro interno ao consultar o pagamento." });
  }
};

// ---------------------------------------------------------------------------
// SE NÃO FOR HOSPEDAR NA VERCEL:
// troque por uma rota normal, ex. com Express:
//
//   app.get('/api/status-pix', async (req, res) => { ...mesmo código de dentro... });
// ---------------------------------------------------------------------------
