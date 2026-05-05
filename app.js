const express = require ('express');

const app = express();

const PORT = 3000;


app.listen(PORT, () =>{
    console.log(`Server listening on port ${PORT}`);
});

app.get("/", (request, response) => {
    response.send("Hello World!");
});

app.listen(PORT, ()=> {
    console.log(`Server listening on port ${PORT}`);
});