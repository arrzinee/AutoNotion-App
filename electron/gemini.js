import fetch from 'node-fetch'

export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash'

export async function checkGeminiConnection({
  geminiApiKey,
  geminiModel = DEFAULT_GEMINI_MODEL,
}) {
  if (!geminiApiKey) {
    return {
      ok: false,
      service: 'gemini',
      message: 'Add a Gemini API key before testing the connection.',
    }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}?key=${geminiApiKey}`,
    )

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        ok: false,
        service: 'gemini',
        message:
          payload?.error?.message ||
          'Gemini rejected the API key or requested model.',
      }
    }

    return {
      ok: true,
      service: 'gemini',
      message: `Gemini model ${payload?.name || geminiModel} is reachable.`,
    }
  } catch (error) {
    return {
      ok: false,
      service: 'gemini',
      message: error.message || 'Unable to reach the Gemini API.',
    }
  }
}
