import mongoose from 'mongoose'

let isConnected = false

export const connectToDB = async () => {
    mongoose.set('strictQuery', true)

    if (!process.env.MONGODB_URL)
        return console.log('MONGODB_URL not specified')

    if (isConnected)
        return console.log('Already Connected')

    try {
        await mongoose.connect(process.env.MONGODB_URL)
        isConnected = true
        console.log('Connected to MongoDB')
    } catch (error: any) {
        console.error('Error connecting to MongoDB', error.message)
    }


}