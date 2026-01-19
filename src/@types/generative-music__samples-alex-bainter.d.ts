declare module "@generative-music/samples-alex-bainter" {
    export default function getSamples(options?: {
        format?: "wav" | "mp3" | "ogg";
    }): Record<string, any>;
}