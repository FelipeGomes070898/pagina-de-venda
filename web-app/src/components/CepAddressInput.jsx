import { useState } from 'react';
import { buscarCep, mascararCep } from '../services/cepService';

// Fluxo pedido: usuário digita o CEP, o endereço é preenchido
// automaticamente (rua, bairro, cidade, estado) e ele só completa o
// número da casa. Quando o CEP não é encontrado (raro, mas existe em
// zonas rurais), libera os campos pra preenchimento manual.
export function CepAddressInput({ onSelecionar, style }) {
  const [cep, setCep] = useState('');
  const [numero, setNumero] = useState('');
  const [endereco, setEndereco] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);
  const [manual, setManual] = useState(false);

  function emitir(dados, numeroAtual) {
    if (!dados) return;
    const partes = [dados.rua, numeroAtual, dados.bairro, dados.cidade, dados.estado].filter(Boolean);
    onSelecionar({
      enderecoCompleto: partes.join(', '),
      cidade: dados.cidade,
      estado: dados.estado,
      lat: null,
      lng: null,
      // Campos separados — usados hoje só na abertura da subconta Asaas
      // do prestador (split de pagamento), que exige endereço
      // estruturado, não a string combinada.
      cep: cep.replace(/\D/g, ''),
      rua: dados.rua,
      numero: numeroAtual,
      bairro: dados.bairro,
    });
  }

  async function aoDigitarCep(valor) {
    const formatado = mascararCep(valor);
    setCep(formatado);
    setErro(null);

    const digitos = formatado.replace(/\D/g, '');
    if (digitos.length !== 8) {
      setEndereco(null);
      return;
    }

    setBuscando(true);
    try {
      const resultado = await buscarCep(formatado);
      if (!resultado) {
        setErro('CEP não encontrado. Preencha o endereço manualmente abaixo.');
        setManual(true);
        setEndereco(null);
        return;
      }
      setEndereco(resultado);
      emitir(resultado, numero);
    } catch {
      setErro('Não foi possível buscar o CEP agora. Preencha manualmente.');
      setManual(true);
    } finally {
      setBuscando(false);
    }
  }

  function aoEditarCampo(campo, valor) {
    const atualizado = { ...(endereco || { rua: '', bairro: '', cidade: '', estado: '' }), [campo]: valor };
    setEndereco(atualizado);
    emitir(atualizado, numero);
  }

  function aoDigitarNumero(valor) {
    setNumero(valor);
    emitir(endereco, valor);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        style={style}
        placeholder="CEP (00000-000)"
        value={cep}
        onChange={(e) => aoDigitarCep(e.target.value)}
        inputMode="numeric"
      />
      {buscando && <p style={estilos.info}>Buscando endereço...</p>}
      {erro && <p style={estilos.erro}>{erro}</p>}

      {(endereco || manual) && (
        <>
          <input
            style={style}
            placeholder="Rua"
            value={endereco?.rua || ''}
            onChange={(e) => aoEditarCampo('rua', e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...style, flex: 1 }}
              placeholder="Número"
              value={numero}
              onChange={(e) => aoDigitarNumero(e.target.value)}
              inputMode="numeric"
            />
            <input
              style={{ ...style, flex: 2 }}
              placeholder="Bairro"
              value={endereco?.bairro || ''}
              onChange={(e) => aoEditarCampo('bairro', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...style, flex: 2 }}
              placeholder="Cidade"
              value={endereco?.cidade || ''}
              onChange={(e) => aoEditarCampo('cidade', e.target.value)}
            />
            <input
              style={{ ...style, flex: 1 }}
              placeholder="UF"
              value={endereco?.estado || ''}
              onChange={(e) => aoEditarCampo('estado', e.target.value.toUpperCase().slice(0, 2))}
            />
          </div>
        </>
      )}
    </div>
  );
}

const estilos = {
  info: { color: 'var(--konectaja-muted)', fontSize: 12, margin: 0 },
  erro: { color: 'var(--konectaja-red)', fontSize: 12, margin: 0 },
};
