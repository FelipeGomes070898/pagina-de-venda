// Backend sempre devolve { erro: 'mensagem' } nos erros (ver
// middlewares/erros.js), inclusive a mensagem real de um erro 500
// (ex.: "relation servicos_prestador does not exist" quando falta
// rodar uma migração). Telas que engolem isso com uma mensagem
// genérica fixa escondem exatamente a informação que ajudaria a
// descobrir o que está errado — então sempre que o backend respondeu
// algo, mostramos a mensagem dele; só caímos no fallback genérico
// quando nem chegou a ter resposta (sem internet, CORS, timeout).
export function mensagemErro(erro, fallback) {
  return erro?.response?.data?.erro || fallback;
}
