const crypto = require('crypto');

// PIN numérico de 6 dígitos — fácil de ditar por telefone/WhatsApp e de
// digitar de novo no app. Uma senha tipo "xhRLxoXVngop" (letra
// maiúscula/minúscula misturada) é difícil demais de passar pra quem é
// menos familiarizado com celular, que é boa parte do público daqui.
// A pessoa pode trocar por uma senha definitiva depois, em
// Configurações — isso aqui é só pra destravar o acesso.
function gerarSenhaTemporaria() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

module.exports = { gerarSenhaTemporaria };
