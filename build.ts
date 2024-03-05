/// <reference lib="deno.window" />
import {
  build,
  type BuildOptions,
  emptyDir,
} from "https://deno.land/x/dnt@0.40.0/mod.ts";
import config from "./deno.json" with { type: "json" };

await emptyDir("./npm");

await build({
  entryPoints: ["./src/mod.ts"],
  outDir: "./npm",
  shims: {
    deno: false,
  },
  compilerOptions: config.compilerOptions as BuildOptions["compilerOptions"],
  declaration: "inline",
  scriptModule: "umd",
  test: false,
  package: {
    name: "thevimagen",
    version: Deno.args[0],
    description: "Add VIM mode to all your websites",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/shreyassanthu77/thevimagen.git",
    },
    bugs: {
      url: "https://github.com/shreyassanthu77/thevimagen/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
