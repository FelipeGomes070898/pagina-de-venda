import { useAuthStore } from '../../store/authStore';
import { ClienteMarketplace } from './ClienteMarketplace';
import { PrestadorHome } from './PrestadorHome';

// Cliente e prestador têm necessidades bem diferentes na página inicial:
// cliente navega o marketplace de prestadores, prestador quer ver o
// próprio desempenho e os pedidos que pode responder. Antes, os dois
// caíam na mesma tela (a do cliente) — um prestador logado via até a si
// mesmo na lista, com um botão "Contato" sem nenhum sentido.
export function Marketplace() {
  const tipo = useAuthStore((s) => s.usuario?.tipo);
  return tipo === 'prestador' ? <PrestadorHome /> : <ClienteMarketplace />;
}
