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
  ],
};
