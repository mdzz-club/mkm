import localforage from "localforage";
import { nip19, SimplePool, Event, nip04, signEvent, nip26 } from "nostr-tools";
import { Connection, Profile, RelayMeta, RemoteRequest } from "./types";

const InitRelays = [
    "wss://ralay.damus.io",
    "wss://nostring.deno.dev",
    "wss://relay.nostr.band",
    "wss://eden.nostr.land",
]

const Pool = new SimplePool()

export async function addKey(priv: string, pub: string) {
    let keys = await localforage.getItem<string[]>("keys")
    // console.log(keys)

    if (!keys) {
        keys = []
    }

    if (keys.includes(pub)) return
    keys.push(pub)

    await localforage.setItem("key:" + pub, priv)
    await localforage.setItem("keys", keys)
}

export async function loadProfile(id: string, callback: (p: Profile | null) => unknown) {
    let data = await localforage.getItem("profile:" + id) as Event
    if (data) callback(JSON.parse(data.content) || null)

    const sub = Pool.sub(InitRelays, [{
        authors: [id],
        kinds: [0],
        limit: 1,
        until: ~~(Date.now() / 1000),
    }])

    sub.on("event", async (e: Event) => {
        if (e.kind !== 0) return
        if (e.pubkey !== id) return
        if (data && e.created_at <= data.created_at) return
        data = e
        await localforage.setItem("profile:" + id, data)

        callback(JSON.parse(e.content))
    })
}

export async function loadRelays(id: string, callback: (r: RelayMeta) => unknown) {
    let data = await localforage.getItem("relays:" + id) as Event
    if (data) callback(makeRelayMeta(data.tags) || [])

    const sub = Pool.sub(InitRelays, [{
        authors: [id],
        kinds: [10002],
        limit: 1,
        until: ~~(Date.now() / 1000),
    }])

    sub.on("event", async (e: Event) => {
        if (e.kind !== 10002) return
        if (e.pubkey !== id) return
        if (data && e.created_at <= data.created_at) return
        data = e
        await localforage.setItem("relays:" + id, data)

        callback(makeRelayMeta(data.tags))
    })

    function makeRelayMeta(tags: string[][]) {
        const meta: RelayMeta = {}
        tags.forEach(i => {
            if (i[0] !== "r") return;
            if (i.length === 2) {
                meta[i[1]] = { read: true, write: true }
            } else {
                meta[i[1]] = {
                    read: i.includes("read"),
                    write: i.includes("write"),
                }
            }
        })
        return meta
    }
}

export function shortKey(id: string) {
    const key = nip19.npubEncode(id)
    return `${key.slice(0, 10)}:${key.slice(-4)}`
}

export function getSecret(id: string) {
    return localforage.getItem("key:" + id)
}

export async function makeResponse(req: RemoteRequest, session: Connection & { relays: RelayMeta }) {
    switch (req.method) {
        case "get_public_key":
            return { id: req.id, error: null, result: session.localKey }
        case "get_relays":
            return { id: req.id, error: null, result: session.relays }
        case "nip04_encrypt":
            return { id: req.id, error: null, result: await nip04.encrypt(session.secret, req.params[0], req.params[1]) }
        case "nip04_decrypt":
            return { id: req.id, error: null, result: await nip04.decrypt(session.secret, req.params[0], req.params[1]) }
        case "sign_event":
            return { id: req.id, error: null, result: signEvent(req.params[0], session.secret) }
        case "delegate":
            return {
                id: req.id, error: null, result: nip26.createDelegation(session.secret, {
                    ...req.params[1],
                    pubkey: req.params[0],
                })
            }
        default:
            return { id: req.id, result: null, error: `Do not support "${req.method}" method.` }
    }
}