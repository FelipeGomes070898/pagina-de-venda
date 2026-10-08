const pool = require('../config/database');

module.exports = {
  // Upsert: só existe uma meta por tipo (semana/mes) por prestador —
  // definir de novo substitui a anterior.
  async definir(prestadorId, tipo, quantidade) {
    const { rows } = await pool.query(
      `INSERT INTO metas_prestador (prestador_id, tipo, quantidade)
       VALUES ($1, $2, $3)
       ON CONFLICT (prestador_id, tipo)
       DO UPDATE SET quantidade = EXCLUDED.quantidade, atualizado_em = NOW()
       RETURNING id, tipo, quantidade, criado_em, atualizado_em`,
      [prestadorId, tipo, quantidade],
    );
    return rows[0];
  },

  async remover(prestadorId, tipo) {
    await pool.query(`DELETE FROM metas_prestador WHERE prestador_id = $1 AND tipo = $2`, [
      prestadorId,
      tipo,
    ]);
  },

  // Progresso = serviços marcados concluído desde o início da semana/
  // mês corrente. Usa criado_em do pedido como aproximação (não existe
  // um "concluido_em" separado hoje) — na prática bate, porque a
  // maioria dos serviços é concluída poucos dias depois de criada.
  async listarComProgresso(prestadorId) {
    const { rows: metas } = await pool.query(
      `SELECT id, tipo, quantidade, criado_em, atualizado_em
       FROM metas_prestador WHERE prestador_id = $1`,
      [prestadorId],
    );
    if (metas.length === 0) return [];

    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE criado_em >= date_trunc('week', NOW())) AS semana,
         COUNT(*) FILTER (WHERE criado_em >= date_trunc('month', NOW())) AS mes
       FROM pedidos WHERE prestador_id = $1 AND status = 'concluido'`,
      [prestadorId],
    );
    const progresso = rows[0];

    return metas.map((meta) => ({
      ...meta,
      progresso: Number(meta.tipo === 'semana' ? progresso.semana : progresso.mes),
    }));
  },
};
