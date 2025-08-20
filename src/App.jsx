import { useState } from 'react'
import Game from "./ui/Game";

function App() {
  const [count, setCount] = useState(0)

  const incrementCount = () => {
    setCount(count + 1);
  };

  return (
    <> 
      <Game />
    </>
  )
}

export default App
