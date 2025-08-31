import fs from 'fs'

interface BotConfiguration {
    prefix: string,
    debug: boolean,
}

export default function botConfig(): BotConfiguration {
    const configFile = './hoshinoConfig.json'
    const fileContent = fs.readFileSync(configFile, 'utf-8')
    const config: BotConfiguration = JSON.parse(fileContent)
    return config
}