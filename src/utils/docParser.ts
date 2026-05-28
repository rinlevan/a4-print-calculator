/**
 * Reads a legacy DOC file (OLE2 Compound Document) and extracts the page count
 * from the \x05SummaryInformation property set.
 * Operates entirely client-side without external dependencies.
 */
export async function readDocPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const view = new DataView(arrayBuffer);
    const uint8 = new Uint8Array(arrayBuffer);

    // FMTID_SummaryInformation GUID in little-endian byte array:
    // {F29F85E0-4FF9-1068-AB91-08002B27B3D9}
    const signature = [
      0xE0, 0x85, 0x9F, 0xF2, 
      0xF9, 0x4F, 
      0x68, 0x10, 
      0xAB, 0x91, 0x08, 0x00, 0x2B, 0x27, 0xB3, 0xD9
    ];

    // Scan the binary buffer to locate the SummaryInformation FMTID signature
    let fmtidIdx = -1;
    for (let i = 0; i <= uint8.length - signature.length; i++) {
      let match = true;
      for (let j = 0; j < signature.length; j++) {
        if (uint8[i + j] !== signature[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        fmtidIdx = i;
        break;
      }
    }

    if (fmtidIdx === -1) {
      throw new Error('Không tìm thấy thông tin Metadata trong file .doc.');
    }

    // The property set header starts 28 bytes before the FMTID
    const streamStartIdx = fmtidIdx - 28;
    if (streamStartIdx < 0) {
      throw new Error('Định dạng header Metadata không hợp lệ.');
    }

    // Read the offset of the section from the stream header (4 bytes at offset 44)
    if (streamStartIdx + 44 + 4 > view.byteLength) {
      throw new Error('Kích thước file quá ngắn hoặc bị lỗi.');
    }

    const secOffset = view.getUint32(streamStartIdx + 44, true);
    const sectionStartIdx = streamStartIdx + secOffset;

    if (sectionStartIdx + 8 > view.byteLength) {
      throw new Error('Vị trí phân vùng dữ liệu không hợp lệ.');
    }

    // Read section size and property count
    const sectionSize = view.getUint32(sectionStartIdx, true);
    const propCount = view.getUint32(sectionStartIdx + 4, true);

    if (sectionStartIdx + sectionSize > view.byteLength) {
      throw new Error('Dữ liệu phân vùng vượt quá kích thước file.');
    }

    if (sectionStartIdx + 8 + propCount * 8 > view.byteLength) {
      throw new Error('Số lượng thuộc tính Metadata không hợp lệ.');
    }

    // Loop through properties to find Property ID 14 (PID_PAGECOUNT)
    for (let i = 0; i < propCount; i++) {
      const entryIdx = sectionStartIdx + 8 + i * 8;
      const propId = view.getUint32(entryIdx, true);
      const propOffset = view.getUint32(entryIdx + 4, true);

      if (propId === 14) { // PID_PAGECOUNT
        const valIdx = sectionStartIdx + propOffset;
        if (valIdx + 8 > view.byteLength) {
          throw new Error('Vị trí giá trị thuộc tính vượt quá kích thước file.');
        }

        const propType = view.getUint32(valIdx, true);
        if (propType === 3) { // VT_I4 (32-bit signed integer)
          const pageCount = view.getInt32(valIdx + 4, true);
          if (pageCount > 0) {
            return pageCount;
          }
        }
      }
    }

    throw new Error('Không tìm thấy dữ liệu số trang trong file .doc.');
  } catch (error) {
    console.error('Lỗi khi đọc số trang file .doc:', error);
    throw error;
  }
}
