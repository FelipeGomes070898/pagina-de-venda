export function formatarDistancia(km) {
  // distancia_km vem de uma coluna NUMERIC do Postgres — defensivo
  // mesmo com o type parser do backend já convertendo pra number.
  const valor = Number(km);
  return valor < 1 ? `${Math.round(valor * 1000)} m` : `${valor.toFixed(1)} km`;
}
