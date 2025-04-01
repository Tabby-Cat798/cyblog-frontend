import { MongoClient } from 'mongodb';

// 使用环境变量中的连接字符串，如果不存在则使用一个空字符串（会在后面处理）
const uri = process.env.MONGODB_URI || '';
const options = {};

let client;
let clientPromise;

// 如果没有提供MongoDB连接字符串，提供一个模拟客户端
if (!uri) {
  console.warn('警告: MONGODB_URI未设置，使用模拟数据');

  // 创建模拟客户端
  const mockClient = {
    db: () => ({
      collection: () => ({
        find: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => ({
                toArray: () => Promise.resolve([])
              })
            })
          })
        }),
        findOne: () => Promise.resolve(null),
        countDocuments: () => Promise.resolve(0),
        updateOne: () => Promise.resolve({ matchedCount: 1, modifiedCount: 1 })
      })
    })
  };
  
  clientPromise = Promise.resolve(mockClient);
} else if (process.env.NODE_ENV === 'development') {
  // 在开发环境中，使用全局变量，这样热重载不会每次都创建新的连接
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch(err => {
      console.error('MongoDB连接失败:', err);
      return mockClient;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 在生产环境中，为每个请求创建新的连接
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch(err => {
    console.error('MongoDB连接失败:', err);
    return mockClient;
  });
}

export default clientPromise; 