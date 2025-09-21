import Workbench from './components/Workbench/Workbench';
import GeneratePrompt from './components/Tools/GeneratePrompt';

function App() {
  console.log('App component rendering');
  
  return (
    <div className="h-screen flex relative bg-workbench-bg">
      <Workbench />
      <GeneratePrompt />
    </div>
  );
}

export default App;