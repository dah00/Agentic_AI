import { anthropic } from "@ai-sdk/anthropic"
import {
  streamText,
  convertToModelMessages,
  isStepCount,
  tool,
  toUIMessageStream,
  createUIMessageStreamResponse,
} from "ai"
import { z } from "zod"

// INTERFACES
interface GeocodingResult {
  results?: Array<{
    id: number
    name: string
    latitude: number
    longitude: number
    country: string
    admin1?: string
  }>
}

interface GetWeatherResult {
  latitude: number
  longitude: number
  current_weather: {
    time: string
    temperature: number
    windspeed: number
    winddirection: number
    weathercode: number
  }
}

interface GetExchangeRateResult {
  amount: number
  base: string
  date: string
  rates: {}
}

// ========================================================

// API TOOLS
// get_geocode(city)
async function get_geocode(city: string): Promise<GeocodingResult> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  const data: GeocodingResult = await response.json()
  return data
}

// get_weather(lat, lon)
async function get_weather(
  lat: number,
  lon: number,
): Promise<GetWeatherResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `get_weather request failed ${response.status} ${response.statusText}`,
    )
  }

  const data: GetWeatherResult = await response.json()
  return data
}

// get_exchange_rate(base, target)
async function get_exchange_rate(
  base: string,
  target: string,
): Promise<GetExchangeRateResult> {
  const url = `https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${target}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `get_weather request failed ${response.status} ${response.statusText}`,
    )
  }

  const data: GetExchangeRateResult = await response.json()
  return data
}

// ==========================================================

// Convert my 3 tools to tool({description, parameters, execute})
// define tools using tool from 'ai'
const getGeocode = tool({
  description: "Get latitude and longitude for a city name",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => {
    const data = await get_geocode(city)
    const first = data.results?.[0]
    if (!first) throw new Error(`No location found for ${city}`)
    return { latitude: first.latitude, longitude: first.longitude }
  },
})

const getWeather = tool({
  description:
    "Get the current weather for a city using itis latitude and longitude",
  inputSchema: z.object({ latitude: z.string(), longitude: z.string() }),
  execute: async ({ latitude, longitude }) => {
    const data = await get_weather(Number(latitude), Number(longitude))
    return { temperature: data.current_weather.temperature }
  },
})

const getExchangeRate = tool({
  description: "Convert currency",
  inputSchema: z.object({ base: z.string(), target: z.string() }),
  execute: async ({ base, target }) => {
    const data = await get_exchange_rate(base, target)
    return { rate: data.rates }
  },
})

// ========================================================

// Anthropic sending message
// add the streamText
export async function POST(request: Request) {
  const { messages } = await request.json()
  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    messages: await convertToModelMessages(messages),
    tools: {
      get_geocode: getGeocode,
      get_weather: getWeather,
      get_exchange_rate: getExchangeRate,
    },
    stopWhen: isStepCount(5),
  })
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
