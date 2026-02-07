import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig } from "../config.js";
import { Tag } from "../types.js";
import { responseFormatSchema, responseModeSchema, formatResponse } from "../response.js";

export function registerTagTools(server: McpServer) {
    server.tool(
        "get_all_tags",
        "Get a list of all tags associated with the user's account.",
        {
            input: z.object({
                response_format: responseFormatSchema,
                response_mode: responseModeSchema,
            }),
        },
        async ({ input }) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            const response = await fetch(`${baseUrl}/tags`, {
                headers: {
                    Authorization: `Bearer ${lunchmoneyApiToken}`,
                },
            });

            if (!response.ok) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get all tags: ${response.statusText}`,
                        },
                    ],
                };
            }

            const tags: Tag[] = await response.json();

            return formatResponse(tags, input.response_format, input.response_mode, {
                toolName: "tags",
                summary: `${tags.length} tags`,
            });
        }
    );
}