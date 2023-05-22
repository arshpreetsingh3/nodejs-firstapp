// const http = require('http');

//console.log(http);
//How to create a server?
//Function, variable everything is a module in node js
//types of modules 
//file based module
//build in modulle
//third party module




// const server = http.createServer((req,res)=>{
//     console.log(req.url);
//     res.end("<h1>Noice</h1>");
// });

// server.listen(6000, ()=>{
//     console.log("Server is listening");
// });


// const a =  500;


// const avg = {
//     average: (a,b) => {
//         console.log((a+b)/2);
//     },
//     percent:(a,b) =>{
//         console.log((a/b)*100);
//     }
// }

// module.exports = avg;

// //built in module eg fs 

// const fs = require("fs");
// console.log(fs);

// fs.readFile("./sample.txt","utf-8",(err,data)=>{
//     if(err){
//         return err;
//     }
//     console.log(data);
// })

// const b = fs.readFileSync("./sample.txt","utf-8");
// console.log(b);
// console.log("I am first");


//better approach 
// const {readFileSync} = require("fs");

// const c = readFileSync("./sample.txt","utf-8");
//readfile is an asynchronous function 

// const d = "This is for test";

// fs.writeFile("./sample1.txt",d,(err,data)=>{
//     console.log("Written");
// })

// const path = require("path");
// const result = path.extname("/NODEJS/index.js");
// console.log("result",result);

// const os = require("os");
// console.log(os.freemem());
// console.log(os.hostname());


import http from "http";
import fs from "fs";    

//thirs party modules 
const PORT = 4000;
const hostname = "localhost";
// const home = fs.readFileSync("./index.html", "utf8");
// const gfName = require("./app.js")
// console.log(gfname)
import gfname from "./app.js";

console.log(gfname)
//Synchronous Reading 

// const home = fs.readFileSync("./index.html");


// const server = http.createServer((req,res)=>{

//     console.log("url",req.url);

//     if(req.url === "/"){
//         //Asynchronous reading 
//         fs.readFile("./index.html",(err,data)=>{
//             console.log(data);
//             res.end(data);
//         })
//         // return res.end("<h1>Home Page</h1>");
//     }
//     else if (req.url === "/home"){
//         res.end(home);
//     }
//     else if(req.url === "/about"){
//         return res.end("<h1>About Page</h1>");
//     }
//     else if(req.url === "/service"){
//         return res.end("<h1>Service Page</h1>");
//     }
//     else if(req.url === "/me"){
//         return res.end("<h1>Me Page</h1>");
//     }
//     else{
//         return res.end("<h1>404 Page Not Found</h1>");
//     }
// });

// console.log(__dirname);


// server.listen(PORT,hostname,()=>{
//     console.log("Server is working on http://localhost:4000");
// })

import express  from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";



mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName: "backend",
})
.then(() => console.log("Database is Connected"))
.catch((e)=>console.log(e));

const messageSchema = new mongoose.Schema({
    name:String,
    email:String,
});

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password: String,
});

//creating a collection below with the name - Message 
const User = mongoose.model("User",userSchema)

const app = express();
const users = [];

// app.get("/",(req,res)=>{

//   const pathlocation = path.resolve();
//   console.log(path.join(pathlocation,"./index.html"));

  //for static files
  //res.sendFile(path.join(pathlocation,"./index.html"));

  //for dynamic data we use render method

  //res.send("hi");
  //res.sendStatus(404);
  //res.status(400).send("xyz");
 
// });


//for all the statis files we need to use express.static and all the static files should be kept in public folder

// console.log(path.join(path.resolve(),"public"));s
// express.static(path.join(path.resolve(),"public"));
//the above is a middleware and cant be used direclty like this thus we need to do the following in order to use this 
//all files in public or frontend code will go in public folder 
app.use(express.static(path.join(path.resolve(),"public")));

//the below middleware is used to access data from the form 
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

//setting up view engine

app.set('view engine', 'ejs');

const isAuthenticated = async (req,res,next)=>{
        const {token} = req.cookies;
        // console.log(req.cookies);
        if(token){

            const decoded_data = jwt.verify(token,"randomsecret")
            console.log(decoded_data);
            req.user = await User.findById(decoded_data._id)
            // res.render("logout")
            next();
        }
        else{
            res.redirect("/login")
        }
};

app.get("/",isAuthenticated,(req,res)=>{
    console.log(req.user);
    res.render("logout",{name: req.user.name});
});


app.get("/login",(req,res)=>{
    console.log(req.user);
    res.render("login");
});


app.get("/register",(req,res)=>{
    console.log(req.user);
    res.render("register");
});


app.post("/login",async (req,res)=>{
    console.log(req.body);
    const {email, password} = req.body;

    let user = await User.findOne({email});
    if(!user){
        console.log("register first");
        return res.redirect("/register");
    }

    const isMatch = await bcrypt.compare(password,user.password);


    if(!isMatch){
        return res.render("login",{email,message:"Incorrect PASSWORD"});
    }
    //creating a token for the user
    const token = jwt.sign({_id:user._id},"randomsecret");
    console.log(token);

    res.cookie("token",token,{
        httpOnly:true,
        expires: new Date(Date.now()+60*1000)
    });
    res.redirect("/");

    //using redirect stopping infinite reload as we are not rendering anything here 
});




app.post("/register",async (req,res)=>{
    console.log(req.body);
    const {name, email, password} = req.body;

    let user = await User.findOne({email});
    if(user){
        console.log("register first");
        return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password,10);
    user =  await User.create({
        name: name,
        email: email,
        password: hashedPassword,
    })

    //creating a token for the user
    const token = jwt.sign({_id:user._id},"randomsecret");
    console.log(token);

    res.cookie("token",token,{
        httpOnly:true,
        expires: new Date(Date.now()+60*1000)
    });
    res.redirect("/");

    //using redirect stopping infinite reload as we are not rendering anything here 
});

app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires: new Date(Date.now()),
    });
    res.redirect("/");
    //using redirect stopping infinite reload as we are not rendering anything here 
});


app.get("/add",async (req,res)=>{
    await Message.create({name:"Arsh1",email:"sarshpreet077@gmail.com"}).then(()=>{
        res.send("Nice");
    });
});

app.get("/success",(req,res)=>{
    res.render("success");
});

app.get("/users",(req,res)=>{
    res.json({
        users,
    })
})




// app.post("/contact",async (req,res)=>{
//     console.log(req.body);
//     // const formData =  users.push({username:req.body.name, email:req.body.email });
//     //console.log(formData);
//     // await Message.create({name:req.body.name, email:req.body.email});
//     //best way is to destructure the object 
//     const {name, email} = req.body;
//     await Message.create({name:name, email:email});
//     //res.render("success");
//     res.redirect("success");
//     //we can create a success.ejs page with some success mssg 


//     //comes as undefined as we cant access this 
//     //thus we need to use middlewares to access the data 
//     //the form is using post request and the action is the url which is specified 
// })
app.listen(4000,()=>{
    console.log("Server is working on http://localhost:4000");
});