const pool = require('../config/database');

module.exports = {
  async listarPorPedido(pedidoId) {
    const { rows } = await pool.query(
      `SELECT * FROM mensagens WHERE pedido_id = $1 ORDER BY criado_em ASC`,
      [pedidoId],
    );
    return rows;
  },

  async criar({ pedidoId, remetenteId, remetenteTipo, conteudo, tipo = 'texto' }) {
    const { rows } = await pool.query(
      `INSERT INTO mensagens (pedido_id, remetente_id, remetente_tipo, conteudo, tipo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [pedidoId, remetenteId, remetenteTipo, conteudo, tipo],
    );
    return rows[0];
  },

  // Mensagem automática (proposta enviada, aceita, recusada, etc.)
  async criarSistema(pedidoId, conteudo) {
    return this.criar({
      pedidoId,
      remetenteId: null,
      remetenteTipo: 'sistema',
      conteudo,
      tipo: 'sistema',
    });
  },
};
