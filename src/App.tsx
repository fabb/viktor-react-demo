import * as React from 'react'
import ViktorNV1 from './components/ViktorNV1'
import './App.css'

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h1 className="App-title">Viktor NV-1 React Demo</h1>
                </header>
                <ViktorNV1 />
            </div>
        )
    }
}

export default App
