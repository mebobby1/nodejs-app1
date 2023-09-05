import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName:"backend",
}).then(()=> console.log("Database  connected")).catch((e)=> console.log(e))


const Userschema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
});

const usersData = mongoose.model("Users", Userschema)

const app = express();

// Using Middlewares

app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// Setting up view Engine
app.set("view engine", "ejs")


const isAuthenticated = async(req,res, next)=>{
    
    const token = req.cookies.token

    if(token){

        const decoded = jwt.verify( token, "udhiwgfeiewgffdb")

        req.user = await usersData.findById(decoded._id)

        next();
    }
    else {
        res.render("login");
    }

};

app.get("/", isAuthenticated, (req, res)=>{

    console.log(req.user);
    
    res.render("logout", { name: req.user.name })
});

app.get("/register", (req,res)=>{

    res.render("register")
})

app.get("/login", (req,res)=>{
    res.redirect("/login")
})


app.post("/login", async (req, res)=>{

    const { email, password } = req.body;

let user = await usersData.findOne({email})

if(!user) return res.redirect("/register")

const isMatch = await bcrypt.compare(password, user.password);

if(!isMatch) return res.render("login", { email, message: "Incorrect Password" })

const token = jwt.sign({_id: user._id}, "udhiwgfeiewgffdb");
    
    res.cookie("token", token , {
        httpOnly: true,
        expires: new Date(Date.now() + 60*1000)
    });
    res.redirect("/");


})


app.post("/register", async (req,res)=>{

    const { name, email, password } = req.body;

    let user = await usersData.findOne({email});

    if(user){
        return res.redirect("/login")
    }

    const hassedPassword = await bcrypt.hash(password, 10)

     user = await usersData.create({
        name,
        email,
        password: hassedPassword,
    })


    const token = jwt.sign({_id: user._id}, "udhiwgfeiewgffdb");
    
    res.cookie("token", token , {
        httpOnly: true,
        expires: new Date(Date.now() + 60*1000)
    });
    res.redirect("/");
})



app.get("/logout", (req,res)=>{

    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    })
    res.redirect("/")
})


















// This is all Api when we use for page render then it is called route 

// app.get("/success", ( req,res ) => {

//     res.render("success");

// })

// app.post("/contact", async(req, res) => {

//     const { name, email } = req.body; 

//     await Messge.create({ name,email })

//     res.redirect("/success")

// })

// When we use for read data then it is Api 


// app.get("/users", (req, res) => {

//     res.json({
//         users 
//     })
// })


app.listen(5000,()=>{
    console.log("Server is working")
});