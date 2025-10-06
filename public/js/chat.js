const socket = io();
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const chatArea = document.getElementById('chatArea');

sendBtn.addEventListener('click', () => {
  if (input.value.trim()) {
    socket.emit('chat message', {
      usuario: username,
      mensaje: input.value
    });
    input.value = '';
  }
});

socket.on('chat message', (data) => {
  const linea = `- ${data.usuario}\n ${new Date(data.fecha._seconds * 1000).toLocaleString()} : ${data.mensaje}\n`;
  chatArea.value += linea;
});

socket.on('chat history', (mensajes) => {
  chatArea.value = ''; // Limpiar el área
  mensajes.forEach(data => {
    const linea = `- ${data.usuario}\n ${new Date(data.fecha._seconds * 1000).toLocaleString()} : ${data.mensaje}\n`;
    chatArea.value += linea;
  });
});