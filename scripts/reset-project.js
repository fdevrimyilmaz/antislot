#!/usr/bin/env node

/**
 * Bu betik projeyi boş bir duruma sıfırlamak için kullanılır.
 * Kullanıcı girdisine göre /app, /components, /hooks, /scripts ve /constants dizinlerini /app-example dizinine taşır veya siler ve yeni bir /app dizininde index.tsx ve _layout.tsx dosyaları oluşturur.
 * Çalıştırdıktan sonra package.json içinden `reset-project` betiğini kaldırabilir ve bu dosyayı güvenle silebilirsiniz.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const root = process.cwd();
const oldDirs = ["app", "components", "hooks", "constants", "scripts"];
const exampleDir = "app-example";
const newAppDir = "app";
const exampleDirPath = path.join(root, exampleDir);

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Bu ekranı düzenlemek için app/index.tsx dosyasını düzenleyin.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const moveDirectories = async (userInput) => {
  try {
    if (userInput === "y") {
      // app-example dizinini oluştur
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} dizini oluşturuldu.`);
    }

    // Eski dizinleri yeni app-example dizinine taşı veya sil
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      try {
        await fs.promises.access(oldDirPath);
        // Dizin mevcut
        if (userInput === "y") {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`➡️ /${dir} dizini /${exampleDir}/${dir} konumuna taşındı.`);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /${dir} silindi.`);
        }
      } catch {
        // Dizin mevcut değil
        console.log(`➡️ /${dir} yok, atlanıyor.`);
      }
    }

    // Yeni /app dizinini oluştur
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log("\n📁 Yeni /app dizini oluşturuldu.");

    // index.tsx oluştur
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);
    console.log("📄 app/index.tsx oluşturuldu.");

    // _layout.tsx oluştur
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log("📄 app/_layout.tsx oluşturuldu.");

    console.log("\n✅ Proje sıfırlama tamamlandı. Sonraki adımlar:");
    console.log(
      `1. Geliştirme sunucusunu başlatmak için \`npx expo start\` çalıştırın.\n2. Ana ekranı düzenlemek için app/index.tsx dosyasını düzenleyin.${
        userInput === "y"
          ? `\n3. Referans için işiniz bittiğinde /${exampleDir} dizinini silin.`
          : ""
      }`
    );
  } catch (error) {
    console.error(`❌ Betik çalıştırılırken hata: ${error.message}`);
  }
};

rl.question(
  "Mevcut dosyaları silmek yerine /app-example dizinine taşımak ister misiniz? (Y/n): ",
  (answer) => {
    const userInput = answer.trim().toLowerCase() || "y";
    if (userInput === "y" || userInput === "n") {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      console.log("❌ Geçersiz giriş. Lütfen 'Y' veya 'N' girin.");
      rl.close();
    }
  }
);
