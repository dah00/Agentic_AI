import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

const client = new Anthropic()

// zod schemas
const weatherSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
})

const geocodeSchema = z.object({
  city: z.string(),
})

const exchangeRateSchema = z.object({
  base: z.string(),
  target: z.string(),
})

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
      `get_weather request failed ${response.status} ${response.statusText}`,
    )
  }

  const data: GetExchangeRateResult = await response.json()
  return data
}

const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description:
      "Get current temperature for a city using its latitude and longitude",
    input_schema: {
      type: "object",
      properties: {
        latitude: { type: "string", description: "City latitude" },
        longitude: { type: "string", description: "City longitude" },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "get_geocode",
    description: "Get geocode of a city ",
    input_schema: {
      type: "object",
      properties: { city: { type: "string", description: "City name" } },
      required: ["city"],
    },
  },
  {
    name: "get_exchange_rate",
    description: "Convert currency",
    input_schema: {
      type: "object",
      properties: {
        base: { type: "string", description: "base currency" },
        target: { type: "string", description: "target currency" },
      },
      required: ["city"],
    },
  },
]

const messages: Anthropic.MessageParam[] = [
  {
    role: "user",
    content:
      "I am traveling to Tokyo. What is the weather there, and what's 100 USD in yen?",
  },
]

// Call the model
while (true) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools,
    tool_choice: { type: "auto", disable_parallel_tool_use: false },
    messages,
  })

  // if(stop_reason === "tool_use") => find every tool_use, run each by name, push all the tool_result's back
  const toolsUse = response.content.filter(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  )

  if (toolsUse.length > 0) {
    const content: Anthropic.ContentBlockParam[] = []
    for (const tool of toolsUse) {
      let tool_content: string
      let is_error: boolean = false
      try {
        tool_content = await runTool(tool.name, tool.input)
      } catch (e) {
        is_error = true
        tool_content = e instanceof Error ? e.message : String(e)
      }
      content.push({
        type: "tool_result",
        tool_use_id: tool.id,
        content: tool_content,
        is_error: is_error,
      })
    }

    // push reply to messages
    messages.push(
      { role: "assistant", content: response.content },
      {
        role: "user",
        content,
      },
    )
  }
  // else print the final text
  else {
    const finalText = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    )!
    console.log(finalText.text)
    break
  }
}

async function runTool(name: string, input: any): Promise<string> {
  if (name === "get_weather") {
    const { latitude, longitude } = weatherSchema.parse(input)
    const data = await get_weather(Number(latitude), Number(longitude))
    return JSON.stringify({ temperature: data.current_weather.temperature })
  }
  if (name === "get_geocode") {
    const { city } = geocodeSchema.parse(input)
    const data = await get_geocode(city)
    const first = data.results?.[0]
    if (!first) throw new Error(`No location found for ${input.city}`)
    return JSON.stringify({
      latitude: first.latitude,
      longitude: first.longitude,
    })
  }
  if (name === "get_exchange_rate") {
    const { base, target } = exchangeRateSchema.parse(input)
    const data = await get_exchange_rate(base, target)
    return JSON.stringify({ rate: data.rates })
  }
  throw new Error(`Unknown tool: ${name}`)
}
