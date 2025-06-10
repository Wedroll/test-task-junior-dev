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

const publicPath = path.join(__dirname, '..', 'public');
console.log('Public path:', publicPath);

app.use(express.static(publicPath, { index: 'index.html' }));

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage: StorageEngine = multer.diskStorage({
  destination: uploadDir,
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueFilename: string = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage: storage });


app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  console.log('Received file:', req.file);
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const fileUrl: string = `/download/${req.file.filename}`;
  res.status(200).json({ link: fileUrl });
});


app.get('/download/:filename', (req: Request, res: Response) => {
  const filePath = path.join(uploadDir, req.params.filename);
  console.log('Trying to serve file:', filePath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});