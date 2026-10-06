import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registrarHandlerBackground } from './src/services/notificationService';

// Precisa rodar aqui, fora da árvore de componentes, antes do app
// montar — exigência do @react-native-firebase/messaging pra entregar
// notificações recebidas com o app em background/fechado. Sem
// google-services.json configurado, isso é um no-op (ver
// notificationService.ts).
registrarHandlerBackground();

AppRegistry.registerComponent(appName, () => App);
