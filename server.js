const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');

const connectDB = require('./config/db');

//Load enviroment variables
dotenv.config({ path: './config/config.env' });

//Connection to database
connectDB();

const app = express();

//Middlewares
const errorHandler = require('./middleware/error');

//Body parser middleware
app.use(express.json());

//Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


//Route files
const bootcamps = require('./routes/bootcamps');

//Mount routers
app.use('/api/v1/bootcamps', bootcamps)

//Error middleware
app.use(errorHandler);
const PORT = process.env.PORT || 5000;

const server = app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port`.green.underline.bold + `: ${PORT}`.yellow)
);

//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    //Close server & exit process
    server.close(() => process.exit(1));
});