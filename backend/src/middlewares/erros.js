function tratarErros(erro, req, res, next) {
  console.error(erro);

  if (erro.code === '23505') {
    return res.status(409).json({ erro: 'Já existe um registro com esses dados' });
  }

  res.status(erro.status || 500).json({ erro: erro.message || 'Erro interno do servidor' });
}

module.exports = { tratarErros };
