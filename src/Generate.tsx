import { nip06, getPublicKey } from "nostr-tools"
import React from "react"
import { useState } from "react"
import { addKey } from "./mkm"
import Headers from "./Headers"
import Footer from "./Footer"
import { useNavigate } from "react-router-dom"

export function Element() {
    const [words, setWords] = useState(genWords())
    const [passphrase, setPassphrase] = useState("")
    const wordList = words.split(" ")
    const navigate = useNavigate()

    async function onSubmit() {
        const key = nip06.privateKeyFromSeedWords(words, passphrase)
        const pub = getPublicKey(key)
        console.log(pub)
        await addKey(key, pub)
        navigate("/")
    }

    return <>
        <Headers />

        <h2>Generate a Nostr key</h2>

        <p>Your mnemonic words:</p>

        <ul>{wordList.map((i: string) => <li key={i}>{i}</li>)}</ul>

        <p><button onClick={() => setWords(genWords())}>Random</button></p>
        <p><button onClick={() => navigator.clipboard.writeText(words)}>Copy to clipboard</button></p>

        <p>Enter your passphrase:</p>

        <p><input type="password" onChange={e => setPassphrase(e.target.value)} /></p>

        <p><button onClick={() => onSubmit()}>Submit</button></p>

        <Footer />
    </>
}


function genWords() {
    const words = nip06.generateSeedWords()
    const s = new Set(words.split(" "))
    return s.size === 12 ? words : genWords()
}