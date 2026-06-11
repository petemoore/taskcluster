import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import routes from './App/docsRoutes';
import Link from './utils/Link';

Link.setRoutes(routes);

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App routes={routes} />);
