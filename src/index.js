import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Main from './TSPandKnapsack';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <div className="App container mt-0">
    <header className="mb-0">
      <div className="position-relative d-flex align-items-center">
        <img 
          src="technion.jpg" 
          alt="Technion Logo"
          className="h-24 w-auto"
        />
        <h2 className="w-100 text-center m-0 position-absolute">02360664 - Genetic Algorithm Simulation</h2>
      </div>
    </header>
    <Main />
  </div>
);