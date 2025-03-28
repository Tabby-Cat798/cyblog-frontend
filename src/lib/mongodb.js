import { MongoClient } from 'mongodb';

// 使用环境变量中的连接字符串，如果不存在则使用硬编码的连接字符串
const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
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