import { finishEvent } from "nostr-tools";
import { nip04 } from "nostr-tools";
import { makeResponse } from "./mkm";
import { Connection, Profile, RelayMeta, RemoteRequest } from "./types";

export const initState = {
    preConnectMeta: null as (Pick<Connection, 'relay' | 'metadata' | 'remoteKey'> | null),
    connections: {} as Record<string, Connection>,
    profiles: {} as Record<string, Profile>,
    relays: {} as Record<string, RelayMeta>,
    keys: [] as string[],
}
export type ContextProps = {
    state: typeof initState,
    dispatch: (action: any) => any
}

export function reducer(state: any, action: any) {
    console.log(action)
    switch (action.type as string) {
        case "setKeys":
            return { ...state, keys: action.payload }
        case "manuallyConnect":
            return { ...state, preConnectMeta: action.payload }
        case "updateProfile": {
            const map = state.profiles
            map[action.payload.id] = action.payload.data
            return { ...state, profiles: map }
        }
        case "updateRelays": {
            const map = state.relays
            map[action.payload.id] = action.payload.data
            return { ...state, relays: map }
        }
        case "openConnection": {
            const map = state.connections
            const meta = state.preConnectMeta
            const socket = new WebSocket(meta.relay)
            socket.addEventListener("open", async () => {
                const e = {
                    kind: 24133,
                    tags: [["p", meta.remoteKey]],
                    created_at: ~~(Date.now() / 1000),
                    pubkey: action.payload.id,
                    content: await nip04.encrypt(action.payload.secret, meta.remoteKey, action.payload.id),
                }
                const evStr = finishEvent(e, action.payload.secret)
                console.log(evStr)
                socket.send(JSON.stringify(["EVENT", evStr]))
            })
            const conn = {
                ...meta,
                socket,
                alwaysAllows: {},
                localKey: action.payload.id,
                secret: action.payload.secret,
                requests: [],
            }
            map[action.payload.connId] = conn
            return { ...state, preConnectMeta: null, connections: map }
        }
        case "disconnect": {
            const map = state.connections
            delete map[action.payload]
            return state
            // return { ...state, connections: map }
        }
        case "addRequest": {
            const map = state.connections
            const session = map[action.payload.session]
            if (!session) return state

            // TODO: Check always allow

            const newState = {
                ...session,
                requests: session.requests.concat([{
                    id: action.payload.id,
                    method: action.payload.method,
                    params: action.payload.params,
                    action: null,
                    time: null,
                }])
            }

            return {
                ...state, connections: {
                    ...state.connections,
                    [action.payload.session]: newState,
                }
            }
        }
        case "commitRequest": {
            const map = state.connections
            const session = map[action.payload.session]
            if (!session) return state;
            const request = session.requests.find((i: RemoteRequest) => action.payload.request === i.id)
            if (!request) return state;

            request.time = new Date();
            request.action = action.payload.act === "always_allow" ? "allow" : action.payload.act

            queueMicrotask(async () => {
                const relays = state.relays[session.localKey]
                const response = action.payload.act === "allow" || action.payload.act === "always_allow" ?
                    makeResponse(request, { ...session, relays }) :
                    { id: request.id, result: null, error: "Request has been denied" }
                console.log("111", session)
                const ev = finishEvent({
                    kind: 24133,
                    tags: [["p", session.remoteKey]],
                    created_at: ~~(Date.now() / 1000),
                    content: await nip04.encrypt(
                        session.secret,
                        session.remoteKey,
                        JSON.stringify(response)
                    ),
                }, session.secret)
                console.log(ev)
                session.socket.send(JSON.stringify(["EVENT", ev]))
            })

            // TODO: solve all same type requests

            const tt = {
                ...state,
                connections: {
                    ...map,
                    [action.payload.session]: {
                        ...session,
                        alwaysAllows: {
                            ...session.alwaysAllows,
                            get_public_key: action.payload.act === "always_allow",
                        }
                    }
                },
            }
            return tt
        }
        default:
            return state
    }
}