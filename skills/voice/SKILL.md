---
name: voice
description: Configure, generate, cache, synchronize, and preview autotorial narration safely.
---

# Voice management

Use the shared `autotorial produce` command for audio generation and caching. The default `auto` provider tries Kokoro, then Piper, then the free local espeak compatibility provider. Prefer Spanish voices for Spanish lessons. Always pass `--voice` and `--speaker` explicitly (for example `--voice kokoro --speaker em_alex`) and keep the same voice across every session of a course; the CLI default (`ef_dora`) differs and silently changes the narration. Re-producing an existing session with the same flags should report `0 generated, N cached`.

For ElevenLabs, run production once without approval and show the exact manifest, segment count, character estimate, voice, and model emitted by the CLI. Ask the user for explicit approval, then pass that exact hash with `--approve-manifest`. Approval never carries over to changed or additional segments. Do not store keys outside `ELEVENLABS_API_KEY`, regenerate paid cached audio, or approve spending on the user's behalf.
