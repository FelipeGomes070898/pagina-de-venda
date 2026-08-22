import { create } from 'zustand';

export interface Categoria {
  id: string;
  nome: string;
  icone: string;
}

const CATEGORIAS_FIXAS: Categoria[] = [
  { id: 'pedreiro', nome: 'Pedreiro', icone: '🧱' },
  { id: 'ajudante-pedreiro', nome: 'Ajudante de pedreiro', icone: '👷' },
  { id: 'diarista', nome: 'Diarista', icone: '🧹' },
  { id: 'domestico', nome: 'Trabalho doméstico', icone: '🏠' },
  { id: 'baba', nome: 'Babá', icone: '🍼' },
  { id: 'rocador', nome: 'Roçador de quintal', icone: '🌿' },
  { id: 'encanador', nome: 'Encanador', icone: '🔧' },
  { id: 'eletricista', nome: 'Eletricista', icone: '💡' },
  { id: 'pintor', nome: 'Pintor', icone: '🎨' },
  { id: 'jardineiro', nome: 'Jardineiro', icone: '🌳' },
  { id: 'cuidador', nome: 'Cuidador de idosos', icone: '🤝' },
  { id: 'motorista', nome: 'Motorista particular', icone: '🚗' },
  { id: 'montador', nome: 'Montador de móveis', icone: '🪛' },
];

interface CategoryState {
  categorias: Categoria[];
  searchCategories: (query: string) => Categoria[];
  addCustomCategory: (nome: string) => Categoria;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categorias: CATEGORIAS_FIXAS,

  searchCategories: (query: string) => {
    const termo = query.trim().toLowerCase();
    if (!termo) return get().categorias;
    return get().categorias.filter((c) => c.nome.toLowerCase().includes(termo));
  },

  addCustomCategory: (nome: string) => {
    const nova: Categoria = { id: `custom-${Date.now()}`, nome, icone: '🛠️' };
    set((state) => ({ categorias: [...state.categorias, nova] }));
    return nova;
  },
}));
