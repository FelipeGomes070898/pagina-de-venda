const pool = require('../config/database');

module.exports = {
  async criar({ prestadorId, pedidoId, tipo, valor, metodo, asaasId, vencimento }) {
    const { rows } = await pool.query(
      `INSERT INTO pagamentos (prestador_id, pedido_id, tipo, valor, metodo, asaas_id, vencimento)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [prestadorId, pedidoId || null, tipo, valor, metodo || 'pix', asaasId || null, vencimento || null],
    );
    return rows[0];
  },

  async buscarPorAsaasId(asaasId) {
    const { rows } = await pool.query(`SELECT * FROM pagamentos WHERE asaas_id = $1`, [asaasId]);
    return rows[0] || null;
  },

  async marcarPago(id) {
    const { rows } = await pool.query(
      `UPDATE pagamentos SET status = 'pago', pago_em = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0] || null;
  },

  async marcarVencido(id) {
    const { rows } = await pool.query(
      `UPDATE pagamentos SET status = 'vencido' WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0] || null;
  },

  async listarPorPrestador(prestadorId) {
    const { rows } = await pool.query(
      `SELECT * FROM pagamentos WHERE prestador_id = $1 ORDER BY criado_em DESC`,
      [prestadorId],
    );
    return rows;
  },

  // Painel admin: todos os pagamentos, de qualquer prestador, com o nome
  // dele já junto (evita N+1 na tela de listagem).
  async listarTodos({ status, pagina = 1, porPagina = 20 } = {}) {
    const condicoes = [];
    const valores = [];
    if (status) {
      valores.push(status);
      condicoes.push(`p.status = $${valores.length}`);
    }
    const onde = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    valores.push(porPagina, (pagina - 1) * porPagina);
    const idxLimit = valores.length - 1;
    const idxOffset = valores.length;

    const { rows } = await pool.query(
      `SELECT p.*, pr.nome AS prestador_nome, pr.email AS prestador_email
       FROM pagamentos p
       JOIN prestadores pr ON pr.id = p.prestador_id
       ${onde}
       ORDER BY p.criado_em DESC
       LIMIT $${idxLimit} OFFSET $${idxOffset}`,
      valores,
    );
    return rows;
  },

  async contar({ status } = {}) {
    if (status) {
      const { rows } = await pool.query(`SELECT COUNT(*) FROM pagamentos WHERE status = $1`, [
        status,
      ]);
      return Number(rows[0].count);
    }
    const { rows } = await pool.query(`SELECT COUNT(*) FROM pagamentos`);
    return Number(rows[0].count);
  },

  // Resumo pra tela de Financeiro: totais por status + evolução mensal
  // (pago) dos últimos 6 meses.
  async resumo() {
    const [{ rows: porStatus }, { rows: porMes }] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*) AS quantidade, COALESCE(SUM(valor), 0) AS total
         FROM pagamentos GROUP BY status`,
      ),
      pool.query(
        `SELECT TO_CHAR(pago_em, 'YYYY-MM') AS mes, COALESCE(SUM(valor), 0) AS total
         FROM pagamentos
         WHERE status = 'pago' AND pago_em >= NOW() - INTERVAL '6 months'
         GROUP BY mes ORDER BY mes`,
      ),
    ]);
    return { porStatus, porMes };
  },
};
