import {test,expect} from "@playwright/test";
for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test.describe("jornada em " + viewport.width + "px", () => {
    test.use({ viewport });
test("histórico adulterado não injeta HTML",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("conversor-moedas:historico:v1",JSON.stringify([{id:"x",origem:'<img src=x onerror=alert(1)>',destino:"BRL",valor:1,convertido:1,em:new Date().toISOString()}])));
 await page.goto("./");
 await expect(page.locator("#historico img")).toHaveCount(0);
 await page.locator("#moeda-origem").selectOption("BRL");
 await expect(page.locator("#moeda-origem")).toHaveValue("BRL");
});

  });
}
