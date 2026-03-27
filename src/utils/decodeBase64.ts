const utf8Decoder = new TextDecoder('utf-8')

export function decodeBase64(input: string): string {
  if (!input) {
    return ''
  }

  try {
    const binaryString = atob(input)
    const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0))
    return utf8Decoder.decode(bytes)
  } catch {
    return input
  }
}
