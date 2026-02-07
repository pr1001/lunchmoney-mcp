import { z } from "zod";
import { encode as toonEncode } from "@toon-format/toon";
import * as fs from "node:fs";
import * as path from "node:path";

export const responseFormatSchema = z
    .enum(["json", "toon"])
    .optional()
    .default("json")
    .describe(
        "Response format: 'json' (default) or 'toon' (Token-Oriented Object Notation). " +
        "TOON reduces token usage by ~40% for uniform arrays."
    );

export const responseModeSchema = z
    .enum(["inline", "file"])
    .optional()
    .default("inline")
    .describe(
        "Response mode: 'inline' (default) returns data in the response. " +
        "'file' writes data to a temp file and returns the path with a summary, " +
        "keeping the context window small for large result sets."
    );

export type ResponseFormat = z.infer<typeof responseFormatSchema>;
export type ResponseMode = z.infer<typeof responseModeSchema>;

const TMP_DIR = "/tmp/lunchmoney-mcp";

interface FormatOptions {
    toolName: string;
    summary?: string;
}

export function formatResponse(
    data: unknown,
    format: ResponseFormat = "json",
    mode: ResponseMode = "inline",
    options: FormatOptions
): { content: Array<{ type: "text"; text: string }> } {
    const text = format === "toon"
        ? toonEncode(data)
        : JSON.stringify(data);

    if (mode === "file") {
        fs.mkdirSync(TMP_DIR, { recursive: true });
        const ext = format === "toon" ? "toon" : "json";
        const filename = `${options.toolName}-${Date.now()}.${ext}`;
        const filePath = path.join(TMP_DIR, filename);
        fs.writeFileSync(filePath, text, "utf-8");

        const sizeKB = (Buffer.byteLength(text, "utf-8") / 1024).toFixed(1);
        const summaryLine = options.summary ?? "Data written to file";

        return {
            content: [{
                type: "text",
                text: `${summaryLine}\nFile: ${filePath}\nFormat: ${format}\nSize: ${sizeKB} KB`,
            }],
        };
    }

    return { content: [{ type: "text", text }] };
}
