const crypto = require('crypto');

// Senha temporária legível (sem +/=/caracteres ambíguos) pro admin poder
// ler por telefone/WhatsApp pra quem perdeu o acesso à conta.
function gerarSenhaTemporaria() {
  return crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
}

module.exports = { gerarSenhaTemporaria };
