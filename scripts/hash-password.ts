/**
 * `pnpm auth:hash '<password>'` — print the scrypt hash string for
 * AUTH_WES_HASH / AUTH_RIA_HASH. The password itself never enters the repo or
 * any env file; only this derived hash does.
 */
import { hashPassword } from "../src/lib/auth/password";

// pnpm forwards a literal `--` through to the script — skip it, it's the
// args terminator, not the password.
const args = process.argv.slice(2).filter((a, i) => !(a === "--" && i === 0));
const password = args[0];
if (!password) {
  console.error("Usage: pnpm auth:hash '<password>'");
  process.exit(1);
}
console.log(hashPassword(password));
