module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Sem isso, o alias "@/..." (usado em todo o app) só existe pro
    // TypeScript (via tsconfig paths) — o Metro não sabe resolvê-lo em
    // tempo real e o bundle falha com "Unable to resolve module @/...".
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: { '@': './src' },
      },
    ],
    // Troca process.env.X pelo valor literal no momento do build — sem
    // isso, process.env.GOOGLE_MAPS_API_KEY/GOOGLE_WEB_CLIENT_ID sempre
    // vem undefined no bundle (Metro não faz dotenv/inject como o Vite
    // faz nos outros projetos). `include` restringe às variáveis que o
    // app realmente usa, pra não vazar outras env vars do ambiente de
    // build (ex.: segredos do CI) dentro do bundle.
    [
      'transform-inline-environment-variables',
      { include: ['GOOGLE_MAPS_API_KEY', 'GOOGLE_WEB_CLIENT_ID'] },
    ],
  ],
};
