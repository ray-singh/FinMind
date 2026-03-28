import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

function getS3Client() {
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.')
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getBucket() {
  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) throw new Error('AWS_S3_BUCKET environment variable is not set.')
  return bucket
}

/**
 * Upload a CSV file to S3.
 * Key format: uploads/{userId}/{timestamp}-{filename}
 * Returns the S3 object key.
 */
export async function uploadCsvToS3(
  userId: string,
  filename: string,
  content: string
): Promise<string> {
  const client = getS3Client()
  const bucket = getBucket()
  const key = `uploads/${userId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: 'text/csv',
      Metadata: {
        userId,
        originalFilename: filename,
        uploadedAt: new Date().toISOString(),
      },
    })
  )

  return key
}

/**
 * Retrieve a previously uploaded CSV from S3 by key.
 * Returns the file content as a string.
 */
export async function getCsvFromS3(key: string): Promise<string> {
  const client = getS3Client()
  const bucket = getBucket()

  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  )

  if (!response.Body) throw new Error(`No body in S3 response for key: ${key}`)
  return response.Body.transformToString()
}
