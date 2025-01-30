//import './assets/demo.css'

import { createApp } from 'vue';
import App from './App.vue';
//amplify add
import { Amplify } from 'aws-amplify';
import amplifyconfig from './amplifyconfiguration.json';
import config from './aws-exports';
//Amplify.configure(config);
Amplify.configure(amplifyconfig);
import router from './router.js';

const app = createApp(App);
app.use(router).mount('#app');
