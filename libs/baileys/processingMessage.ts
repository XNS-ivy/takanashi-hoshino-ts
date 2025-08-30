import { type WAMessage, type WAMessageKey } from "baileys"

type TextContent = {
  kind: "text"
  text: string
}

type MediaContent = {
  kind: "media"
  mimetype: string
  caption: string
  fileLength?: number
  mediaKey?: Uint8Array
  fileSha256?: string
  fileEncSha256?: string
  type: string
}

export type MessageContent = TextContent | MediaContent | null

export interface OutMessageProcess {
  key: WAMessageKey
  mainType: string | undefined
  messageObject: string[]
  content: MessageContent
}

export function processingMessage(msg: WAMessage): OutMessageProcess | undefined {
  if (!msg.message) return
  const { key, message } = msg

  const denied = ["protocolMessage", "senderKeyDistributionMessage", "messageContextInfo"]
  const messageObject = Object.keys(message)
  const filtered = messageObject.filter(t => !denied.includes(t))
  if (filtered.length === 0) return

  const mainType = filtered[filtered.length - 1]
  let content: MessageContent = null

  if (mainType === "conversation" && message.conversation) {
    content = { kind: "text", text: message.conversation }
  } else if (mainType === "extendedTextMessage" && message.extendedTextMessage) {
    content = { kind: "text", text: message.extendedTextMessage.text ?? "" }
  }

  else if (
    mainType === "imageMessage" ||
    mainType === "videoMessage" ||
    mainType === "audioMessage" ||
    mainType === "documentMessage" ||
    mainType === "stickerMessage"
  ) {
    const media = message[mainType as keyof typeof message]
    if (media && typeof media === "object" && "mimetype" in media) {
      content = {
        kind: "media",
        mimetype: (media as any).mimetype || "",
        caption: (media as any).caption || "",
        fileLength: (media as any).fileLength,
        mediaKey: (media as any).mediaKey,
        fileSha256: (media as any).fileSha256?.toString("base64"),
        fileEncSha256: (media as any).fileEncSha256?.toString("base64"),
        type: mainType
      }
    }
  }

  return {
    key,
    mainType,
    messageObject: filtered,
    content
  }
}

function initACommand(command: string, args: string | null) {
    const isCommand = command.startsWith('!') // prefix
}