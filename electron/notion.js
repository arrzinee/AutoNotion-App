const NOTION_BASE_URL = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

async function getFetch() {
  const { default: fetch } = await import('node-fetch')
  return fetch
}

function buildHeaders(apiKey) {
  if (!apiKey) {
    throw new Error('Missing Notion API key.')
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

function getPageTitle(properties = {}) {
  const titleEntry = Object.values(properties).find(
    (value) => value?.type === 'title' && Array.isArray(value.title),
  )

  return (
    titleEntry?.title?.map((item) => item?.plain_text || '').join('').trim() || ''
  )
}

function getDatabaseTitle(title = []) {
  if (!Array.isArray(title)) {
    return ''
  }

  return title.map((item) => item?.plain_text || '').join('').trim()
}

function normalizeIcon(icon) {
  if (!icon) {
    return null
  }

  if (icon.type === 'emoji') {
    return icon.emoji
  }

  return icon[icon.type]?.url || null
}

function normalizeResult(result) {
  return {
    id: result.id,
    object: result.object,
    title:
      result.object === 'database'
        ? getDatabaseTitle(result.title)
        : getPageTitle(result.properties),
    url: result.url || '',
    lastEdited: result.last_edited_time || null,
    icon: normalizeIcon(result.icon),
    parentType: result.parent?.type || null,
    parentId: result.parent?.[result.parent?.type] || null,
  }
}

async function notionRequest(apiKey, endpoint, { method = 'GET', body } = {}) {
  const fetch = await getFetch()
  const response = await fetch(`${NOTION_BASE_URL}/${endpoint}`, {
    method,
    headers: buildHeaders(apiKey),
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || 'Notion request failed.')
  }

  return data
}

function buildParent(parentId, parentType) {
  if (!parentType) {
    return {
      workspace: true,
    }
  }

  if (!parentId) {
    throw new Error('parentId is required when parentType is provided.')
  }

  return {
    [parentType]: parentId,
  }
}

function buildTitleProperties(title, properties = {}) {
  if (!title) {
    return properties
  }

  const titleKey =
    Object.entries(properties).find(([, value]) => value?.type === 'title')?.[0] ||
    'Name'

  return {
    ...properties,
    [titleKey]: {
      title: [
        {
          type: 'text',
          text: {
            content: title,
          },
        },
      ],
    },
  }
}

async function fetchNotionPages(apiKey) {
  const data = await notionRequest(apiKey, 'search', {
    method: 'POST',
    body: {
      filter: {
        value: 'page',
        property: 'object',
      },
      page_size: 100,
    },
  })

  const pages = Array.isArray(data.results) ? data.results.map(normalizeResult) : []

  const databaseData = await notionRequest(apiKey, 'search', {
    method: 'POST',
    body: {
      filter: {
        value: 'database',
        property: 'object',
      },
      page_size: 100,
    },
  })

  const databases = Array.isArray(databaseData.results)
    ? databaseData.results.map(normalizeResult)
    : []

  return [...pages, ...databases]
}

async function createNotionPage(apiKey, payload = {}) {
  const body = {
    parent: buildParent(payload.parentId, payload.parentType),
    properties: buildTitleProperties(payload.title, payload.properties),
  }

  if (payload.icon) {
    body.icon =
      typeof payload.icon === 'string'
        ? { type: 'emoji', emoji: payload.icon }
        : payload.icon
  }

  if (Array.isArray(payload.content) && payload.content.length > 0) {
    body.children = payload.content
  }

  const data = await notionRequest(apiKey, 'pages', {
    method: 'POST',
    body,
  })

  return normalizeResult(data)
}

async function updateNotionPage(apiKey, pageId, payload = {}) {
  if (!pageId) {
    throw new Error('pageId is required.')
  }

  const body = {}

  if (payload.title) {
    body.properties = buildTitleProperties(payload.title, payload.properties)
  } else if (payload.properties) {
    body.properties = payload.properties
  }

  if (payload.icon) {
    body.icon =
      typeof payload.icon === 'string'
        ? { type: 'emoji', emoji: payload.icon }
        : payload.icon
  }

  if (typeof payload.archived === 'boolean') {
    body.archived = payload.archived
  }

  const data = await notionRequest(apiKey, `pages/${pageId}`, {
    method: 'PATCH',
    body,
  })

  return normalizeResult(data)
}

async function appendNotionBlocks(apiKey, pageId, blocks = []) {
  if (!pageId) {
    throw new Error('pageId is required.')
  }

  if (!Array.isArray(blocks)) {
    throw new Error('blocks must be an array.')
  }

  return notionRequest(apiKey, `blocks/${pageId}/children`, {
    method: 'PATCH',
    body: {
      children: blocks,
    },
  })
}

async function searchNotion(apiKey, query = '') {
  const data = await notionRequest(apiKey, 'search', {
    method: 'POST',
    body: {
      query,
      page_size: 100,
    },
  })

  return Array.isArray(data.results) ? data.results.map(normalizeResult) : []
}

const exported = {
  fetchNotionPages,
  createNotionPage,
  updateNotionPage,
  appendNotionBlocks,
  searchNotion,
}

export {
  appendNotionBlocks,
  createNotionPage,
  fetchNotionPages,
  searchNotion,
  updateNotionPage,
}

export default exported
