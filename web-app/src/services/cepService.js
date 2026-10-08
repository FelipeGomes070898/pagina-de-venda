// ViaCEP é gratuito e não precisa de chave — ao contrário do Google
// Places (que exige VITE_GOOGLE_MAPS_API_KEY e cobra por uso), então
// serve de preenchimento automático de endereço sempre disponível,
// mesmo sem Maps configurado. Só não devolve lat/lng (isso continua
// dependendo do Google Maps, quando configurado).
export async function buscarCep(cep) {
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

export function mascararCep(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}
