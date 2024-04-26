import { useState } from 'react';
import { View, Text, Image } from 'react-native';
import reactLogo from './assets/images/react.svg';
import viteLogo from '../public/vite.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <Image source={viteLogo} style={{ width: 100, height: 100 }} />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <Image source={reactLogo} style={{ width: 100, height: 100 }} />
        </a>
      </div>
      <h1>Vite + React Native</h1>
      <View>
        <Text style={{ fontSize: '30px', color: 'white' }}>Hello World React Native</Text>
      </View>
      <div className="card">
        <button onClick={() => setCount((prevCount) => prevCount + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}

export default App;
