import { writeFileSync, unlinkSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const RELEASE_URL = "https://raw.githubusercontent.com/EPIC-M-T/bikini-contest/epic-models-and-talent-production/release.tar.br?release=03d1f2db3cb48220fb234baa96851c675f7009c405311c897d49c27384b3413b";
const EXPECTED_BR = "03d1f2db3cb48220fb234baa96851c675f7009c405311c897d49c27384b3413b";
const EXPECTED_TAR = "1570c9beca9c017ed4ee168ba1235d53b327adb364c6ca6976a67d1237a080a4";
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");

const response = await fetch(RELEASE_URL, { cache: "no-store" });
if (!response.ok) throw new Error(`Release download failed: ${response.status}`);
const br = Buffer.from(await response.arrayBuffer());
if (hash(br) !== EXPECTED_BR) throw new Error("Release artifact checksum mismatch");

const tar = brotliDecompressSync(br);
if (hash(tar) !== EXPECTED_TAR) throw new Error("Expanded release checksum mismatch");

writeFileSync("release.tar", tar);
const result = spawnSync("tar", ["-xf", "release.tar", "-C", "."], { stdio: "inherit" });
unlinkSync("release.tar");
if (result.status !== 0) throw new Error("Release extraction failed");

console.log("EPIC media and layout update verified and extracted.");
