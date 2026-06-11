import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!uri) {
  throw new Error('缺少必需的 MONGODB_URI 环境变量');
} else if (process.env.NODE_ENV === 'development') {
  // 在开发环境中，使用全局变量，这样热重载不会每次都创建新的连接
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 在生产环境中，为每个请求创建新的连接
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
