export function validarEmail(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

export function validarTelefoneBR(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '');
  return digitos.length === 10 || digitos.length === 11;
}

export function validarCPF(valor: string): boolean {
  const cpf = valor.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digitos = cpf.split('').map(Number);
  const calcularDigito = (base: number[]): number => {
    let soma = 0;
    let peso = base.length + 1;
    for (const n of base) {
      soma += n * peso;
      peso -= 1;
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const digito1 = calcularDigito(digitos.slice(0, 9));
  const digito2 = calcularDigito(digitos.slice(0, 10));

  return digito1 === digitos[9] && digito2 === digitos[10];
}

export type TipoIdentificador = 'telefone' | 'email' | 'cpf';

export function validarIdentificador(tipo: TipoIdentificador, valor: string): boolean {
  if (tipo === 'email') return validarEmail(valor);
  if (tipo === 'cpf') return validarCPF(valor);
  return validarTelefoneBR(valor);
}
