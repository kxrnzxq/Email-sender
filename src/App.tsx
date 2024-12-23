import './index.css'
import EmailForm from './components/EmailForm'

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <div className="w-full max-w-lg">
        <EmailForm />
      </div>
    </div>
  )
}

export default App
