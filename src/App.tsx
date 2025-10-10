import Hero from './components/Hero/Hero';
import Experience from './components/Experience/Experience';
import './App.css';
import About from './components/About/About';
import Contact from './components/Contact/Contact';
import ViewCV from './components/ViewCV/ViewCV';

function App() {
  return (
    <div className="font-sans">
      <Hero />
      <About />
      <Experience />
      <Contact />
      <ViewCV />
    </div>
  );
}

export default App;
