import './App.css'
import IssMap from './components/IssMap'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>ISS Tracker</h1>
        <p className="tagline">Live position &amp; visible pass predictions</p>
      </header>
      <main className="app-main">
        <IssMap />
      </main>
    </div>
  )
}

export default App
