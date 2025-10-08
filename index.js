//coneccion al servidor socket
//const net = require('net');
//const  server = net.createServer();
//En vez de estos se utilizara el socket.io porque es dentro de un entorno web


//Para poder hacer un servidor web con express
const express = require('express');
//Importa el modulo HTTP  para crear el servidor
const http = require('http');
//Para la comunicacion en tiempo real osea WebSocket
const socketIO = require('socket.io');
//Para manejar rutas y archivos
const path = require('path');
//Cuando se importa el Firebase Admin SDK para conectarse a Firebase
const admin = require('firebase-admin');
//Para la clave privada del firebase (como es peligorso conectarse directo)
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

//Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//Se obtine la coneccion con firebase
const db = admin.firestore();

//Crear la app de express
const app = express();
//Crear el servidor HTTP usando express
const server = http.createServer(app);
//Se activa el servidor sobre el servidor HTTP
const io = socketIO(server);


//Se inica que se usara ejs como motor de plantillas
app.set('view engine', 'ejs');
//Se indica donde se encuentra la carpeta de vistas (donde estan los ejs)
app.set('views', path.join(__dirname, 'views'));
//Se idica donde se encuentran los archivos estaticos (como los css y js)
app.use(express.static(path.join(__dirname, 'public')));
//Permitir recibir datos de archvos HTML
app.use(express.urlencoded({ extended: true }));

//Cuando alguen acceda a la ruta se ejecuara lo siguiente
app.get('/', (req, res) => {
  res.render('login');//Se envia el archivo login.ejs
});


//Cuando el usuario coloca el nombre se activa esta ruta (al chat.js que este muestra el chat)
app.post('/chat', async (req, res) => {
  const username = req.body.username;//Del formulario se obtiene el nombre y llo coloca en una variable
  const snapshot = await db.collection('chat').orderBy('fecha').get(); //busca los mensajes en el firestore en chat y los ordena por fecha (await es para esperar que contesten) (Este se ejecuta cunado el usuario entra para ver los chats anterioses)
  const mensajes = snapshot.docs.map(doc => doc.data());//recorre los datos obtenidos y los coloca en una forma facil de manejar

  //Se mandan estos datos al chat.ejs para colocarse en el chat.js
  res.render('chat', { username, mensajes });
});


//Cuando un usuario se conecta  (osea que entra al chat)
io.on('connection', async (socket) => {
  // Obtine los mensajes de firebase y se ordenan por fecha (se carga cada vez que se conecta un usuario o recarga la pagina)
  const snapshot = await db.collection('chat').orderBy('fecha').get();
  //Aqui salio error hay que tener en cuanta que la fecha en firestore es un objeto date y se obtine un timestamp
  // Convertir Firestore Timestamp a milisegundos
  const mensajes = snapshot.docs.map(doc => { //Recorrer todos los documentos obtenidos
    const data = doc.data();//nos manda un objeto con propiedades que son usuario, mensaje y fecha
    //Se crea un nuevo objeto con los datos que se enviaran
    return {
      usuario: data.usuario,
      mensaje: data.mensaje,
      // Cuando lees un mensaje desde Firestore, el campo fecha puede venir en diferentes formatos
      fecha: data.fecha instanceof Date //Vrificar si es un objeto Date
        ? data.fecha.getTime()// Si es Date, convertir a milisegundos
        : (data.fecha._seconds ? data.fecha._seconds * 1000 : Date.now()) //si no es, se checha la propiedad de segundos y se mmultiplica por 1000 convirtiendolo en segundos
        //: Date.now() si no tiene  nada se usa la fecha actual
    };
  });
  // Enviar el historial de mensajes al cliente que se conectó, ose que se envia al chat.js para que los muestre
  socket.emit('chat history', mensajes);

//Cuando se manda un nuevo mensaje se manda al chat.js para ser mostrado
//CUando un usuario envia un mensaje se escucha este evento que esta en chat.js y este se ejecuta
  socket.on('chat message', async (data) => {
    const fechaJs = new Date();//Se crea un objeto Date con la fecha actual (para mandar a chat.js)
    const nuevoMensaje = {//Se crea un nuevo objeto con los datos que se enviaran
      usuario: data.usuario,
      mensaje: data.mensaje,
      fecha: fechaJs.getTime()//Cando se tomo la fecha exacta anterirmente se convierte a milisegundos (para enviar a firebase)
    };
//Guardar el nuevo mensaje en Firestore
    await db.collection('chat').add({
      usuario: nuevoMensaje.usuario,
      mensaje: nuevoMensaje.mensaje,
      fecha: fechaJs // Guardar como Date en Firestore
    });
    //Lo manda a todos los usuarios conectados
    io.emit('chat message', nuevoMensaje);
  });
});




server.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000, http://localhost:3000', server.address().port);
});