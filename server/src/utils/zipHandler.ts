import JSZip from 'jszip';

export interface ZipFile {
  name: string;
  content: Buffer;
  mimetype: string;
}

export const extractZipFiles = async (buffer: Buffer): Promise<ZipFile[]> => {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(buffer);
  const files: ZipFile[] = [];

  for (const [filename, file] of Object.entries(zipContent.files)) {
    if (file.dir) continue;

    // Only process resume file types
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'doc', 'txt'].includes(ext)) continue;

    const content = await file.async('nodebuffer');
    const mimetype = getMimeType(ext);

    files.push({
      name: filename,
      content,
      mimetype
    });
  }

  return files;
};

const getMimeType = (extension: string): string => {
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};
