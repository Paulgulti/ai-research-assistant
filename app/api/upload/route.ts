import { NextResponse } from "next/server"
import { PDFParse } from "pdf-parse";
import { getData } from "pdf-parse/worker";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
    let parser: PDFParse | undefined
    try {
        const formData = await request.formData()
        const file = formData.get('file')

        // Make sure a file was provided
        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "Please upload a PDF file." },
                { status: 400 },
            )
        }

        // Validate file size
        if (file.size === 0) {
            return NextResponse.json(
                { error: "The uploaded file is empty." },
                { status: 400 }
            );
        }
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "The PDF must be 10 MB or smaller." },
                { status: 413 }
            );
        }

        // Check the file extension
        if (!file.name.toLowerCase().endsWith(".pdf")) {
            return NextResponse.json(
                { error: "Only PDF files are allowed." },
                { status: 400 }
            );
        }

        // Read the uploaded file into a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Check the PDF signature (%PDF)
        const signature = buffer.subarray(0, 5).toString();

        if (signature !== "%PDF-") {
            return NextResponse.json(
                { error: "The uploaded file is not a valid PDF." },
                { status: 400 }
            );
        }
        // Create the PDF parser
        parser = new PDFParse({ data: buffer })
        PDFParse.setWorker(getData());

        //  Extract text from the PDF
        const result = await parser.getText()
        const text = result.text.trim()
        if (!text) {
            return NextResponse.json(
                {
                    error:
                        "No readable text was found. This PDF may contain scanned pages that need OCR.",
                },
                { status: 422 }
            );
        }
        return NextResponse.json({
            filename: file.name,
            text
        })
    } catch (error) {
        console.error("PDF upload error:", error);

        return NextResponse.json(
            { error: "Unable to process this PDF. Please try another file." },
            { status: 500 }
        );
    } finally {
        if (parser) {
            await parser.destroy();
        }
    }
}