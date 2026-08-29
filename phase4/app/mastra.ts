import { createTool } from "@mastra/core/tools"
import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { LibSQLStore } from "@mastra/libsql"
import {
  weatherSchema,
  geocodeSchema,
  exchangeRateSchema,
  weatherOutputSchema,
  geocodeOutputSchema,
  exchangeRateOutputSchema,
} from "./zod/schema"

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
      `get_exchange_rate request failed ${response.status} ${response.statusText}`,
    )
  }

  const data: GetExchangeRateResult = await response.json()
  return data
}

// Create Tool Mastra
const weatherTool = createTool({
  id: "get_weather",
  description:
    "Get current temperature for a city using its latitude and longitude",
  inputSchema: weatherSchema,
  outputSchema: weatherOutputSchema,
  execute: async ({ latitude, longitude }) => {
    return await get_weather(Number(latitude), Number(longitude))
  },
})

const geocodeTool = createTool({
  id: "get_geocode",
  description: "Get geocode of a city ",
  inputSchema: geocodeSchema,
  outputSchema: geocodeOutputSchema,
  execute: async ({ city }) => {
    return await get_geocode(city)
  },
})

const exchangeRateTool = createTool({
  id: "get_exchange_rate",
  description: "Convert currency",
  inputSchema: exchangeRateSchema,
  outputSchema: exchangeRateOutputSchema,
  execute: async ({ base, target }) => {
    return await get_exchange_rate(base, target)
  },
})

// Creating a new Agent
const agent = new Agent({
  id: "assistant",
  name: "Assistant",
  model: "anthropic/claude-sonnet-4-6",
  instructions:
    "You are a helpful assistant. Use your tools to answer weather and currency questions.",
  tools: {
    get_weather: weatherTool,
    get_geocode: geocodeTool,
    get_exchange_rate: exchangeRateTool,
  },
  // LibSQL Store
  memory: new Memory({
    storage: new LibSQLStore({
      id: "mastra-storage",
      url: "file:./mastra.db", // or ":memory:" for ephemeral
    }),
    options: {
      observationalMemory: {
        enabled: true,
      },
    },
  }),
})

const result = await agent.generate(
  "What's the weather in Tokyo and 1 USD in JPY?",
  {
    memory: {
      thread: "agent",
      resource: "assistant",
    },
  },
)
console.log(result.text)
