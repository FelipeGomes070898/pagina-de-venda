const pool = require('../config/database');

// Algumas tabelas (servicos_prestador, cupons, banners...) foram
// adicionadas em migrações recentes — se o ambiente de produção ainda
// não rodou `migrations.sql`, elas podem não existir. Sem essa
// checagem, qualquer query que as referencia quebra com "relation ...
// does not exist" e derruba telas inteiras (perfil, marketplace) só
// porque uma funcionalidade secundária (área de serviço extra) não
// está disponível ainda. Cacheado em memória pro processo — uma nova
// instância (próximo deploy) reavalia do zero.
const cache = new Map();

async function tabelaExiste(nome) {
  if (cache.has(nome)) return cache.get(nome);

  const { rows } = await pool.query('SELECT to_regclass($1) IS NOT NULL AS existe', [nome]);
  const existe = rows[0].existe;
  cache.set(nome, existe);
  return existe;
}

module.exports = { tabelaExiste };
