import {
    makeWASocket as hoshino,
    DisconnectReason,
    fetchLatestBaileysVersion,
    type SignalDataSet,
    type GroupMetadata,
    type WAMessage,
} from 'baileys'
import { pino as P } from 'pino'
import QRCode from 'qrcode'
import { Boom } from '@hapi/boom'
import { loadCustomAuthState, saveAuthState } from './auth'
import { processingMessage } from './processingMessage'



async function startWASocket() {
    const { version } = await fetchLatestBaileysVersion()
    let state = loadCustomAuthState()

    const sock = hoshino({
        version,
        auth: {
            creds: state.creds,
            keys: {
                get: async (type, ids) => {
                    const data: Record<string, any> = {}
                    for (const id of ids) {
                        const value = state.keys[type]?.[id]
                        if (value) data[id] = value
                    }
                    return data
                },
                set: async (keyData: SignalDataSet) => {
                    for (const [category, data] of Object.entries(keyData)) {
                        if (!state.keys[category]) state.keys[category] = {}
                        state.keys[category] = {
                            ...(state.keys[category] || {}),
                            ...data
                        }
                    }
                    saveAuthState(state)
                }
            }
        },
        logger: P({ level: 'warn' }),
        markOnlineOnConnect: true,
        shouldSyncHistoryMessage: () => false,
    })

    sock.ev.on('connection.update', (update) => {
        const { qr, connection, lastDisconnect } = update
        try {
            if (qr) QRCode.toString(qr, { type: 'terminal', small: true }, (error, output) => !error && console.log(output))
            if (connection == 'close' && (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason?.restartRequired) setTimeout(async () => { await startWASocket(); console.log('Reconnecting') }, 5000)
            if (connection) console.log(connection)
            else if (connection) throw new Error(`Unhandled Connection State: ${connection}`)
        } catch (err) {
            console.error("Error On Connection Update:", err)
        }
    })

    sock.ev.on('creds.update', async () => {
        state.creds = sock.authState.creds
        console.log('Saving Creds')
        saveAuthState(state)
    })

    sock.ev.on('messages.upsert', async ({ type, messages }) => {
        if (type == 'notify') {
            for(const message of messages){
                const messageProcess = processingMessage(message)
                console.log(messageProcess)
            }
        }
    })
    function sendingMessage(type: string, outputText: string, jid: string, quoted: WAMessage): void {
        if (type == 'text') sock.sendMessage(jid, { text: outputText }, {quoted: quoted})
    }
}

await startWASocket()
