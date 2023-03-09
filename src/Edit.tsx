import React from "react";
import Headers from "./Headers";
import Footer from "./Footer";
import { useNavigate, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { loadProfile, loadRelays } from "./mkm";
import { useEffect } from "react";
import { ctx } from "./App"
import { useContext } from "react";
import localforage from "localforage";

export function Element() {
    const params = useParams()
    const { state, dispatch } = useContext(ctx)
    const profile = state.profiles[params.id as string]
    const relays = state.relays[params.id as string]
    const navigate = useNavigate()

    useEffect(() => {
        loadRelays(params.id as string, (res) => {
            res && dispatch({ type: "updateRelays", payload: { id: params.id, data: res } })
        })

        loadProfile(params.id as string, (p) => {
            p && dispatch({ type: "updateProfile", payload: { id: params.id, data: p } })
        })
    }, [])

    const delKey = async (id: string) => {
        await localforage.removeItem("key:" + id)
        const keys = await localforage.getItem<string[]>("keys")
        if (!keys) return
        keys.splice(keys.indexOf(id), 1)
        await localforage.setItem("keys", keys)
        dispatch({ type: "setKeys", payload: keys })
        navigate("/")
    }

    return <>
        <Headers />

        <h2>Key details</h2>

        <div>
            {profile && profile.display_name && <p>Name: {profile.display_name}</p>}
            {profile && profile.name && <p>Username: {profile.name}</p>}
            {profile && profile.nip05 && <p>NIP-05 verificated: {profile.nip05}</p>}

            <p>Public key bech32: (NIP-19)</p>

            <pre><code>{nip19.npubEncode(params.id as string)}</code></pre>

            <p>Public key Hex encoded:</p>

            <pre><code>{params.id}</code></pre>
        </div>

        <h3>Relays</h3>

        <ul>{relays && Object.keys(relays).map((i) => <li key={i}>{i}</li>)}</ul>

        <h2>Operations</h2>

        <p><button onClick={() => delKey(params.id!)}>DELETE THIS KEY</button></p>

        <Footer />
    </>
}
