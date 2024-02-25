const express = require("express");
const bodyParser = require("body-parser");
const cors=require('cors');
const mongoose = require("mongoose");
const { MongoClient } = require('mongodb');
 const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({}));

const url = 'mongodb://localhost:27017';

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://localhost:27017/Authentication_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', () => console.log("Error in Connecting to Database"));
db.once('open', () => console.log("Connected to Database"));

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model('User', userSchema);

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log("ddddd")
    const user = await User.findOne({ username, password });
    console.info("user=====>", user);

    if (user) {
         const token = jwt.sign({username},'VE7azPxFWK4U3d!Lq#b6n9j6H');
        res.status(200).send({ success: true, message:"Valid credentials", user });
         res.status(200).json({token});
    } else {
        res.status(401).send({ error: 'Invalid credentials' });
    }
});

const client = new MongoClient(url, { useUnifiedTopology: true });

client.connect(err => {
    if (err) {
        console.error('Error connecting to MongoDB:', err);
        return;
    }
    console.log('Connected to MongoDB');

});

const itemsCollection = client.db('Authentication_db').collection('items_collection');


app.get('/items', async (req, res) => {
    console.log("DDDDDD", req);

    const items = await itemsCollection.find({}).toArray();
    console.log("items=======>", items);

    if (items && Array.isArray(items) && items.length > 0) {
        res.send({ status: 200, success: true, message: 'Login successful', items });
    } else {
        res.status(401).send({ error: 'No users found' });
    }
});

app.get('/items/:itemId', async (req, res) => {
    const itemId = req.params.itemId;

    try {
        const item = await itemsCollection.findOne({ itemId });
        if (!item) {
            res.status(404).json({ success: false, error: 'Item not found' });
            return;
        }
        res.json({ success: true, item });
    } catch (error) {
        console.error('Error fetching item details:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.put('/update/:itemId',  async (req, res) => {
    const { itemId } = req.params;
    const { newQuantity } = req.body;
    try {
        const item = await itemsCollection.findOneAndUpdate({ itemId }, { $set: { quantity: newQuantity } }, { new: true });
        if (item) {
            res.json({ message: 'Item updated successfully', updatedItem: item });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    jwt.verify(token, 'VE7azPxFWK4U3d!Lq#b6n9j6H', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.username = decoded.username;
        next();
    });
}

app.get("/", (req, res) => {
    res.set({
        "Allow-access-Allow-Origin": '*'
    })
    return res.redirect('loginpage.html');
});

const hostname = '';
const port = 3001;
app.listen(port, () => {
    console.log('Server running at port 3001');
});
