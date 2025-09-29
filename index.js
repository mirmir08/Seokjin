const net = require('net');
const  server = net.createServer();

server.on('connection', (socket) =>{
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
})




server.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000', server.address().port);
});