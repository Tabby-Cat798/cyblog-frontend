import OSS from 'ali-oss';

// 创建OSS客户端
const createOSSClient = () => {
  // 检查环境变量是否设置
  if (!process.env.ALIYUN_OSS_REGION || 
      !process.env.ALIYUN_OSS_ACCESS_KEY_ID || 
      !process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || 
      !process.env.ALIYUN_OSS_BUCKET) {
    throw new Error('阿里云OSS配置不完整，请检查环境变量');
  }

  return new OSS({
    region: process.env.ALIYUN_OSS_REGION,
    accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
    bucket: process.env.ALIYUN_OSS_BUCKET,
    secure: true, // 使用HTTPS
  });
};

/**
 * 上传文件到阿里云OSS
 * @param {Buffer} fileBuffer - 文件数据Buffer
 * @param {string} fileName - 文件名
 * @param {string} folder - 存储的文件夹路径
 * @returns {Promise<string>} 上传成功后的URL
 */
export const uploadToOSS = async (fileBuffer, fileName, folder = 'avatars') => {
  try {
    const client = createOSSClient();
    
    // 生成唯一文件名以避免冲突
    const uniqueFileName = `${folder}/${Date.now()}_${fileName}`;
    
    // 上传文件
    const result = await client.put(uniqueFileName, fileBuffer);
    
    // 返回文件URL
    if (result && result.url) {
      return result.url;
    } 
    
    // 如果结果中没有URL，则自行构建URL
    return `https://${process.env.ALIYUN_OSS_BUCKET}.oss-${process.env.ALIYUN_OSS_REGION}.aliyuncs.com/${uniqueFileName}`;
  } catch (error) {
    console.error('OSS上传失败:', error);
    throw new Error(`文件上传失败: ${error.message}`);
  }
};

/**
 * 从base64编码的数据URL创建Buffer
 * @param {string} dataURL - base64数据URL
 * @returns {Buffer} 文件数据Buffer
 */
export const dataURLToBuffer = (dataURL) => {
  // 从数据URL中提取base64编码部分
  const matches = dataURL.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('无效的数据URL');
  }
  
  // 提取MIME类型和base64字符串
  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  
  return { buffer, mimeType };
};

export default {
  uploadToOSS,
  dataURLToBuffer
}; 