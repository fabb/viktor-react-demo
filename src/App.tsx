import React, { Component } from 'react'
import { ToneSynth } from './components/ToneSynth'
import './App.css'

class App extends Component {
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h1 className="App-title">Tone.js React Demo</h1>
                </header>
                <ToneSynth />
            </div>
        )
    }
}

export default App
