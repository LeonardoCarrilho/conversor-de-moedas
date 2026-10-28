import {test,expect} from "@playwright/test";
test("histórico adulterado não injeta HTML",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("conversor-moedas:historico:v1",JSON.stringify([{id:"x",origem:'<img src=x onerror=alert(1)>',destino:"BRL",valor:1,convertido:1,em:new Date().toISOString()}])));
 await page.goto("./");
 await expect(page.locator("#historico img")).toHaveCount(0);
 await page.locator("#moeda-origem").selectOption("BRL");
 await expect(page.locator("#moeda-origem")).toHaveValue("BRL");
});
