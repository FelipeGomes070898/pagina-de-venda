// ViaCEP é gratuito e não precisa de chave — ao contrário do Google
// Places (que exige configuração nativa própria), então serve de
// preenchimento automático de endereço sempre disponível no cadastro.
// Só não devolve lat/lng (isso continua dependendo do Google Maps).
export interface EnderecoPorCep {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export async function buscarCep(cep: string): Promise<EnderecoPorCep | null> {
  const limpo = (cep || '').replace(/\D/g, '');
  if (limpo.length !== 8) return null;

  const resposta = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
  if (!resposta.ok) return null;
  const dados = await resposta.json();
  if (dados.erro) return null;

  return {
    cep: limpo,
    rua: dados.logradouro || '',
    bairro: dados.bairro || '',
    cidade: dados.localidade || '',
    estado: dados.uf || '',
  };
}

export function mascararCep(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}
