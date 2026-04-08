import fetch from 'node-fetch'

const NOTION_VERSION = '2022-06-28'

function getDatabaseTitle(payload) {
  const title = payload?.title?.map((item) => item?.plain_text).join('').trim()

  return title || 'Untitled database'
}

export async function checkNotionConnection({ notionToken, notionDatabaseId }) {
  if (!notionToken || !notionDatabaseId) {
    return {
      ok: false,
      service: 'notion',
      message: 'Add both a Notion integration token and database ID.',
    }
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${notionDatabaseId}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          'Notion-Version': NOTION_VERSION,
        },
      },
    )

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        ok: false,
        service: 'notion',
        message:
          payload?.message || 'Notion rejected the credentials for this database.',
      }
    }

    return {
      ok: true,
      service: 'notion',
      message: `Connected to ${getDatabaseTitle(payload)}.`,
    }
  } catch (error) {
    return {
      ok: false,
      service: 'notion',
      message: error.message || 'Unable to reach the Notion API.',
    }
  }
}
