const express = require("express");
const app = express();
const cookie_parser = require("cookie-parser");
const auth = require("../src/routes/authentication.route");
const chat = require("../src/routes/chat.routes");
const cors = require("cors");
const path = require("path");

// Middlewares here--
app.use(express.json());
app.use(cookie_parser());
app.use(cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // allow cookies/headers
}));
app.use(express.static(path.join(__dirname,'../public')))

// routes ---
app.use("/api", auth)
app.use("/api", chat)

app.get("*name",(req,res)=>{
    res.sendFile(path.join(__dirname,'../public/index.html'))
})



module.exports = app;