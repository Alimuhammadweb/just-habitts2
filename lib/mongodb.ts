import { MongoClient, type Db } from "mongodb"

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://elbek4561_db_user:K2SN2nQsMzvuCOT6@cluster0.mvbeldr.mongodb.net/taxi_bot?appName=Cluster0"

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = await MongoClient.connect(uri)
  const db = client.db("habits_app")

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export async function getDb() {
  const { db } = await connectToDatabase()
  return db
}
