/**
 * Convert an AudioBuffer to WAV format buffer
 * @param audioBuffer - The AudioBuffer to convert
 * @returns ArrayBuffer containing WAV data
 */
export function audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
    const numOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numOfChannels * bytesPerSample;
    
    const buffer = audioBuffer.getChannelData(0);
    const length = buffer.length;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const arrayBuffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(arrayBuffer);
    
    // RIFF chunk descriptor
    writeString(dataView, 0, 'RIFF');
    dataView.setUint32(4, totalSize - 8, true);
    writeString(dataView, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(dataView, 12, 'fmt ');
    dataView.setUint32(16, 16, true); // fmt chunk size
    dataView.setUint16(20, format, true);
    dataView.setUint16(22, numOfChannels, true);
    dataView.setUint32(24, sampleRate, true);
    dataView.setUint32(28, byteRate, true);
    dataView.setUint16(32, blockAlign, true);
    dataView.setUint16(34, bitDepth, true);
    
    // data sub-chunk
    writeString(dataView, 36, 'data');
    dataView.setUint32(40, dataSize, true);
    
    // write PCM samples
    const offset = 44;
    const volume = 1;
    for (let i = 0; i < length; i++) {
        const sample = buffer[i] * volume;
        const pos = offset + (i * bytesPerSample);
        dataView.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    }
    
    return arrayBuffer;
}

function writeString(dataView: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        dataView.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Validates a WAV file blob
 * @param blob - The blob to validate
 * @returns Promise<boolean>
 */
export async function validateWavFile(blob: Blob): Promise<boolean> {
    // WAV file must be at least 44 bytes (header size)
    if (blob.size < 44) {
        return false;
    }

    try {
        const buffer = await blob.arrayBuffer();
        const view = new DataView(buffer);
        
        // Check RIFF header
        const riff = String.fromCharCode(
            view.getUint8(0),
            view.getUint8(1),
            view.getUint8(2),
            view.getUint8(3)
        );
        
        if (riff !== 'RIFF') {
            return false;
        }
        
        // Check WAVE format
        const wave = String.fromCharCode(
            view.getUint8(8),
            view.getUint8(9),
            view.getUint8(10),
            view.getUint8(11)
        );
        
        if (wave !== 'WAVE') {
            return false;
        }
        
        // Check fmt chunk
        const fmt = String.fromCharCode(
            view.getUint8(12),
            view.getUint8(13),
            view.getUint8(14),
            view.getUint8(15)
        );
        
        if (fmt !== 'fmt ') {
            return false;
        }
        
        // Check format code (1 = PCM)
        const formatCode = view.getUint16(20, true);
        if (formatCode !== 1) {
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('Error validating WAV file:', e);
        return false;
    }
}
