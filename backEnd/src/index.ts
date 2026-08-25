import express from 'express'
import 'dotenv/config'
import { bootStrapApp } from './app/bootstrap/index'

const app=express()



const PORT = Number(process.env.PORT) || 8000

bootStrapApp(app,PORT)


