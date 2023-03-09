import React from "react";
import Headers from "./Headers"
import Footer from "./Footer";
import { useState } from "react";
import { getPublicKey, nip19, nip06 } from "nostr-tools";
import { addKey } from "./mkm";
import { useNavigate } from "react-router-dom";

export function Element() {
    const [sec, setSec] = useState("")
    const [words, setWords] = useState("")
    const [pass, setPass] = useState("")
    const navigate = useNavigate()
    const addSec = async (sec: string) => {
        let s = sec
        if (sec.startsWith("npub1")) {
            const res = nip19.decode(sec)
            s = res.data as string
        }
        const pub = getPublicKey(s)
        console.log(pub)
        await addKey(s, pub)
        navigate("/")
    }

    const restore = async (words: string, pass: string) => {
        if (!nip06.validateWords(words)) return
        const key = nip06.privateKeyFromSeedWords(words, pass)
        const pub = getPublicKey(key)
        await addKey(key, pub)
        navigate("/")
    }
    return <>
        <Headers />

        <h2>Restore your key:</h2>

        <label htmlFor="words">
            <p>Your mnemonic words:</p>
            <input type="text" id="words" onChange={e => setWords(e.target.value)} />
        </label>

        <label htmlFor="passphrase">
            <p>Your passphrase:</p>
            <input type="password" id="passphrase" onChange={e => setPass(e.target.value)} />
        </label>

        <p><button onClick={() => restore(words, pass)}>Submit</button></p>

        <h2>Or import directly:</h2>

        <label htmlFor="sec">
            <p>Your Private Key: (nsec1 prefix or hex encoded)</p>
            <input type="text" id="sec" onChange={e => setSec(e.target.value)} />
        </label>

        <p><button onClick={() => addSec(sec)}>Submit</button></p>

        <Footer />
    </>
}