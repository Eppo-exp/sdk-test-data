import { config as configDotenv } from 'dotenv'
import { resolve } from 'path'

configDotenv({
    path: resolve(__dirname, "../.env")
});
