const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const session = require("express-session");

const app = express();
app.use(express.static('public'));
dotenv.config();

const port = process.env.PORT || 3000;
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.9iigw6q.mongodb.net/user`);


app.use(session({
    secret: 'xyz', // Specify your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure to true if using HTTPS
}));

const registrationSchema = new mongoose.Schema({
    name : String,
    email : String,
    password : String
});

const Registration = mongoose.model("Registration", registrationSchema);


// preference schema

const preferenceSchema = new mongoose.Schema({
    email: String,
    preference: String
});

// Define Preference model
const Preference = mongoose.model("Preference", preferenceSchema);

app.use(bodyParser.urlencoded ({extended: true}));
app.use(bodyParser.json());

app.get("/", (req, res)=>{
    res.sendFile(__dirname+"/public/register.html")
})

// register feature

app.post("/register", async (req, res)=>{
    try{
        const {name, email, password} = req.body;

        const existingUser = await Registration.findOne({email : email});
        if(!existingUser){
          const registreationData = new Registration({
            name,
            email,
            password
        });  
            await registreationData.save();
            
            res.redirect("/success");
        }else{
            console.log("User already exist");
            res.redirect("/error");
        }
        
        
    }
    catch(error){
        console.log(error);
        res.redirect("error");
    }
})

app.get("/success", (req, res)=>{
    res.sendFile(__dirname+"/public/login_reg.html");
})
app.get("/error", (req, res)=>{
    res.sendFile(__dirname+"/public/register_err.html");
})



// Login feature
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await Registration.findOne({ email: email });
        if (existingUser) {
            if (existingUser.password === password) {
                // Password matches, consider it a successful login
                req.session.email = email;
                res.redirect("/login_success");
            } else {
                // Password does not match
                console.log("Incorrect password");
                res.redirect("/password_error");
            }
        } else {
            // User does not exist
            console.log("User does not exist");
            res.redirect("/login_error");
        }
    } catch (error) {
        console.log(error);
        res.redirect("/login_error");
    }
});


app.get("/login_success", (req, res)=>{
    res.sendFile(__dirname+"/public/home.html");
})
app.get("/login_error", (req, res)=>{
    res.sendFile(__dirname+"/public/login_err.html");
})
app.get("/password_error", (req, res)=>{
    res.sendFile(__dirname+"/public/password_error.html");
})

// saving user preference

app.post("/save-preference", async (req, res) => {
    try {
        const email = req.session.email ;
        const { preference } = req.body;

        // Save preference to the database
        const newPreference = new Preference({ email, preference });
        await newPreference.save();

        res.json({ success: true });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});

app.listen(port, ()=>{
    console.log(`server is running on port ${port}`);
})