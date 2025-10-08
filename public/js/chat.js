//Crear una coneccion para enviar y recibir mensajes sin recargar la pagina
const socket = io();
//busca dentro del HTML los elementos con esos IDs
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const chatArea = document.getElementById('chatArea');

//Cuando se da click al boton de enviar mensaje al servidor
sendBtn.addEventListener('click', () => { 
  if (input.value.trim()) { //ver si no esta vacio
    socket.emit('chat message', { //Se manda un evento con el nombre 'chat message' al servidor (index.js) con los datos del usuario y mensaje, y como dentro de este esta para colocar la fecha no se coloca (en socket.on('chat message', async (data) => {))
      usuario: username,
      mensaje: input.value
    });
    //limpia la caja de texto para que no este el mismo mensaje
    input.value = '';
  }
});


//Cuando se recibe un mensaje nuevo del servidor (osea de index.js) se muestra en el area de texto
socket.on('chat message', (data) => {
  // La fecha siempre es un número (milisegundos)
  const linea = `- ${data.usuario}\n ${new Date(data.fecha).toLocaleString()} : ${data.mensaje}\n`;
  chatArea.value += linea;//agrega el mensaje al area de texto
});


//Cargar los messajes anteriores cuando se conecta
socket.on('chat history', (mensajes) => {//Cuando se recibe el historial de mensajes del servidor (osea de index.js) 
  chatArea.value = ''; // Limpiar el área
  mensajes.forEach(data => { //Recorre todos los mensajes recibidos, y los muestra en el area de texto
    const linea = `- ${data.usuario}\n ${new Date(data.fecha).toLocaleString()} : ${data.mensaje}\n`;
    chatArea.value += linea;
  });
});