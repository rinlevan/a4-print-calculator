import JSZip from 'jszip';

/**
 * Reads a DOCX file (OpenXML format) and extracts the page count from docProps/app.xml.
 * Operates entirely client-side.
 */
export async function readDocxPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const appXmlFile = zip.file('docProps/app.xml');
    if (!appXmlFile) {
      throw new Error('Missing docProps/app.xml. File may be corrupted or created in an incompatible editor.');
    }
    
    const xmlText = await appXmlFile.async('text');
    
    // Try browser-native DOMParser first
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check if there is a Pages tag
    const pagesElements = xmlDoc.getElementsByTagName('Pages');
    if (pagesElements.length > 0 && pagesElements[0].textContent) {
      const pageCount = parseInt(pagesElements[0].textContent.trim(), 10);
      if (!isNaN(pageCount) && pageCount > 0) {
        return pageCount;
      }
    }
    
    // Fallback: Regex extraction in case of XML parse discrepancies
    const regexMatch = xmlText.match(/<Pages>(\d+)<\/Pages>/i);
    if (regexMatch && regexMatch[1]) {
      const pageCount = parseInt(regexMatch[1], 10);
      if (!isNaN(pageCount) && pageCount > 0) {
        return pageCount;
      }
    }
    
    throw new Error('Page count metadata (Pages tag) not found in the file.');
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to parse DOCX structure');
  }
}
