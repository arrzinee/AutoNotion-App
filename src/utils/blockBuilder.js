function toText(value) {
  return String(value || '').trim()
}

export function toRichText(content) {
  return [
    {
      type: 'text',
      text: {
        content: toText(content),
      },
    },
  ]
}

function buildTextBlock(type, content, extra = {}) {
  return {
    object: 'block',
    type,
    [type]: {
      rich_text: toRichText(content),
      ...extra,
    },
  }
}

export function buildBlocks(instructions = []) {
  return instructions
    .filter(Boolean)
    .map((instruction) => {
      const type = String(instruction.type || 'paragraph').toLowerCase()
      const content = instruction.content || ''

      switch (type) {
        case 'heading_1':
        case 'h1':
          return buildTextBlock('heading_1', content)
        case 'heading_2':
        case 'h2':
          return buildTextBlock('heading_2', content)
        case 'heading_3':
        case 'h3':
          return buildTextBlock('heading_3', content)
        case 'bulleted_list_item':
        case 'bullet':
          return buildTextBlock('bulleted_list_item', content)
        case 'numbered_list_item':
          return buildTextBlock('numbered_list_item', content)
        case 'to_do':
        case 'todo':
        case 'checkbox':
          return buildTextBlock('to_do', content, {
            checked: Boolean(instruction.checked),
          })
        case 'divider':
        case 'hr':
          return {
            object: 'block',
            type: 'divider',
            divider: {},
          }
        case 'code':
          return buildTextBlock('code', content, {
            language: instruction.language || 'plain text',
          })
        case 'quote':
        case 'blockquote':
          return buildTextBlock('quote', content)
        case 'callout':
          return buildTextBlock('callout', content, {
            icon: instruction.icon
              ? typeof instruction.icon === 'string'
                ? { type: 'emoji', emoji: instruction.icon }
                : instruction.icon
              : { type: 'emoji', emoji: '💡' },
          })
        case 'paragraph':
        default:
          return buildTextBlock('paragraph', content)
      }
    })
}
