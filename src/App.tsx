import Hero from './components/Hero/Hero';
import Experience from './components/Experience/Experience';
import './App.css';
import About from './components/About/About';
import Contact from './components/Contact/Contact';

function App() {
  return (
    <div className="font-sans">
      <Hero />
      <About />
      <Experience />
      <Contact />
    </div>
  );
}

export default App;
