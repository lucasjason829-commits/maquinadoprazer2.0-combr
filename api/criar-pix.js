// /api/criar-pix.js
// Cria um pagamento PIX no Mercado Pago e devolve o QR Code (imagem base64 + código copia-e-cola)
//
// VARIÁVEL DE AMBIENTE NECESSÁRIA:
//   MP_ACCESS_TOKEN  -> Access Token de PRODUÇÃO da sua conta Mercado Pago
//                        (Mercado Pago > Suas integrações > Credenciais de produção)
//
// Se for hospedar em outro lugar que não seja Vercel, veja a nota no final do arquivo.

const PRECO_BASE = 15.00;
const PRECO_BUMP1 = 4.97;
const PRECO_BUMP2 = 4.97;
const PRECO_UPSELL = 47.90;

// Troque pelo domínio real onde o front-end (o HTML) vai ficar hospedado.
// Pode colocar mais de um separado por vírgula, ou "*" para liberar geral (menos seguro).
const ALLOWED_ORIGIN = "*";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function calcularValor({ produto, valor, bump1, bump2 }) {
  if (produto === "upsell") {
    return PRECO_UPSELL;
  }
  let total = PRECO_BASE;
  if (bump1) total += PRECO_BUMP1;
  if (bump2) total += PRECO_BUMP2;
  return parseFloat(total.toFixed(2));
}

function separarNome(nomeCompleto) {
  const partes = String(nomeCompleto).trim().split(/\s+/);
  const first_name = partes[0] || "Cliente";
  const last_name = partes.slice(1).join(" ") || "Cliente";
  return { first_name, last_name };
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { nome, email, telefone, cpf, bump1, bump2, produto } = req.body;

    if (!nome || !email || !telefone || !cpf) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const cpfLimpo = String(cpf).replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ error: "CPF inválido." });
    }

    const valor = calcularValor({ produto, bump1, bump2 });
    const { first_name, last_name } = separarNome(nome);

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("MP_ACCESS_TOKEN não configurado no ambiente.");
      return res.status(500).json({ error: "Erro de configuração do servidor." });
    }

    const idempotencyKey =
