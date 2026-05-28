import type { FileType } from '../types';

/**
 * Returns the file type category based on its extension.
 */
export function getFileType(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'doc') return 'doc';
  return 'unknown';
}

/**
 * Recursively traverses a FileSystemEntry (from Drag & Drop webkitGetAsEntry).
 */
async function traverseEntry(
  entry: any, // FileSystemEntry
  filesAccumulator: { file: File; relativePath: string }[],
  currentPath = ''
): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      entry.file(resolve, reject);
    });
    filesAccumulator.push({ file, relativePath: currentPath + entry.name });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    
    const readEntries = () => new Promise<any[]>((resolve, reject) => {
      dirReader.readEntries(resolve, reject);
    });
    
    let entries = await readEntries();
    // Read recursively in chunks since readEntries might be paginated
    const allEntries: any[] = [];
    while (entries.length > 0) {
      allEntries.push(...entries);
      entries = await readEntries();
    }

    for (const childEntry of allEntries) {
      await traverseEntry(childEntry, filesAccumulator, currentPath + entry.name + '/');
    }
  }
}

/**
 * Parses items from a DragEvent to reconstruct folders and their internal files.
 */
export async function readDroppedFolders(items: DataTransferItemList): Promise<{ folderName: string; files: File[] }[]> {
  const folderMap = new Map<string, File[]>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== 'file') continue;
    
    // webkitGetAsEntry is standard in modern desktop browsers
    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    if (!entry) continue;

    if (entry.isDirectory) {
      const filesAccumulator: { file: File; relativePath: string }[] = [];
      await traverseEntry(entry, filesAccumulator);
      const folderFiles = filesAccumulator.map(f => f.file);
      const existing = folderMap.get(entry.name) || [];
      folderMap.set(entry.name, [...existing, ...folderFiles]);
    } else if (entry.isFile) {
      const file = item.getAsFile();
      if (file) {
        const key = 'Tài liệu ngoài thư mục';
        const existing = folderMap.get(key) || [];
        folderMap.set(key, [...existing, file]);
      }
    }
  }

  const results: { folderName: string; files: File[] }[] = [];
  folderMap.forEach((files, folderName) => {
    results.push({ folderName, files });
  });
  return results;
}

/**
 * Parses files from a standard file input (using webkitRelativePath for grouping).
 */
export function readInputFolders(fileList: FileList): { folderName: string; files: File[] }[] {
  const folderMap = new Map<string, File[]>();

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    let folderName = 'Tài liệu ngoài thư mục';
    
    if (file.webkitRelativePath) {
      const parts = file.webkitRelativePath.split('/');
      if (parts.length > 1) {
        folderName = parts[0];
      }
    }
    
    const existing = folderMap.get(folderName) || [];
    folderMap.set(folderName, [...existing, file]);
  }

  const results: { folderName: string; files: File[] }[] = [];
  folderMap.forEach((files, folderName) => {
    results.push({ folderName, files });
  });
  return results;
}
