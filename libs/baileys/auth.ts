import { initAuthCreds, BufferJSON } from "baileys"
import path from 'path'
import fs from 'fs'
const credsPath = './creds.json'

export interface AuthState {
  creds: ReturnType<typeof initAuthCreds>
  keys: { [key: string]: Record<string, any> }
}

function initKeysStructure(): AuthState['keys'] {
  return {
    preKeys: {},
    sessions: {},
    senderKeys: {},
    appStateSyncKeys: {},
    appStateVersions: {},
    senderKeyMemory: {}
  }
}

export function loadCustomAuthState(): AuthState {
    try {
    if (fs.existsSync(credsPath)) {
      const raw = fs.readFileSync(credsPath, 'utf-8')
      const data = JSON.parse(raw, BufferJSON.reviver) as Partial<AuthState>
      if (data.keys?.appStateSyncKeys) {
        console.log('🧹 Cleaning appStateSyncKeys to avoid message backlog sync')
        delete data.keys.appStateSyncKeys
      }
      if (data.keys?.appStateVersions) {
        console.log('🧽 Cleaning appStateVersions as well')
        delete data.keys.appStateVersions
      }
      return {
        creds: data.creds ?? initAuthCreds(),
        keys: {
          ...initKeysStructure(),
          ...data.keys
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Failed to load auth:', err)
  }

  return {
    creds: initAuthCreds(),
    keys: initKeysStructure()
  }
}

export function saveAuthState(state: AuthState): void {
  try {
    fs.writeFileSync(credsPath, JSON.stringify(state, BufferJSON.replacer, 2))
  } catch (err) {
    console.error('❌ Failed to save auth state:', err)
  }
}