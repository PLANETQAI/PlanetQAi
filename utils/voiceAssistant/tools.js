export const tools = [
    {
        type: "function",
        name: "generate_song",
        description: "Generate a new AI song from a theme or lyrics idea.",
        parameters: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "The title of the song"
                },
                prompt: {
                    type: "string",
                    description: "The main idea, theme, or lyrics to inspire the song"
                }
            },
            required: ["title", "prompt"]
        }
    }
];
