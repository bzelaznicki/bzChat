interface Message {
  text: string;
  sender: 'visitor' | 'agent';
  email: string;
  timestamp: string;
}

const ws = new WebSocket('ws://bzchat.zelaznicki.com');
const chatDiv = document.createElement('div');
chatDiv.id = 'chat';
chatDiv.style.border = '1px solid #ccc';
chatDiv.style.height = '200px';
chatDiv.style.overflowY = 'scroll';
chatDiv.style.padding = '10px';
document.body.appendChild(chatDiv);

// Form for name/email
const form = document.createElement('form');
form.style.margin = '10px';
const nameInput = document.createElement('input');
nameInput.placeholder = 'Name';
nameInput.style.marginRight = '5px';
const emailInput = document.createElement('input');
emailInput.placeholder = 'Email';
emailInput.type = 'email';
emailInput.style.marginRight = '5px';
const requestButton = document.createElement('button');
requestButton.textContent = 'Request Chat';
form.append(nameInput, emailInput, requestButton);
chatDiv.appendChild(form);

// Chat input
const messageInput = document.createElement('input');
messageInput.placeholder = 'Type a message...';
messageInput.style.display = 'none';
messageInput.style.width = '300px';
messageInput.style.margin = '10px';
const sendButton = document.createElement('button');
sendButton.textContent = 'Send';
sendButton.style.display = 'none';
chatDiv.appendChild(messageInput);
chatDiv.appendChild(sendButton);

requestButton.onclick = (e) => {
  e.preventDefault();
  if (nameInput.value && emailInput.value) {
    ws.send(JSON.stringify({
      type: 'init',
      role: 'visitor',
      email: emailInput.value,
      name: nameInput.value,
    }));
    form.style.display = 'none';
    messageInput.style.display = 'block';
    sendButton.style.display = 'block';
  }
};

ws.onmessage = (event) => {
  const msg: Message = JSON.parse(event.data);
  const div = document.createElement('div');
  div.textContent = `${msg.sender === 'visitor' ? msg.name : 'Agent'}: ${msg.text}`;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
};

sendButton.onclick = () => {
  if (messageInput.value) {
    ws.send(JSON.stringify({
      type: 'message',
      text: messageInput.value,
    }));
    messageInput.value = '';
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};