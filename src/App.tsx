import { useState } from 'react';
import './App.css';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="container">
      <h1>React + Vite + GitHub Pages</h1>
      <p>Проект: eduardgagite.github.io</p>
      <button onClick={() => setCount((c) => c + 1)}>count: {count}</button>
    </div>
  );
}


