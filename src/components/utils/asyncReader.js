import { getAsset } from "./prepareAssets"
import * as pdfjsLib from 'https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.mjs';
//pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist/build/pdf.worker.mjs";


export function readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
    })
}

export function readAsImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        if (src instanceof Blob) {
            const url = window.URL.createObjectURL(src)
            img.src = url
        } else {
            img.src = src
        }
    })
}

export function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
export function readAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsText(file)
    })
}

export async function readAsPDF(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.mjs";
    const blob = new Blob([file])
    //const pdfOk_Status = await verifyPDF(blob) 
    const url = window.URL.createObjectURL(blob)
    return pdfjsLib.getDocument(url).promise
}



