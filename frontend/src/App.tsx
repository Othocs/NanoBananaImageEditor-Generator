import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Workbench from './components/Workbench/Workbench';
import ActionBar from './components/Actions/ActionBar';
import GeneratePrompt from './components/Tools/GeneratePrompt';

function App() {
  console.log('App component rendering');
  
  return (
    <div className="h-screen flex flex-col bg-workbench-bg">
      <Header />
      
      <div className="flex flex-1 relative">
        <Sidebar />
        <Workbench />
        <ActionBar />
      </div>
      
      <GeneratePrompt />
    </div>
  );
}

export default App;