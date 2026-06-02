const express = require ('express');
const morgan = require ('morgan');
const helmet = require('helmet');
const dotenv = require ('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashBoard');
const checkInRoutes = require('./routes/checkIns');
const paymentRoutes = require('./routes/payments');



dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

connectDB();

//Middleware
app.use(helmet()); 
app.use(morgan('dev'));
app.use(cors({
    origin: process.env.CLIENT_URL || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));

app.use('/payments', paymentRoutes);
app.use('/api/payments', paymentRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.get("/", (request, response) => {
    response.json({ message: "Align backend is running." });
});

app.get('/health', (request, response) => {
    response.json({
        status: 'healthy',
        date: new Date().toISOString()
    });
});

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/check-ins', checkInRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/check-ins', checkInRoutes);

app.listen(PORT, ()=> {
    console.log(`Server listening on port ${PORT}`);
});
