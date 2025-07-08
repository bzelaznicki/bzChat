import { serveFile } from 'https://deno.land/std@0.224.0/http/file_server.ts';

interface Message {
  text: string;
  sender: 'visitor' | 'agent';
  email: string;
  timestamp: string;
  name?: string;
}

interface Client {
  role: 'visitor' | 'agent';
  email: string;
  id: string;
  name?: string;
}

const clients = new Map<WebSocket, Client>();
const kv = await Deno.openKv();

Deno.serve({ port: 8080 }, async (req) => {
  const url = new URL(req.url);

  // Serve static files
  if (req.method === 'GET') {
    if (url.pathname === '/widget.js') {
      return await serveFile(req, './widget.js');
    }
    if (url.pathname === '/agent.html') {
      return await serveFile(req, './agent.html');
    }
    if (url.pathname === '/test.html') {
      return await serveFile(req, './test.html');
    }
  }

  // HTTP endpoint for chat history
  if (url.pathname === '/chats' && req.method === 'GET') {
    const email = url.searchParams.get('email');
    if (!email) {
      return new Response('Email required', {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }
    const messages = (await kv.get<Message[]>(['chat', email])).value ?? [];
    return new Response(JSON.stringify(messages), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // WebSocket server
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Not a WebSocket request', { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log('Client connected');
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        const client: Client = {
          role: data.role,
          email: data.email,
          id: crypto.randomUUID(),
          name: data.name,
        };
        clients.set(socket, client);
        console.log(`${client.role} ${client.email} connected`);

        if (client.role === 'visitor') {
          for (const [ws, c] of clients) {
            if (c.role === 'agent' && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'new_visitor',
                email: client.email,
                name: client.name,
              }));
            }
          }
        }
      } else if (data.type === 'message') {
        const client = clients.get(socket)!;
        const message: Message = {
          text: data.text,
          sender: client.role,
          email: client.email,
          timestamp: new Date().toISOString(),
          name: client.name,
        };

        const key = ['chat', client.role === 'visitor' ? client.email : data.toEmail];
        const messages = (await kv.get<Message[]>(key)).value ?? [];
        messages.push(message);
        await kv.set(key, messages);

        if (client.role === 'visitor') {
          for (const [ws, c] of clients) {
            if ((c.role === 'agent' || (c.role === 'visitor' && c.email === client.email)) && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(message));
            }
          }
        } else if (client.role === 'agent') {
          for (const [ws, c] of clients) {
            if ((c.email === data.toEmail || (c.role === 'agent' && c.email === client.email)) && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(message));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  };

  socket.onclose = () => {
    const client = clients.get(socket);
    console.log(`${client?.role} ${client?.email} disconnected`);
    clients.delete(socket);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return response;
});

console.log('Server running on ws://localhost:8080');