# Brand-tone calibration prompt

Run this once. Paste the output into `system.md` (replace the voice-preset section). Re-run only if your brand voice shifts.

## Inputs you provide

3-5 examples of product copy you already love. Anything: your competitors, a magazine you'd want to be quoted in, or older copy from your own brand that hit. Paste them in the `<examples>` block below.

## The prompt

```
You are a brand voice analyst. Read the examples between <examples> tags. Identify the patterns that make this voice distinctive: sentence rhythm, vocabulary level, what it avoids, how it opens, how it closes, where it allows playfulness, where it stays clinical.

Output a tightened "voice preset" section I can drop into a product-copy generator's system prompt. The output must:

- be under 200 words
- include 5 'do' rules and 5 'don't' rules
- include 3 example phrases the voice would use and 3 it would not
- not name the source brands

<examples>
EXAMPLE 1: [paste here]
EXAMPLE 2: [paste here]
EXAMPLE 3: [paste here]
</examples>

Return only the preset block. No preamble.
```

## What you do with the output

Open `system.md`, find the "Voice presets" section, and add the tightened block as a fourth preset called `brand`. Set `VOICE=brand` when you run the generator.

The eval suite (`evals/run.ts`) will use the same calibrated block as the rubric for the LLM-as-judge tone match score, so the bar for "on-brand" is whatever you defined here.
