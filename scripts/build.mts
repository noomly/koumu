import esbuild from "esbuild";

await esbuild.build({
    platform: "node",
    bundle: true,
    format: "cjs",
    minify: true,
    outfile: "build/berk.js",
    entryPoints: ["src/index.ts"],
});
