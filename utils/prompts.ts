// Find all variables in the cchat input
export function findAllVariables(chatInput: HTMLTextAreaElement | null) {
  if (!chatInput) return []

  const textContent = chatInput.textContent || ''
  const variablePattern = /\{\{([\w-]+)\}\}/g
  const matches = []
  let match

  while ((match = variablePattern.exec(textContent))) {
    matches.push({
      start: match.index + 2,
      end: match.index + match[0].length - 2
    })
  }

  return matches
}

// Helper function to find the text node and offset at a given global offset
export function findTextNodeAndOffset(element: HTMLElement, globalOffset: number) {
  let node: Node | null = null
  let offset = globalOffset
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)

  let currentOffset = 0
  while (walker.nextNode()) {
    const textNode = walker.currentNode
    const textLength = textNode.textContent?.length || 0

    if (currentOffset + textLength >= globalOffset) {
      node = textNode
      offset = globalOffset - currentOffset
      break
    }
    currentOffset += textLength
  }

  return { node, offset }
}
