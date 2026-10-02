# GaragePro — APK com atualizações pelo GitHub

Fazes isto **uma vez só**. Depois, cada atualização é: substituir `www/index.html` no GitHub → esperar ~10 minutos → no telemóvel, **Definições → Atualizações → Verificar**.

---

## O que está nesta pasta

| Ficheiro | Para quê |
|---|---|
| `www/index.html` | A app (é este o ficheiro que vais trocando nas atualizações) |
| `assets/icon.png` | Ícone da app no telemóvel |
| `capacitor.config.json` | Nome e identificador da app (`pt.bbtecnodev.garagepro`). **Nunca mudes o `appId`**, senão o Android trata-a como outra app |
| `package.json` | Peças que o GitHub instala para gerar o APK |
| `.github/workflows/gerar-apk.yml` | A automação que gera, assina e publica o APK |
| `scripts/notas.js` | Lê a versão e o changelog da app para as notas da atualização |
| `criar-chave.bat` | Cria a tua chave de assinatura (no Windows) |

---

## Passo 1 — Conta e repositório no GitHub

1. Cria conta em <https://github.com> (se ainda não tens).
2. Canto superior direito **+ → New repository**.
3. Nome: `garagepro` · **Public** · não marques mais nada · **Create repository**.

> Tem de ser **público** para o telemóvel conseguir ver e descarregar as atualizações sem palavra-passe. O que fica público é o **código** da app — os teus dados (clientes, carros, valores) ficam só no telemóvel.

## Passo 2 — Carregar os ficheiros

1. Extrai o ZIP no PC.
2. No repositório, carrega em **uploading an existing file**.
3. Arrasta **todo o conteúdo** da pasta (incluindo a pasta `.github`) para a página.
   - Se a pasta `.github` não aparecer no Windows: Explorador → **Ver → Mostrar → Itens ocultos**.
4. Em baixo, **Commit changes**.

Confirma que no repositório aparecem `www`, `assets`, `scripts`, `.github`, etc.

> A automação vai arrancar logo e **falhar** com "Faltam os segredos". É normal — ainda não criaste a chave (passos 3 e 4).

## Passo 3 — Criar a chave de assinatura (no PC, uma vez)

O Android só aceita atualizações assinadas **sempre com a mesma chave**.

1. Instala o Java: <https://adoptium.net> → **Temurin 21 (LTS)** → instalador `.msi` → seguinte, seguinte (deixa marcada a opção que adiciona ao PATH).
2. Copia o `criar-chave.bat` para uma pasta tua **fora** do repositório (ex.: `Documentos\GaragePro-chave`).
3. Duplo clique no `criar-chave.bat` → escolhe uma palavra-passe (6+ caracteres, sem espaços).
4. Ficam dois ficheiros:
   - `garagepro.jks` → **a tua chave**. Guarda cópias (pen + Google Drive) e a palavra-passe num sítio seguro.
   - `garagepro-chave-base64.txt` → o texto para o GitHub.

> ⚠️ Se perderes a chave ou a palavra-passe, o telemóvel deixa de aceitar atualizações e tens de desinstalar a app (perdes os dados se não tiveres cópia). **Nunca** carregues estes ficheiros para o repositório.

## Passo 4 — Pôr a chave no GitHub (segredos)

No repositório: **Settings → Secrets and variables → Actions → New repository secret**. Cria dois:

| Name | Secret |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | todo o conteúdo do `garagepro-chave-base64.txt` (abre com o Bloco de Notas, Ctrl+A, Ctrl+C) |
| `ANDROID_KEYSTORE_PASSWORD` | a palavra-passe que escolheste |

## Passo 5 — Gerar o primeiro APK

1. Separador **Actions** → à esquerda **Gerar APK** → **Run workflow** → **Run workflow**.
2. Espera ~8–12 minutos até ficar com ✅ verde.
   - Se ficar ❌ vermelho: abre-o, carrega no passo que falhou, copia as últimas linhas e manda-mas.
3. Na página principal do repositório, à direita, aparece **Releases → GaragePro v0.4 (compilação N)**.

## Passo 6 — Instalar no telemóvel / tablet

1. No telemóvel abre `https://github.com/O-TEU-UTILIZADOR/garagepro/releases/latest`.
2. Toca no ficheiro `GaragePro-v….apk` → descarrega → abre.
3. O Android pede para **permitir instalar apps desta origem** (do Chrome) → permite → **Instalar**.
4. Pode aparecer um aviso do Play Protect ("app desconhecida") → **Instalar mesmo assim**. É normal para apps que não vêm da Play Store.

## Passo 7 — Passar os teus dados (uma vez)

A app instalada começa **vazia** (é uma app nova para o Android).

1. Na versão que usas hoje: **Definições → Exportar cópia de segurança** → guarda o ficheiro `.json` (ou envia-o para ti por WhatsApp/e-mail).
2. Na app instalada: **Definições → Importar cópia de segurança** → escolhe esse ficheiro.

---

## Como mandar uma atualização (sempre igual)

1. Recebes de mim o `index.html` novo.
2. No GitHub, abre a pasta `www` → **Add file → Upload files** → arrasta o `index.html` novo → **Commit changes**.
3. O GitHub gera sozinho o APK novo (~10 min, vês em **Actions**).
4. No telemóvel: **Definições → Atualizações → Verificar atualizações → Descarregar e instalar** → toca na notificação de transferência → **Atualizar**.
   - Se deixares ligada a opção "Verificar ao abrir a app", aparece um ponto vermelho em **Definições** quando houver versão nova.

Os dados mantêm-se nas atualizações. Antes de cada uma, a app guarda também uma **cópia automática** (vês e restauras em Definições → Atualizações).

**Versões:** cada envio gera uma compilação nova (o número sobe sempre). A versão (0.4, 0.5…) muda por dia, como combinámos — duas atualizações no mesmo dia aparecem como, por exemplo, v0.5 compilação 12 e v0.5 compilação 13, e o telemóvel apanha as duas.

## Problemas comuns

- **"App não instalada" ao atualizar** → o APK foi assinado com outra chave. Confirma que os segredos do passo 4 não foram trocados.
- **"Ainda não há nenhuma versão publicada"** → a automação ainda não acabou ou falhou (vê em **Actions**).
- **"O GitHub limitou os pedidos"** → verificaste muitas vezes seguidas; espera uns minutos.
- **iPad / iPhone** → este método não funciona; a Apple não permite instalar APK nem apps fora da App Store.
