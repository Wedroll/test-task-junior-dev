import express, { Express, Request, Response } from 'express';
import multer, { StorageEngine } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

const app: Express = express();
app.use(cors());
const uploadDir: string = path.join(__dirname, 'uploads');
const port: number = 3000;

interface FileMetadata{
  filename: string;
  uploadedAt: number;
  lastDownloadedAt?: number;
}

const fileMetadata: { [key: string]: FileMetadata} = {};

const publicPath = path.join(__dirname, '..', 'public');
console.log('Public path:', publicPath);
app.use(express.static(publicPath, {index: 'index.html'}));

if(!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir);
}

const storage: StorageEngine = multer.diskStorage({
  destination: uploadDir,
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) =>{
    const uniqueFilename: string = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({storage: storage});

app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  console.log('Received file:', req.file);
  if(!req.file){
    res.status(400).json({message: 'No file uploaded'});
    return;
  }
  const fileUrl: string = `/download/${req.file.filename}`;
  fileMetadata[req.file.filename] = {
    filename: req.file.filename,
    uploadedAt: Date.now(),
  };
  res.status(200).json({link: fileUrl});
});

app.get('/download/:filename', (req: Request, res: Response) =>{
  const filePath = path.join(uploadDir, req.params.filename);
  console.log('Tryining to serve file:', filePath);
  if(fs.existsSync(filePath)){
    fileMetadata[req.params.filename] = {
      ...fileMetadata[req.params.filename],
      lastDownloadedAt: Date.now(),
    };
    res.sendFile(filePath);
  }else{
    res.status(404).json({message: 'File not found'});
  }
});

const cleanOldFiles = () => {
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  for(const filename in fileMetadata){
    const meta = fileMetadata[filename];
    const lastAccessed = meta.lastDownloadedAt || meta.uploadedAt;
    if(now - lastAccessed > thirtyDaysInMs){
      const filePath = path.join(uploadDir, filename);
      if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath);
        delete fileMetadata[filename];
        console.log(`Deleted old file: ${filename}`);
      }
    }
  }
};

setInterval(cleanOldFiles, 1000);

app.listen(port, () =>{
  console.log(`Server running at http://localhost:${port}`);
});