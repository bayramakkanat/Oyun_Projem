/**
 * setVersion.js
 * Build öncesi çalışır. package.json'daki versiyonu ve git commit hash'ini
 * src/version.js dosyasına yazar. React bu dosyayı import ederek
 * oyun içinde versiyon bilgisini gösterir.
 */

const { execSync } = require("child_process");
const fs           = require("fs");
const path         = require("path");

const pkg     = require("../package.json");
const version = pkg.version;

let commitHash = "dev";
try {
  commitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch {
  // Git erişimi yoksa (CI ortamı vs.) "dev" kalır
}

const content = `// Otomatik üretilir — düzenleme!
// Build: node scripts/setVersion.js
const APP_VERSION = "${version}";
const APP_COMMIT  = "${commitHash}";
const APP_FULL    = "v${version}-${commitHash}";
export { APP_VERSION, APP_COMMIT, APP_FULL };
`;

const outPath = path.join(__dirname, "../src/version.js");
fs.writeFileSync(outPath, content, "utf8");
console.log(`[setVersion] v${version}-${commitHash} → src/version.js`);
