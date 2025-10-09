import Hero from './components/Hero/Hero';
import Experience from './components/Experience/Experience';
import './App.css';
import About from './components/About/About';

function App() {
  return (
    <div className="font-sans">
      <Hero />
      <About />
      <Experience />
    </div>
  );
}

export default App;
