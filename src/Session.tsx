import React from "react";
import Headers from "./Headers";
import Footer from "./Footer";
import { useContext } from "react";
import { ctx } from "./App";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { finishEvent, nip04 } from "nostr-tools";

const RequestTitles = {
    get_public_key: "Get Your Public Key",
    get_relays: "Get Your Relay List",
    sign_event: "Sign an Event",
    nip04_encrypt: "Encrypt Message",
    nip04_decrypt: "Decrypt Message",
    delegate: "Delegate a New Key",
}

export function Element() {
    const { id } = useParams()
    const { state, dispatch } = useContext(ctx)
    const session = state.connections[id as string]
    const navigate = useNavigate()

    const disconnect = () => {
        dispatch({ type: "disconnect", payload: id })
        navigate("/connect")
    }

    const commitRequest = (req: string, act: string) => {
        dispatch({ type: "commitRequest", payload: { session: id, request: req, act } })
    }

    useEffect(() => {
        session && handleSocket(session.socket, {
            onClose() {
                dispatch({ type: "disconnect", payload: id })
                navigate("/")
            },
            onError() {
                dispatch({ type: "disconnect", payload: id })
                navigate("/")
            },
            onRequest(data: any) {
                dispatch({ type: "addRequest", payload: { ...data, session: id } })
            },
            key: session.secret,
            remoteKey: session.remoteKey,
            localKey: session.localKey,
        })
    }, [session])

    return <>
        <Headers />

        <h2>Connection</h2>

        {session && <>
            <p>Relay: {session.relay}</p>
            <p>Name: {session.metadata.name}</p>
            <p>Public Key: {session.remoteKey}</p>
            <p>Your Key: {session.localKey}</p>
        </>
        }

        <p><button onClick={() => disconnect()}>DISCONNECT</button></p>

        <h2>Requests</h2>

        {session && session.requests.map(i => i.action === null ? <article key={i.id}>
            <h3>{RequestTitles[i.method]}</h3>
            {i.method === "get_public_key" ? <p>{session.metadata.name} wants go get your public key.</p> : null}
            <p>
                <button onClick={() => commitRequest(i.id, "allow")}>Allow</button>&nbsp;
                <button onClick={() => commitRequest(i.id, "deny")}>Deny</button>&nbsp;
                <button onClick={() => commitRequest(i.id, "always_allow")}>Always allow</button>
            </p>
        </article> : <blockquote key={i.id}>
            <p>{RequestTitles[i.method]} - Allow</p>
            <cite>- {(i.time as Date).toISOString()}</cite>
        </blockquote>)}

        <Footer />
    </>
}

function handleSocket(ws: WebSocket, opts: any) {
    ws.addEventListener("close", () => {
        opts.onClose()
    })

    ws.addEventListener("error", () => {
        opts.onError()
    })

    ws.addEventListener("message", async ({ data }) => {
        let json: any
        try {
            json = JSON.parse(data)
        } catch {
            return;
        }

        if (!Array.isArray(json)) return;
        if (json.length !== 3) return;

        const ev = json[2]
        console.log(ev)
        const content = await nip04.decrypt(opts.key, opts.remoteKey, ev.content)
        console.log("decrypt content", content)

        let cjson: any
        try {
            cjson = JSON.parse(content)
        } catch {
            return;
        }

        if (cjson.method === "describe") {
            const e = finishEvent({
                kind: 24133,
                created_at: ~~(Date.now() / 1000),
                tags: [["p", opts.remoteKey]],
                content: await nip04.encrypt(opts.key, opts.remoteKey, JSON.stringify({
                    id: cjson.id,
                    error: null,
                    result: ["describe", "get_public_key", "sign_event", "connect", "disconnect", "delegate",
                        "get_relays", "nip04_encrypt", "nip04_decrypt"],
                }))
            }, opts.key)
            ws.send(JSON.stringify(["EVENT", e]))
        } else if (cjson.method === "disconnect") {
            ws.close()
        } else {
            opts.onRequest(cjson)
        }
    })

    ws.addEventListener("open", () => {
        console.log("open")
        ws.send(JSON.stringify(["REQ", crypto.randomUUID().slice(0, 8), { kinds: [24133], "#p": [opts.localKey] }]))
    })
}