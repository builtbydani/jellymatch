import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  const incrementCount = () => {
    setCount(count + 1);
  };

  return (
    <>
      <div className="min-h-screen mb-4 bg-zinc-950 text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Hello, World!</h1>
         <button
            className="bg-blue-400 hover:bg-blue-200 text-white py-2 px-4 rounded-full" 
            onClick={incrementCount}
          >
            Count: {count}
          </button>
      </div>
    </>
  )
}

export default App
