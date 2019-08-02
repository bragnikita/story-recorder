import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import './App.css';
import './libs/editor_form/bulma.css';
import './libs/editor_form/myscss.scss';
import './libs/editor_form/preview.scss';
import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'
import './index.scss';

import * as serviceWorker from './serviceWorker';

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
