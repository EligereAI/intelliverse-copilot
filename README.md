## Intelliverse Copilot

Intelliverse Copilot is a web-based AI assistant built on Next.js. It embeds a conversational “copilot” into a single-page experience where users can ask questions, explore products, or get support, and receive streamed AI responses in a modern chat UI.

At a high level, the app:

- Loads configuration for a specific company and presents one or more “modalities” (for example, sales or support) that determine how the assistant behaves.
- Creates and maintains a short-lived chat session for each user, so the backend can keep context across multiple messages.
- Connects to a backend over WebSockets to stream responses token-by-token, enriching them with sources and suggested follow‑up questions.
- Wraps all of this in a polished chat interface with welcome messages, typing indicators, feedback buttons, and voice-to-text input.

This repository contains only the frontend experience; all model logic and data retrieval live in backend services that expose HTTP and WebSocket endpoints consumed by the app.
