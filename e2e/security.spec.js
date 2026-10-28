import { test, expect } from "@playwright/test";
test("build abre sem erros e aplica CSP", async ({ page }) => {
 const errors=[]; page.on("pageerror",e=>errors.push(e.message));
 await page.goto("./");
 await expect(page.locator("body")).toBeVisible();
 await expect(page.locator("h1").first()).toBeVisible();
 const csp=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
 expect(csp).toContain("script-src 'self'");
 expect(csp).toContain("object-src 'none'");
 expect(errors).toEqual([]);
});
test("artefato não expõe arquivos internos",async({request})=>{
 for(const file of [".env",".git/config","package.json"]){
 const response=await request.get("./"+file);
 const text=await response.text();
 expect(text).not.toContain("[core]");
 expect(text).not.toContain('"devDependencies"');
 expect(text).not.toContain("JWT_SECRET=");
 }
});
