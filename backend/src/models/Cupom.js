const pool = require('../config/database');

const CAMPOS = `
  id, codigo, tipo, valor, descricao, validade_fim, limite_uso, usos, ativo, criado_em
`;

module.exports = {
  async criar({ codigo, tipo, valor, descricao, validadeFim, limiteUso }) {
    const { rows } = await pool.query(
      `INSERT INTO cupons (codigo, tipo, valor, descricao, validade_fim, limite_uso)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${CAMPOS}`,
      [codigo.toUpperCase(), tipo, valor, descricao || null, validadeFim || null, limiteUso || null],
    );
    return rows[0];
  },

  async contarAtivos() {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM cupons WHERE ativo = TRUE`);
    return Number(rows[0].count);
  },

  async listarTodos() {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM cupons ORDER BY criado_em DESC`);
    return rows;
  },

  async buscarPorCodigo(codigo) {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM cupons WHERE codigo = $1`, [
      codigo.toUpperCase(),
    ]);
    return rows[0] || null;
  },

  async atualizarStatus(id, ativo) {
    const { rows } = await pool.query(
      `UPDATE cupons SET ativo = $2 WHERE id = $1 RETURNING ${CAMPOS}`,
      [id, ativo],
    );
    return rows[0] || null;
  },

  async remover(id) {
    await pool.query(`DELETE FROM cupons WHERE id = $1`, [id]);
  },

  async registrarUso(id) {
    await pool.query(`UPDATE cupons SET usos = usos + 1 WHERE id = $1`, [id]);
  },

  // Valida regras de negócio do cupom (ativo, dentro da validade, dentro
  // do limite de usos) e calcula o desconto pro valor do pedido. Não
  // confunde "cupom não existe" com "cupom inválido" — quem chama decide
  // a mensagem de erro adequada pra cada caso.
  calcularDesconto(cupom, valorPedido) {
    if (cupom.tipo === 'percentual') {
      return Number(((valorPedido * Number(cupom.valor)) / 100).toFixed(2));
    }
    return Math.min(Number(cupom.valor), valorPedido);
  },

  estaValido(cupom) {
    if (!cupom.ativo) return false;
    if (cupom.validade_fim && new Date(cupom.validade_fim) < new Date()) return false;
    if (cupom.limite_uso != null && cupom.usos >= cupom.limite_uso) return false;
    return true;
  },
};
