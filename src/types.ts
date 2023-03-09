export type Profile = Partial<{
    name: string;
    display_name: string;
    banner: string;
    picture: string;
    nip05: string;
}>

export type RelayMeta = Record<string, { read: boolean, write: boolean }>

export type RemoteRequest = {
    id: string;
    method: string;
    params: any[];
    action: string | null;
    time: Date | null;
}

export type Connection = {
    relay: string;
    remoteKey: string;
    localKey: string;
    metadata: {
        name: string;
        description?: string;
        url?: string;
        icons?: string[];
    };
    alwaysAllows: Record<string, boolean>;
    socket: WebSocket;
    secret: string;
    requests: RemoteRequest[]
}