import React from "react";
import Headers from "./Headers";
import Footer from "./Footer";
import { ctx } from "./App"
import { useState } from "react";
import { useContext } from "react";
import { getSecret, loadProfile, shortKey } from "./mkm";
import localforage from "localforage";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function Element() {
    const { state, dispatch } = useContext(ctx)
    const [url, setUrl] = useState("")
    const navigate = useNavigate()

    const submit = (url: string) => {
        // TODO: verify url
        if (!url.startsWith("nostrconnect://")) {
            console.error("invalid url", url)
            return;
        }

        const u = new URL(url)
        const remoteKey = u.hostname || u.host || u.pathname.slice(2)
        const relay = u.searchParams.get("relay")
        const metadata = JSON.parse(u.searchParams.get("metadata") || "{}")

        if (!/^[a-f0-9]{64}$/i.test(remoteKey)) {
            console.error("invalid key", remoteKey)
            return
        }

        if (!relay || !relay.match(/^wss?:\/\//)) {
            console.error("invalid relay", relay)
            return
        }

        if (!("name" in metadata) || typeof metadata.name !== "string") {
            console.error("invalid metadata", metadata)
            return
        }
        dispatch({ type: "manuallyConnect", payload: { relay, remoteKey, metadata } })
    }

    const name = (id: string) => {
        const p = state.profiles[id]
        return p ? p.display_name || p.name || shortKey(id) : shortKey(id)
    }

    const openConnection = async (id: string) => {
        const connId = crypto.randomUUID()
        const secret = await getSecret(id)
        dispatch({ type: "openConnection", payload: { id, connId, secret } })
        navigate("/connect/" + connId)
    }

    useEffect(() => {
        localforage.getItem("keys").then((keys) => {
            const list = (keys || []) as string[]
            dispatch({ type: "setKeys", payload: list });
            list.forEach(id => {
                loadProfile(id, p => {
                    p && dispatch({ type: "updateProfile", payload: { id, data: p } })
                })
            })
        })
    }, [])

    return <>
        <Headers />

        <h2>Connect Manually</h2>
        <p><input type="text" placeholder="Paste nostrconnect://..."
            onChange={e => setUrl(e.target.value)} /></p>
        <p><button onClick={() => submit(url)}>Connect</button></p>

        {state.preConnectMeta ? <>
            <h3>Connect Request</h3>

            <p>App Name: {state.preConnectMeta.metadata.name}</p>
            <p>Relay: {state.preConnectMeta.relay}</p>
            <p>Public Key: {state.preConnectMeta.remoteKey}</p>

            <h3>Choose a key</h3>

            {(state.keys as string[]).map((id) => <button key={id} onClick={(e) => {
                console.log(e)
                openConnection(id)
            }}>{name(id)}</button>)}
        </> : null}

        <Footer />
    </>
}