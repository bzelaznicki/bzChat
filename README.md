# bzChat

bzChat is a lightweight, embeddable chat widget and server designed for easy integration into any website. It allows real-time communication between users and can be customized to fit your needs.

## Features
- Embeddable chat widget (JavaScript/TypeScript)
- Simple Deno-based server for handling chat messages
- Real-time messaging
- Easy integration with any HTML page
- Minimal dependencies

## Getting Started

### Prerequisites
- [Deno](https://deno.land/) installed (for the server)

### Running the Server
```sh
deno run --allow-net server.ts
```

### Embedding the Widget
1. Include `widget.js` in your HTML file:
   ```html
   <script src="widget.js"></script>
   ```
2. Add a container for the chat widget:
   ```html
   <div id="bzchat-widget"></div>
   ```
3. Initialize the widget in your script:
   ```js
   bzChatWidget.init({ serverUrl: 'ws://localhost:8000' });
   ```

### Building the Widget
To generate `widget.js` from `widget.ts` for browser use, run:

```sh
deno bundle --platform browser --output widget.js widget.ts
```

> **Note:** `widget.js` is a generated file and should not be edited directly. Always update `widget.ts` and rebuild as needed.

## License
MIT
