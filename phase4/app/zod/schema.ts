import { z } from "zod"

// INPUTS
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

// OUTPUTS
const weatherOutputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current_weather: z.object({
    time: z.string(),
    temperature: z.number(),
    windspeed: z.number(),
    winddirection: z.number(),
    weathercode: z.number(),
  }),
})

const geocodeOutputSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string(),
        admin1: z.string().optional(),
      }),
    )
    .optional(),
})

const exchangeRateOutputSchema = z.object({
  amount: z.number(),
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
})

export {
  weatherSchema,
  geocodeSchema,
  exchangeRateSchema,
  weatherOutputSchema,
  geocodeOutputSchema,
  exchangeRateOutputSchema,
}
