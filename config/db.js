const mongoose = require('mongoose');

const connectDB = async() => {
    let conn = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });

    console.log(`MongoDB Connected:`.green.underline.bold + ` ${conn.connection.host}`.cyan);
}

module.exports = connectDB;