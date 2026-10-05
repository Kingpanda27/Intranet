import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  
  const baseUploadsDir = resolve(process.cwd(), "public", "uploads");
  const targetPath = resolve(baseUploadsDir, ...path);

  // Prevención de Path Traversal: asegurar que el destino está dentro de public/uploads
  if (!targetPath.startsWith(baseUploadsDir)) {
    return new NextResponse("Acceso no autorizado", { status: 403 });
  }

  if (!existsSync(targetPath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(targetPath);
    
    // Determine content type based on extension
    const ext = targetPath.split('.').pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "gif") contentType = "image/gif";
    else if (ext === "webp") contentType = "image/webp";
    else if (ext === "svg") contentType = "image/svg+xml";
    else if (ext === "avif") contentType = "image/avif";
    else if (ext === "heic") contentType = "image/heic";
    else if (ext === "heif") contentType = "image/heif";
    else if (ext === "pdf") contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
