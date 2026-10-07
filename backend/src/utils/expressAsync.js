// O Express 4 não captura sozinho uma Promise rejeitada dentro de um
// handler assíncrono (async function). Sem isso, um erro no meio de
// qualquer rota — ex.: uma query no banco que falha ou trava — faz a
// requisição nunca responder: o app fica "Carregando..." pra sempre, sem
// erro nenhum aparecer nem no cliente nem no servidor.
//
// Isso corrige isso pra TODAS as rotas de uma vez, sem precisar editar
// cada arquivo de rota: basta chamar instalar() uma vez, antes de
// `require('./routes')`. Qualquer handler passado a `router.get/post/
// put/patch/delete` passa a ter sua Promise capturada automaticamente e
// encaminhada pro middleware de erro (tratarErros) em vez de travar a
// requisição.
const { Router } = require('express');

const METODOS = ['get', 'post', 'put', 'patch', 'delete'];

let instalado = false;

function instalar() {
  if (instalado) return;
  instalado = true;

  METODOS.forEach((metodo) => {
    const original = Router[metodo];
    Router[metodo] = function (caminho, ...handlers) {
      const envolvidos = handlers.map((handler) =>
        typeof handler === 'function'
          ? function (req, res, next) {
              Promise.resolve(handler(req, res, next)).catch(next);
            }
          : handler,
      );
      return original.call(this, caminho, ...envolvidos);
    };
  });
}

module.exports = { instalar };
