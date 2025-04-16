import { getAsset } from "./prepareAssets";
//import * as pdfjsLib from "https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.mjs";
//import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
//import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
	//"https://unpkg.com/pdfjs-dist/build/pdf.worker.mjs";
	//"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.mjs";
	new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

export function readAsArrayBuffer(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsArrayBuffer(file);
	});
}

export function readAsImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		if (src instanceof Blob) {
			const url = window.URL.createObjectURL(src);
			img.src = url;
		} else {
			img.src = src;
		}
	});
}

export function readAsDataURL(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
export function readAsText(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsText(file);
	});
}

export async function readAsPDF(file) {
	// pdfjsLib.GlobalWorkerOptions.workerSrc =
	//   'https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.mjs';
	const blob = new Blob([file]);

	const url = window.URL.createObjectURL(blob);
	return pdfjsLib.getDocument(url).promise;
}
