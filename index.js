//coneccion al servidor socket
//const net = require('net');
//const  server = net.createServer();
//En vez de estos se utilizara el socket.io porque es dentro de un entorno web

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');


/*server.on('connection', (socket) =>{
    socket.on('data', (data)=>{
        console.log('Mensaje recibido del cliente:', data.toString())
        socket.write('Mensaje recibido \n')
    })
    socket.on('close', ()=>{
        console.log('Cliente desconectado')
    })
    socket.on('error', (err)=>{
        console.log('Error:', err)
    })
})*/

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('login');
});

app.post('/chat', async (req, res) => {
  const username = req.body.username;

  const snapshot = await db.collection('chat').orderBy('fecha').get();
  const mensajes = snapshot.docs.map(doc => doc.data());

  res.render('chat', { username, mensajes });
});

io.on('connection', async (socket) => {
  // Enviar historial al nuevo usuario conectado
  const snapshot = await db.collection('chat').orderBy('fecha').get();
  // Convertir Firestore Timestamp a milisegundos
  const mensajes = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      usuario: data.usuario,
      mensaje: data.mensaje,
      fecha: data.fecha instanceof Date
        ? data.fecha.getTime()
        : (data.fecha._seconds ? data.fecha._seconds * 1000 : Date.now())
    };
  });
  socket.emit('chat history', mensajes);

  // Escuchar nuevos mensajes
  socket.on('chat message', async (data) => {
    const fechaJs = new Date();
    const nuevoMensaje = {
      usuario: data.usuario,
      mensaje: data.mensaje,
      fecha: fechaJs.getTime()
    };

    await db.collection('chat').add({
      usuario: nuevoMensaje.usuario,
      mensaje: nuevoMensaje.mensaje,
      fecha: fechaJs // Guardar como Date en Firestore
    });
    io.emit('chat message', nuevoMensaje);
  });
});




server.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000, http://localhost:3000', server.address().port);
});